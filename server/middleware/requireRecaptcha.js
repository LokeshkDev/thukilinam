const { verifyRecaptchaToken } = require('../utils/recaptchaUtils');

/**
 * Express middleware to protect critical endpoints from bot automation,
 * credential stuffing, fake order submissions, and spam.
 */
const requireRecaptcha = async (req, res, next) => {
  try {
    const token =
      req.body?.recaptcha_token ||
      req.headers['x-recaptcha-token'] ||
      req.query?.recaptcha_token;

    const clientIp =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      req.ip;

    const result = await verifyRecaptchaToken(token, clientIp);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || 'Security check failed. Please refresh and try again.'
      });
    }

    req.recaptcha = result;
    next();
  } catch (err) {
    console.error('Error in requireRecaptcha middleware:', err);
    next(err);
  }
};

module.exports = requireRecaptcha;

