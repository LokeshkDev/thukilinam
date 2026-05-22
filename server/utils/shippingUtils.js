const DEFAULT_SHIPPING = {
  enabled: true,
  standard_cost: 149,
  free_threshold: 2999
};

function parseSettingValue(value) {
  if (value && typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

async function getShippingSettings(pool) {
  try {
    const [rows] = await pool.query(
      "SELECT setting_value FROM cms_settings WHERE setting_key = 'shipping'"
    );
    if (!rows.length) return { ...DEFAULT_SHIPPING };
    return { ...DEFAULT_SHIPPING, ...parseSettingValue(rows[0].setting_value) };
  } catch {
    return { ...DEFAULT_SHIPPING };
  }
}

function calculateShipping(subtotal, settings = DEFAULT_SHIPPING, options = {}) {
  const { forceFree = false } = options;
  if (forceFree) return 0;

  const enabled = settings.enabled !== false;
  if (!enabled) return 0;

  const threshold = Number(settings.free_threshold) || 0;
  const cost = Math.max(0, Number(settings.standard_cost) || 0);
  const amount = Number(subtotal) || 0;

  if (threshold > 0 && amount >= threshold) return 0;
  return cost;
}

module.exports = {
  DEFAULT_SHIPPING,
  getShippingSettings,
  calculateShipping
};
