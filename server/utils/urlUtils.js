const firstUrl = (value, fallback) => {
  const source = value || fallback;
  return source.split(',')[0].trim().replace(/\/$/, '');
};

const getClientUrl = () => firstUrl(process.env.PUBLIC_CLIENT_URL || process.env.CLIENT_URL, 'http://localhost:5173');
const getAdminUrl = () => firstUrl(process.env.PUBLIC_ADMIN_URL || process.env.ADMIN_URL, 'http://localhost:5174');

module.exports = {
  firstUrl,
  getClientUrl,
  getAdminUrl
};
