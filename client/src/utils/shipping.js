export const DEFAULT_SHIPPING = {
  enabled: true,
  standard_cost: 149,
  free_threshold: 2999
};

export const getShippingSettings = (settings = {}) => ({
  ...DEFAULT_SHIPPING,
  ...(settings.shipping || {})
});

export const calculateShipping = (subtotal, shippingSettings, { couponFreeShipping = false } = {}) => {
  if (couponFreeShipping) return 0;

  const cfg = { ...DEFAULT_SHIPPING, ...shippingSettings };
  if (cfg.enabled === false) return 0;

  const threshold = Number(cfg.free_threshold) || 0;
  const cost = Math.max(0, Number(cfg.standard_cost) || 0);
  const amount = Number(subtotal) || 0;

  if (threshold > 0 && amount >= threshold) return 0;
  return cost;
};

export const getShippingMessage = (subtotal, shippingSettings) => {
  const cfg = { ...DEFAULT_SHIPPING, ...shippingSettings };
  if (cfg.enabled === false) {
    return { type: 'free', message: 'Complimentary shipping on all orders.' };
  }

  const threshold = Number(cfg.free_threshold) || 0;
  const cost = Math.max(0, Number(cfg.standard_cost) || 0);
  const amount = Number(subtotal) || 0;

  if (threshold > 0 && amount >= threshold) {
    return { type: 'unlocked', message: `Free shipping unlocked — orders over ₹${threshold.toLocaleString('en-IN')}.` };
  }

  if (threshold > 0) {
    const remaining = Math.max(0, threshold - amount);
    return {
      type: 'progress',
      message: `Add ₹${remaining.toLocaleString('en-IN')} more for free shipping.`,
      remaining,
      threshold,
      standardCost: cost
    };
  }

  return {
    type: 'standard',
    message: `Standard shipping: ₹${cost.toLocaleString('en-IN')} per order.`
  };
};
