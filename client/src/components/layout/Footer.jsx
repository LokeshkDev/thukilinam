import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';

const Footer = () => {
  const { settings } = useSettings();
  const aboutText = settings?.footer?.about_text || "Cool-toned boutique fashion for sarees, sets, and polished accessories.";
  const logoText = settings?.header?.logo_text || "Thukilinam";
  const socialLinks = settings?.footer?.social_links || {};
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <section>
          <Link className="brand footer-brand" to="/" aria-label={`${logoText} home`}>
            <img src="/assets/thukilinam-logo.jpeg" alt={`${logoText} logo`} />
            <span>{logoText}</span>
          </Link>
          <p>{aboutText}</p>
          <div className="social-row" aria-label="Social links">
            <a href={socialLinks.instagram || "#"} aria-label="Instagram">
              <svg className="icon" aria-hidden="true">
                <use href="#icon-instagram"></use>
              </svg>
            </a>
            <a href={socialLinks.facebook || "#"} aria-label="Facebook">
              <svg className="icon" aria-hidden="true">
                <use href="#icon-facebook"></use>
              </svg>
            </a>
            <a href={socialLinks.twitter || "#"} aria-label="Twitter">
              <svg className="icon" aria-hidden="true">
                <use href="#icon-youtube"></use>
              </svg>
            </a>
          </div>
        </section>

        <section>
          <h2>Shop</h2>
          <Link to="/new-in">New arrivals</Link>
          <Link to="/sarees">Sarees</Link>
          <Link to="/kurti-sets">Kurti sets</Link>
          <Link to="/fusion-wear">Fusion wear</Link>
          <Link to="/boutique-deals">Boutique deals</Link>
        </section>

        <section>
          <h2>Support</h2>
          <Link to="/secure-checkout">Secure checkout</Link>
          <Link to="/customer-care">Customer care</Link>
          <Link to="/exchange-policy">Exchange policy</Link>
          <Link to="/shipping-details">Shipping details</Link>
          <Link to="/stores">Store &amp; about us</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/help">Help</Link>
        </section>

        <section>
          <h2>Stay Updated</h2>
          <p>Get boutique drops, app-only deals, and style notes.</p>
          <form className="footer-form">
            <label>
              <span>Email</span>
              <input type="email" placeholder="you@example.com" />
            </label>
            <button type="button">Join</button>
          </form>
          <div className="payment-row" aria-label="Payment options">
            <span aria-label="UPI">
              <svg className="icon" aria-hidden="true">
                <use href="#icon-upi"></use>
              </svg>
            </span>
            <span aria-label="Card payments">
              <svg className="icon" aria-hidden="true">
                <use href="#icon-card"></use>
              </svg>
            </span>
            <span aria-label="Net banking">
              <svg className="icon" aria-hidden="true">
                <use href="#icon-bank"></use>
              </svg>
            </span>
          </div>
        </section>
      </div>
      <div className="footer-bottom">
        <span>2026 Thukilinam Boutique</span>
        <span>Secure checkout · Privacy · Terms</span>
      </div>
    </footer>
  );
};

export default Footer;
