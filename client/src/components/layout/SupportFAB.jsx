import React, { useState, useEffect } from 'react';

const SupportFAB = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('#support-fab')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className={`support-fab ${isOpen ? 'is-open' : ''}`} id="support-fab">
      <button 
        className="support-fab-trigger" 
        type="button" 
        aria-label="Support"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        <svg className="icon" aria-hidden="true">
          <use href="#icon-support"></use>
        </svg>
      </button>
      <div className="support-fab-options">
        <a href="https://wa.me/919600684270" target="_blank" rel="noopener noreferrer" className="fab-whatsapp" aria-label="WhatsApp">
          <svg className="icon" aria-hidden="true">
            <use href="#icon-whatsapp"></use>
          </svg>
          <span className="support-fab-label">WhatsApp</span>
        </a>
        <a href="tel:+919600684270" className="fab-phone" aria-label="Call us">
          <svg className="icon" aria-hidden="true">
            <use href="#icon-phone"></use>
          </svg>
          <span className="support-fab-label">Call us</span>
        </a>
      </div>
    </div>
  );
};

export default SupportFAB;
