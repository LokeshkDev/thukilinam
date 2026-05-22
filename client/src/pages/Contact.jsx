import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

const CONTACT_DEFAULTS = {
  eyebrow: 'Get in Touch',
  title: 'Contact Us',
  intro: 'Reach Thukilinam for orders, styling help, and boutique support. We are happy to assist you.',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  map_embed_url: ''
};

const digitsOnly = (value = '') => String(value).replace(/\D/g, '');

const buildTelHref = (phone) => {
  const digits = digitsOnly(phone);
  if (!digits) return null;
  return `tel:+${digits}`;
};

const buildWhatsAppHref = (whatsapp) => {
  const digits = digitsOnly(whatsapp);
  if (!digits) return null;
  return `https://wa.me/${digits}`;
};

const buildMailHref = (email) => {
  const trimmed = String(email || '').trim();
  if (!trimmed) return null;
  return `mailto:${trimmed}`;
};

const Contact = () => {
  const { settings } = useSettings();
  const contact = {
    ...CONTACT_DEFAULTS,
    ...(settings?.contact || {})
  };

  const phoneHref = buildTelHref(contact.phone);
  const whatsappHref = buildWhatsAppHref(contact.whatsapp);
  const mailHref = buildMailHref(contact.email);
  const mapUrl = String(contact.map_embed_url || '').trim();

  const contactItems = [
    {
      key: 'phone',
      label: 'Phone',
      value: contact.phone,
      href: phoneHref,
      icon: 'phone',
      cta: 'Call now'
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      value: contact.whatsapp,
      href: whatsappHref,
      icon: 'whatsapp',
      cta: 'Chat on WhatsApp'
    },
    {
      key: 'email',
      label: 'Email',
      value: contact.email,
      href: mailHref,
      icon: 'mail',
      cta: 'Send email'
    },
    {
      key: 'address',
      label: 'Store Location',
      value: contact.address,
      href: null,
      icon: 'map',
      cta: null
    }
  ].filter(item => item.value);

  return (
    <main className="contact-page">
      <section className="contact-hero">
        <p className="eyebrow">{contact.eyebrow}</p>
        <h1>{contact.title}</h1>
        <p>{contact.intro}</p>
      </section>

      {contactItems.length > 0 ? (
        <section className="contact-grid" aria-label="Contact methods">
          {contactItems.map(item => (
            <article key={item.key} className="contact-card">
              <div className="contact-card-icon" aria-hidden="true">
                <svg className="icon">
                  <use href={`#icon-${item.icon}`}></use>
                </svg>
              </div>
              <h2>{item.label}</h2>
              <p className="contact-card-value">{item.value}</p>
              {item.href ? (
                <a
                  href={item.href}
                  className="button secondary contact-card-action"
                  target={item.key === 'whatsapp' ? '_blank' : undefined}
                  rel={item.key === 'whatsapp' ? 'noopener noreferrer' : undefined}
                >
                  {item.cta}
                </a>
              ) : null}
            </article>
          ))}
        </section>
      ) : (
        <section className="contact-empty">
          <p>Contact details will appear here once configured in the admin CMS.</p>
        </section>
      )}

      {mapUrl && (
        <section className="contact-map-section" aria-label="Store location map">
          <div className="contact-map-header">
            <h2>Find us on the map</h2>
            {contact.address && <p>{contact.address}</p>}
          </div>
          <div className="contact-map-wrap">
            <iframe
              title="Thukilinam store location"
              src={mapUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </section>
      )}

      <section className="info-band">
        <div>
          <p className="eyebrow">Need help?</p>
          <h2>Explore support guides and policies.</h2>
        </div>
        <div className="home-auth-actions">
          <Link to="/help" className="button secondary">Help Center</Link>
          <Link to="/customer-care" className="button primary">Customer Care</Link>
        </div>
      </section>
    </main>
  );
};

export default Contact;
