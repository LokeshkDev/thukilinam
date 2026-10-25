import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../api/axios';

const formatPrice = (value = 0) => `Rs. ${Number(value).toLocaleString('en-IN')}`;

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const navigate = useNavigate();
  const { clearCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'failed'
  const [errorMsg, setErrorMsg] = useState('');
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    if (!orderId) {
      setStatus('failed');
      setErrorMsg('No order information found in callback parameters.');
      setLoading(false);
      return;
    }

    verifyPayment();
  }, [orderId]);

  const verifyPayment = async () => {
    try {
      // 1. Verify payment status with backend
      const res = await api.post('/orders/verify', { order_id: orderId });
      
      if (res.data.success) {
        // 2. Clear frontend cart if successful
        clearCart();
        setStatus('success');
        
        // 3. Fetch order total and details to display
        try {
          if (res.data.order) { setOrderDetails(res.data.order); }
          const orderRes = await api.get(`/orders`).catch(() => ({ data: { success: false } }));
          if (orderRes.data.success && orderRes.data.orders.length > 0) {
            const currentOrder = orderRes.data.orders.find(o => o.order_number === orderId);
            if (currentOrder) {
              setOrderDetails(currentOrder);
            }
          }
        } catch (e) {
          console.error('Error fetching order total details:', e);
        }
      } else {
        setStatus('failed');
        setErrorMsg(res.data.message || 'Payment verification failed.');
      }
    } catch (err) {
      console.error('Payment verification request failed:', err);
      setStatus('failed');
      setErrorMsg(err.response?.data?.message || 'A network error occurred while verifying your payment.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="app-page" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loader-spinner" style={{
            width: '60px',
            height: '60px',
            border: '4px solid var(--line)',
            borderTop: '4px solid var(--purple-700)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 24px auto'
          }}></div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: 'var(--ink)' }}>Verifying Payment</h2>
          <p style={{ color: 'var(--muted)', fontSize: '15px' }}>Please do not close this window or click refresh. We are securing your order...</p>
        </div>
      </main>
    );
  }

  if (status === 'success') {
    return (
      <main className="app-page" style={{ minHeight: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom, transparent, var(--soft))' }}>
        <div className="auth-card" style={{ maxWidth: '500px', width: '100%', margin: '40px 20px', padding: '40px 32px', textAlign: 'center', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', background: 'var(--sheet)', border: '1px solid var(--line)' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'rgba(22, 163, 74, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px auto',
            color: '#16a34a',
            fontSize: '36px',
            animation: 'scaleUp 0.4s ease-out'
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <style>{`
            @keyframes scaleUp {
              0% { transform: scale(0); opacity: 0; }
              70% { transform: scale(1.15); }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>
          
          <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '12px', color: 'var(--ink)' }}>Payment Successful!</h1>
          <p style={{ color: 'var(--muted)', fontSize: '15px', lineHeight: '1.6', marginBottom: '32px' }}>
            Thank you for shopping with **Thukilinam**. Your transaction was completed successfully, and your order is now being processed.
          </p>

          <div style={{
            background: 'var(--soft)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid var(--line)',
            marginBottom: '36px',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
              <span style={{ color: 'var(--muted)' }}>Order ID:</span>
              <strong style={{ color: 'var(--ink)', fontFamily: 'monospace', fontSize: '15px' }}>{orderId}</strong>
            </div>
            {orderDetails && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--muted)' }}>Amount Paid:</span>
                <strong style={{ color: 'var(--purple-700)', fontSize: '16px' }}>{formatPrice(orderDetails.total)}</strong>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link to="/orders" className="button primary" style={{ justifyContent: 'center', width: '100%' }}>
              View Your Orders
            </Link>
            <Link to="/shop" className="button secondary" style={{ justifyContent: 'center', width: '100%' }}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Failed state
  return (
    <main className="app-page" style={{ minHeight: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom, transparent, var(--soft))' }}>
      <div className="auth-card" style={{ maxWidth: '500px', width: '100%', margin: '40px 20px', padding: '40px 32px', textAlign: 'center', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', background: 'var(--sheet)', border: '1px solid var(--line)' }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px auto',
          color: '#ef4444',
          fontSize: '36px',
          animation: 'scaleUp 0.4s ease-out'
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </div>

        <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '12px', color: 'var(--ink)' }}>Payment Failed</h1>
        <p style={{ color: 'var(--muted)', fontSize: '15px', lineHeight: '1.6', marginBottom: '32px' }}>
          {errorMsg || "We couldn't confirm your transaction details. If any amount was deducted, it will be automatically refunded within 3-5 business days."}
        </p>

        {orderId && (
          <div style={{
            background: 'var(--soft)',
            borderRadius: '12px',
            padding: '16px 20px',
            border: '1px solid var(--line)',
            marginBottom: '36px',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '14px',
            textAlign: 'left'
          }}>
            <span style={{ color: 'var(--muted)' }}>Reference Order ID:</span>
            <strong style={{ color: 'var(--ink)', fontFamily: 'monospace' }}>{orderId}</strong>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button onClick={() => navigate('/checkout')} className="button primary" style={{ justifyContent: 'center', width: '100%' }}>
            Return to Checkout
          </button>
          <Link to="/cart" className="button secondary" style={{ justifyContent: 'center', width: '100%' }}>
            Go Back to Shopping Bag
          </Link>
        </div>
      </div>
    </main>
  );
};

export default PaymentCallback;
