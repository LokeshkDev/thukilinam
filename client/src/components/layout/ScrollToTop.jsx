import React, { useState, useEffect } from 'react';

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 400);
      
      // Auto-hide utility bar logic from reference
      const desktopHeader = document.querySelector(".desktop-header");
      if (desktopHeader) {
        desktopHeader.classList.toggle("is-scrolled", window.scrollY > 60);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button 
      className={`scroll-top-btn ${isVisible ? 'is-visible' : ''}`} 
      id="scroll-top" 
      type="button" 
      aria-label="Scroll to top"
      onClick={scrollToTop}
    >
      <svg className="icon" aria-hidden="true">
        <use href="#icon-chevron-down"></use>
      </svg>
    </button>
  );
};

export default ScrollToTop;
