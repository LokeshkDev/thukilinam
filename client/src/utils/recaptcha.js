/**
 * Google reCAPTCHA Client Integration Utility
 * Seamlessly integrates Google reCAPTCHA (v3 invisible or fallback).
 * If VITE_RECAPTCHA_SITE_KEY is not set, it gracefully returns null so dev flow is uninterrupted.
 */

let scriptLoadingPromise = null;

export const loadRecaptchaScript = () => {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  if (!siteKey || siteKey.trim() === '') {
    return Promise.resolve(null);
  }

  if (window.grecaptcha) {
    return Promise.resolve(window.grecaptcha);
  }

  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  scriptLoadingPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.grecaptcha) {
        window.grecaptcha.ready(() => resolve(window.grecaptcha));
      } else {
        resolve(null);
      }
    };
    script.onerror = () => {
      console.warn('[reCAPTCHA] Failed to load Google reCAPTCHA script.');
      resolve(null);
    };
    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
};

/**
 * Executes reCAPTCHA action and returns client token
 * @param {string} action - Action name (e.g., 'checkout', 'review')
 * @returns {Promise<string|null>}
 */
export const getRecaptchaToken = async (action = 'submit') => {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  if (!siteKey || siteKey.trim() === '') {
    return null;
  }

  try {
    const grecaptcha = await loadRecaptchaScript();
    if (!grecaptcha || typeof grecaptcha.execute !== 'function') {
      return null;
    }

    return await new Promise((resolve) => {
      grecaptcha.ready(async () => {
        try {
          const token = await grecaptcha.execute(siteKey, { action });
          resolve(token);
        } catch (err) {
          console.warn('[reCAPTCHA] Token execution failed:', err);
          resolve(null);
        }
      });
    });
  } catch (e) {
    console.warn('[reCAPTCHA] Unexpected error:', e);
    return null;
  }
};

