const https = require('https');
const querystring = require('querystring');
require('dotenv').config();

/**
 * Verify Google reCAPTCHA Token
 * @param {string} token - The reCAPTCHA response token from client
 * @param {string} remoteIp - Client's IP address (optional)
 * @returns {Promise<{success: boolean, score?: number, message?: string}>}
 */
function verifyRecaptchaToken(token, remoteIp = null) {
  return new Promise((resolve) => {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    // Graceful fallback if reCAPTCHA secret key is not configured in .env
    if (!secretKey || secretKey.trim() === '' || secretKey === 'your_recaptcha_secret_key_here') {
      console.warn('⚠️ [SECURITY] RECAPTCHA_SECRET_KEY not set in .env. Skipping reCAPTCHA check in dev mode.');
      return resolve({ success: true, bypassed: true });
    }

    if (!token) {
      return resolve({ success: false, message: 'reCAPTCHA token is missing.' });
    }

    const postData = querystring.stringify({
      secret: secretKey,
      response: token,
      ...(remoteIp ? { remoteip: remoteIp } : {})
    });

    const options = {
      hostname: 'www.google.com',
      port: 443,
      path: '/recaptcha/api/siteverify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 5000 // 5s timeout
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          // For v2: { success: true/false }
          // For v3: { success: true/false, score: 0.9, action: '...' }
          if (parsed.success) {
            // If v3 score is present, verify minimum score threshold (0.4)
            if (typeof parsed.score === 'number' && parsed.score < 0.4) {
              return resolve({ success: false, score: parsed.score, message: 'Low reCAPTCHA score detected. Possible bot activity.' });
            }
            resolve({ success: true, score: parsed.score || 1.0 });
          } else {
            const errCodes = (parsed['error-codes'] || []).join(', ');
            resolve({ success: false, message: `reCAPTCHA verification failed: ${errCodes || 'Invalid token'}` });
          }
        } catch (e) {
          console.error('[reCAPTCHA] Failed to parse Google response:', e.message);
          resolve({ success: false, message: 'Could not verify reCAPTCHA response.' });
        }
      });
    });

    req.on('error', (err) => {
      console.error('[reCAPTCHA] Verification request network error:', err.message);
      // In case Google servers are unreachable, allow graceful fail-open in non-strict mode or fail-closed
      if (process.env.NODE_ENV === 'production' && process.env.STRICT_CAPTCHA === 'true') {
        resolve({ success: false, message: 'Captcha service temporarily unreachable.' });
      } else {
        resolve({ success: true, bypassed: true });
      }
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: true, bypassed: true });
    });

    req.write(postData);
    req.end();
  });
}

module.exports = {
  verifyRecaptchaToken
};

