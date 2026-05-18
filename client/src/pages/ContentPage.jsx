import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

const PAGE_DEFAULTS = {
  'secure-checkout': {
    eyebrow: 'Payment Safety',
    title: 'Secure Checkout',
    intro: 'Checkout with confidence using encrypted payment handling, clear totals, and order confirmation at every step.',
    points: ['Encrypted payment details', 'UPI, card, net banking, and COD-ready flow', 'Clear order summary before payment'],
    ctaLabel: 'Start Shopping',
    ctaUrl: '/shop'
  },
  'customer-care': {
    eyebrow: 'Support',
    title: 'Customer Care',
    intro: 'Reach our team for styling help, order updates, product details, and post-purchase support.',
    points: ['Friendly boutique assistance', 'Order and delivery support', 'Product size and fabric guidance'],
    ctaLabel: 'Browse Collection',
    ctaUrl: '/shop'
  },
  'exchange-policy': {
    eyebrow: 'Easy Help',
    title: 'Exchange Policy',
    intro: 'Exchange eligible items within the stated window when the product is unused, undamaged, and returned with tags.',
    points: ['Simple exchange requests', 'Quality check before approval', 'Support for size and color changes'],
    ctaLabel: 'Contact Support',
    ctaUrl: '/customer-care'
  },
  'shipping-details': {
    eyebrow: 'Delivery',
    title: 'Shipping Details',
    intro: 'We pack every order carefully and share updates so your boutique pieces reach you smoothly.',
    points: ['Free shipping on eligible orders', 'Careful boutique packaging', 'Tracking support after dispatch'],
    ctaLabel: 'View New In',
    ctaUrl: '/new-in'
  },
  stores: {
    eyebrow: 'About Us',
    title: 'Store & About Thukilinam',
    intro: 'Thukilinam is a boutique destination for sarees, kurti sets, fusion wear, and polished ethnic essentials.',
    points: ['Curated ethnic collections', 'Thoughtful customer support', 'Boutique-first shopping experience'],
    ctaLabel: 'Explore Sarees',
    ctaUrl: '/sarees'
  },
  help: {
    eyebrow: 'Help Center',
    title: 'How can we help?',
    intro: 'Find quick guidance for account access, wishlist, cart, checkout, shipping, and exchanges.',
    points: ['Login and account help', 'Cart and checkout guidance', 'Shipping and exchange information'],
    ctaLabel: 'Customer Care',
    ctaUrl: '/customer-care'
  }
};

const ContentPage = ({ pageKey }) => {
  const params = useParams();
  const key = pageKey || params.pageKey || 'help';
  const { settings } = useSettings();
  const page = {
    ...(PAGE_DEFAULTS[key] || PAGE_DEFAULTS.help),
    ...(settings?.content_pages?.[key] || {})
  };

  return (
    <main className="info-page">
      <section className="info-hero">
        <p className="eyebrow">{page.eyebrow}</p>
        <h1>{page.title}</h1>
        <p>{page.intro}</p>
        <Link to={page.ctaUrl || '/shop'} className="button primary">
          {page.ctaLabel || 'Shop Now'}
        </Link>
      </section>

      <section className="info-grid">
        {(page.points || []).map((point, index) => (
          <article key={point} className="info-card">
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h2>{point}</h2>
            <p>{page.detail || 'Designed to keep your boutique shopping experience clear, calm, and dependable.'}</p>
          </article>
        ))}
      </section>

      <section className="info-band">
        <div>
          <p className="eyebrow">Need More?</p>
          <h2>We are here to keep shopping simple.</h2>
        </div>
        <div className="home-auth-actions">
          <Link to="/help" className="button secondary">Help</Link>
          <Link to="/customer-care" className="button primary">Customer Care</Link>
        </div>
      </section>
    </main>
  );
};

export default ContentPage;
