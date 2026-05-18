import React, { useState, useEffect } from 'react';
import logo from '../../assets/logo.png';

const Loader = () => {
  const [show, setShow] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        setShow(false);
      }, 500);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div id="loader" className="loader-wrapper" style={{ opacity: fadeOut ? 0 : 1, transition: 'opacity 0.5s ease-in-out' }}>
      <div className="loader-content">
        <img src={logo} alt="Thukilinam Logo" className="loader-logo" />
        <div className="loader-bar"></div>
      </div>
    </div>
  );
};

export default Loader;
