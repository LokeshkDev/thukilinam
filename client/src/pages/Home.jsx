import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import ProductCard from '../components/ui/ProductCard';
import thukilinamBanner from '../assets/thukilinam-banner.png';

const Home = () => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeFilter, setActiveFilter] = useState('all');
  const [heroSlides, setHeroSlides] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [freshArrivals, setFreshArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [touchStartX, setTouchStartX] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const bestsellerRef = useRef(null);
  const [bsStartX, setBsStartX] = useState(0);
  const [bsScrollLeft, setBsScrollLeft] = useState(0);
  const autoPlayRef = useRef(null);
  const splitSectionRef = useRef(null);
  const splitBgRef = useRef(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [bannersRes, bestsellersRes, freshRes] = await Promise.all([
          api.get('/banners'),
          api.get('/products?bestseller=1&limit=8'),
          api.get('/products?new_arrival=1&limit=8')
        ]);
        if (bannersRes.data.success) setHeroSlides(bannersRes.data.banners);
        if (bestsellersRes.data.success) setBestsellers(bestsellersRes.data.products);
        if (freshRes.data.success) setFreshArrivals(freshRes.data.products);
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  useEffect(() => {
    const section = splitSectionRef.current;
    const bg = splitBgRef.current;
    if (!section || !bg) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const updateParallax = () => {
      const rect = section.getBoundingClientRect();
      const scrollProgress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      const offset = (scrollProgress - 0.5) * 80;
      bg.style.transform = `translateY(${offset}px)`;
    };

    updateParallax();
    window.addEventListener('scroll', updateParallax, { passive: true });
    window.addEventListener('resize', updateParallax, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateParallax);
      window.removeEventListener('resize', updateParallax);
    };
  }, []);

  // Auto-play carousel
  useEffect(() => {
    if (heroSlides.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setActiveSlide(prev => (prev + 1) % heroSlides.length);
      }, 5500);
      return () => clearInterval(autoPlayRef.current);
    }
  }, [heroSlides.length]);

  const goToSlide = (index) => {
    clearInterval(autoPlayRef.current);
    setActiveSlide(index);
  };

  const goPrev = () => goToSlide((activeSlide - 1 + heroSlides.length) % heroSlides.length);
  const goNext = () => goToSlide((activeSlide + 1) % heroSlides.length);

  // Touch swipe handlers
  const handleTouchStart = (e) => setTouchStartX(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      diff > 0 ? goNext() : goPrev();
    }
    setTouchStartX(null);
  };

  // Bestseller drag scroll
  const handleMouseDown = (e) => {
    if (!bestsellerRef.current) return;
    setIsDragging(true);
    setBsStartX(e.pageX - bestsellerRef.current.offsetLeft);
    setBsScrollLeft(bestsellerRef.current.scrollLeft);
  };
  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e) => {
    if (!isDragging || !bestsellerRef.current) return;
    e.preventDefault();
    const x = e.pageX - bestsellerRef.current.offsetLeft;
    bestsellerRef.current.scrollLeft = bsScrollLeft - (x - bsStartX) * 2;
  };

  const scrollBestsellers = (direction) => {
    if (!bestsellerRef.current) return;
    const scrollAmount = bestsellerRef.current.offsetWidth * 0.8;
    bestsellerRef.current.scrollBy({ left: direction === 'next' ? scrollAmount : -scrollAmount, behavior: 'smooth' });
  };

  const filteredArrivals = activeFilter === 'all'
    ? freshArrivals
    : freshArrivals.filter(p => p.category_slug === activeFilter);

  const getBannerImageUrl = (url = '') =>
    url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${url}`;

  return (
    <main>
      <section className="mobile-shortcuts" aria-label="Mobile quick actions">
        {(settings?.header_links || [
          { label: 'New In', url: '/shop?sort=newest' },
          { label: 'Sarees', url: '/shop?cat=sarees' },
          { label: 'Kurti Sets', url: '/shop?cat=kurtis' },
          { label: 'Fusion Wear', url: '/shop?cat=salwar-sets' },
          { label: 'Boutique Deals', url: '/shop?sort=price_asc' }
        ]).map((link, idx) => {
          const getCategoryIcon = (label = '') => {
            const l = label.toLowerCase();
            if (l.includes('new')) return '#icon-trend';
            if (l.includes('saree')) return '#icon-store';
            if (l.includes('kurti') || l.includes('salwar') || l.includes('fusion') || l.includes('blouse') || l.includes('wear') || l.includes('bottom')) return '#icon-grid';
            if (l.includes('deal') || l.includes('sale') || l.includes('offer') || l.includes('price')) return '#icon-tag';
            return '#icon-store';
          };
          let compactLabel = link.label;
          if (compactLabel.toLowerCase().includes('new')) compactLabel = 'New';
          else if (compactLabel.toLowerCase().includes('saree')) compactLabel = 'Sarees';
          else if (compactLabel.toLowerCase().includes('kurti')) compactLabel = 'Kurtis';
          else if (compactLabel.toLowerCase().includes('deal')) compactLabel = 'Deals';
          else if (compactLabel.toLowerCase().includes('fusion')) compactLabel = 'Fusion';
          return (
            <Link key={idx} to={link.url}>
              <svg className="icon" aria-hidden="true"><use href={getCategoryIcon(link.label)}></use></svg>
              {compactLabel}
            </Link>
          );
        })}
      </section>

      {/* ─── FULL-BLEED BANNER CAROUSEL ──────────────────────────────────────── */}
      <section
        className="hero-carousel"
        id="homepage-carousel"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-label="Featured banners"
      >
        <div className="carousel-track">
          {heroSlides.length > 0 ? heroSlides.map((slide, index) => {
            const desktopUrl = getBannerImageUrl(slide.image_url);
            const mobileUrl = slide.mobile_image_url ? getBannerImageUrl(slide.mobile_image_url) : desktopUrl;
            const link = (slide.link || '').trim();

            const slideContent = (
              <div className="carousel-slide-inner">
                <div 
                  className="carousel-blur-bg" 
                  style={{ 
                    '--bg-desktop': `url(${desktopUrl})`,
                    '--bg-mobile': `url(${mobileUrl})` 
                  }}
                />
                <picture className="carousel-picture">
                  <source media="(max-width: 768px)" srcSet={mobileUrl} />
                  <img
                    src={desktopUrl}
                    alt={slide.title || 'Thukilinam banner'}
                    loading={index === 0 ? 'eager' : 'lazy'}
                  />
                </picture>
              </div>
            );

            return (
              <div key={slide.id} className={`carousel-slide ${index === activeSlide ? 'is-active' : ''}`}>
                {link ? (
                  <Link to={link} className="carousel-link">{slideContent}</Link>
                ) : (
                  slideContent
                )}
              </div>
            );
          }) : (
            <div className="carousel-slide is-active">
              <div className="carousel-placeholder">
                <div className="hero-copy">
                  <h2>Welcome to Thukilinam</h2>
                  <p>Curated boutique edits crafted for comfort and tradition.</p>
                  <Link className="button primary" to="/shop">Shop Now</Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {heroSlides.length > 1 && (
          <>
            <button className="carousel-nav prev" onClick={goPrev} aria-label="Previous slide">
              <svg className="icon"><use href="#icon-left"></use></svg>
            </button>
            <button className="carousel-nav next" onClick={goNext} aria-label="Next slide">
              <svg className="icon"><use href="#icon-right"></use></svg>
            </button>
            <div className="carousel-dots">
              {heroSlides.map((_, index) => (
                <button
                  key={index}
                  className={`dot ${index === activeSlide ? 'is-active' : ''}`}
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      <section className="section-block collection-band" id="new">
        <div className="collection-heading">
          <h2>{settings?.top_collections?.heading || 'Top Collections'}</h2>
          <p>{settings?.top_collections?.subheading || 'Curated boutique edits crafted for comfort, tradition, and polished everyday moments.'}</p>
        </div>
        <div className="collection-grid">
          {(settings?.top_collections?.list || [
            { title: "Sarees", image: "/uploads/tamilnadu_boutique_saree_tile_1778564289180.png", link: "/shop?cat=sarees" },
            { title: "Salwar Sets", image: "/uploads/tamilnadu_boutique_fusion_hero_1778563927977.png", link: "/shop?cat=salwar-sets" },
            { title: "Kurtis", image: "/uploads/tamilnadu_boutique_kurti_tile_1778564263790.png", link: "/shop?cat=kurtis" },
            { title: "Dupattas", image: "/uploads/tamilnadu_boutique_dupatta_tile_1778564006547.png", link: "/shop?cat=dupattas" },
            { title: "Blouses", image: "https://images.pexels.com/photos/33325809/pexels-photo-33325809.jpeg?auto=compress&cs=tinysrgb&w=700", link: "/shop?cat=blouses" },
            { title: "Bottom Wear", image: "https://images.pexels.com/photos/36738093/pexels-photo-36738093.jpeg?auto=compress&cs=tinysrgb&w=700", link: "/shop?cat=bottom-wears" }
          ]).map((col, idx) => (
            <Link key={idx} className="collection-card" to={col.link}>
              <span className="collection-image">
                {col.image && (
                  <img src={col.image.startsWith('http') ? col.image : `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${col.image}`} alt={col.title} />
                )}
              </span>
              <strong>{col.title}</strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-block" id="trends">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Customer favourites</p>
            <h2>Best sellers</h2>
          </div>
          <div className="carousel-actions">
            <button className="carousel-button" type="button" onClick={() => scrollBestsellers('prev')}>
              <svg className="icon"><use href="#icon-left"></use></svg>
            </button>
            <button className="carousel-button" type="button" onClick={() => scrollBestsellers('next')}>
              <svg className="icon"><use href="#icon-right"></use></svg>
            </button>
          </div>
        </div>
        <div
          className={`bestseller-carousel ${isDragging ? 'is-dragging' : ''}`}
          ref={bestsellerRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          {bestsellers.length > 0 ? bestsellers.map(product => (
            <ProductCard
              key={product.id}
              product={{
                ...product,
                image: product.primary_image?.startsWith('http') ? product.primary_image : `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${product.primary_image}`
              }}
            />
          )) : (
            <p className="text-center w-100 py-5 text-muted">No bestsellers found.</p>
          )}
        </div>
      </section>

      <section className="section-block" id="products">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Fresh arrivals</p>
            <h2>New Collections</h2>
          </div>
          <div className="filter-pills">
            {['all', 'sarees', 'salwar-sets', 'kurtis'].map(filter => (
              <button
                key={filter}
                className={activeFilter === filter ? 'is-selected' : ''}
                onClick={() => setActiveFilter(filter)}
              >
                {filter === 'all' ? 'All' : filter.replace('-', ' ').charAt(0).toUpperCase() + filter.replace('-', ' ').slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="product-grid">
          {filteredArrivals.length > 0 ? filteredArrivals.map((product) => (
            <ProductCard
              key={product.id}
              product={{
                ...product,
                image: product.primary_image?.startsWith('http') ? product.primary_image : `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${product.primary_image}`
              }}
            />
          )) : (
            <p className="text-center w-100 py-5 text-muted">No products found for this category.</p>
          )}
        </div>
      </section>

      <section
        className="split-section"
        id="services"
        ref={splitSectionRef}
        style={{ '--split-bg': `url(${thukilinamBanner})` }}
      >
        <div className="split-section__bg" ref={splitBgRef} aria-hidden="true" />
        <div className="split-section__content">
          <div>
            <p className="eyebrow">Boutique service</p>
            <h2>Complete shopping features, kept simple.</h2>
            <p>Clean product cards, category discovery, wishlist, cart status, order support, exchange messaging, and app-style mobile browsing.</p>
          </div>
          <div className="feature-list">
            <span><svg className="icon"><use href="#icon-card"></use></svg>Secure checkout</span>
            <span><svg className="icon"><use href="#icon-user"></use></svg>Size guidance</span>
            <span><svg className="icon"><use href="#icon-support"></use></svg>Live styling help</span>
            <span><svg className="icon"><use href="#icon-store"></use></svg>Pickup from store</span>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
