/**
 * Security & Sanitization Utilities
 * Protects against XSS, SQL injection anomalies, null-byte injections, and control-character attacks.
 */

// Strip HTML tags, script tags, event handlers, and control characters
function sanitizeString(input, maxLength = 1000) {
  if (typeof input !== 'string') return input;

  return input
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove script tags and contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove all HTML tags
    .replace(/<[^>]+>/g, '')
    // Remove dangerous javascript: / vbscript: URI schemes
    .replace(/(javascript|vbscript|data):/gi, '')
    // Strip control characters except newline and tab
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .slice(0, maxLength);
}

// Recursively sanitize all string fields in an object
function sanitizeObject(obj, maxDepth = 5) {
  if (maxDepth <= 0 || !obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, maxDepth - 1));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value, maxDepth - 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

// Clean and normalize 10-digit Indian phone number
function sanitizePhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/[^0-9]/g, '');
  return digits.slice(-10);
}

// Normalize and validate email address
function sanitizeEmail(email) {
  if (!email || typeof email !== 'string') return '';
  const cleaned = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(cleaned) ? cleaned.slice(0, 150) : '';
}

module.exports = {
  sanitizeString,
  sanitizeObject,
  sanitizePhone,
  sanitizeEmail
};

