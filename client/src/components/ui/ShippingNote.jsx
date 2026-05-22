import React from 'react';
import { useSettings } from '../../context/SettingsContext';
import { getShippingMessage } from '../../utils/shipping';

const ShippingNote = ({ subtotal = 0, shipping = 0, couponFreeShipping = false }) => {
  const { settings } = useSettings();
  const msg = getShippingMessage(subtotal, settings?.shipping);

  if (couponFreeShipping) {
    return (
      <div className="shipping-note shipping-note--success">
        <span>Free shipping applied with your coupon.</span>
      </div>
    );
  }

  if (shipping === 0 && msg.type === 'unlocked') {
    return (
      <div className="shipping-note shipping-note--success">
        <span>{msg.message}</span>
      </div>
    );
  }

  if (msg.type === 'progress' && msg.threshold > 0) {
    const progress = Math.min(100, (subtotal / msg.threshold) * 100);
    return (
      <div className="shipping-note shipping-note--progress">
        <div className="shipping-note-head">
          <span>{msg.message}</span>
          <span className="shipping-note-fee">Now: ₹{Number(shipping).toLocaleString('en-IN')}</span>
        </div>
        <div className="shipping-progress-bar" aria-hidden="true">
          <div className="shipping-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
    );
  }

  if (msg.type === 'free') {
    return (
      <div className="shipping-note shipping-note--success">
        <span>{msg.message}</span>
      </div>
    );
  }

  return (
    <div className="shipping-note">
      <span>{msg.message}</span>
    </div>
  );
};

export default ShippingNote;
