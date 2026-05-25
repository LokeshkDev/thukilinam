/**
 * Cashfree PG helpers — keep server API host and client SDK mode in sync.
 * Set CASHFREE_ENV=production with production App ID + Secret.
 * Client must use the same mode (returned as cashfree_mode on order create).
 */

function getCashfreeMode() {
  const env = String(process.env.CASHFREE_ENV || 'sandbox').trim().toLowerCase();
  return env === 'production' || env === 'prod' ? 'production' : 'sandbox';
}

function getCashfreeApiHost() {
  return getCashfreeMode() === 'production' ? 'api.cashfree.com' : 'sandbox.cashfree.com';
}

function getCashfreeCredentials() {
  const appId = process.env.CASHFREE_APP_ID?.trim();
  const secret = process.env.CASHFREE_SECRET_KEY?.trim();
  return { appId, secret };
}

function assertCashfreeConfigured() {
  const { appId, secret } = getCashfreeCredentials();
  if (!appId || !secret) {
    throw new Error('Cashfree credentials missing. Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY in server .env');
  }
  const mode = getCashfreeMode();
  const looksSandboxKey = appId.startsWith('TEST') || appId.includes('test');
  if (mode === 'production' && looksSandboxKey) {
    throw new Error('CASHFREE_ENV is production but App ID looks like sandbox. Use production keys from Cashfree dashboard.');
  }
  if (mode === 'sandbox' && !looksSandboxKey && appId.length > 10) {
    console.warn('[Cashfree] CASHFREE_ENV=sandbox but App ID may be production — use TEST keys for sandbox.');
  }
}

function extractPaymentSessionId(cfResponse = {}) {
  return (
    cfResponse.payment_session_id ||
    cfResponse.payment_sessions_id ||
    cfResponse.data?.payment_session_id ||
    null
  );
}

module.exports = {
  getCashfreeMode,
  getCashfreeApiHost,
  getCashfreeCredentials,
  assertCashfreeConfigured,
  extractPaymentSessionId
};
