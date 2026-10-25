import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ui/ProductCard';
import api from '../api/axios';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { wishlistItems, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Gallery state
  const [activeThumb, setActiveThumb] = useState(0);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [selectedVariantImage, setSelectedVariantImage] = useState(null);
  const [userHasSelectedVariant, setUserHasSelectedVariant] = useState(false);
  const thumbnailTrackRef = useRef(null);

  // Cart actions state
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);

  // Touch gesture state for main image swipe
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/products/${slug}`);
        if (res.data.success) {
          const currentProd = res.data.product;
          setProduct(currentProd);
          setRelatedProducts(res.data.related || []);

          if (currentProd.variants?.length > 0) {
            const firstVar = currentProd.variants[0];
            const attrs = typeof firstVar.attributes === 'string' 
              ? JSON.parse(firstVar.attributes) 
              : (firstVar.attributes || {});
            setSelectedAttributes(attrs);
            setSelectedVariantImage(null);
            setUserHasSelectedVariant(false);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Product not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  // Gallery image calculations
  const images = product?.images?.length > 0
    ? product.images.map(img => img.image_url.startsWith('http') 
        ? img.image_url 
        : `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${img.image_url}`)
    : ['/assets/placeholder.png'];

  const selectedVariant = product?.variants?.find((variant) => {
    const attrs = typeof variant.attributes === 'string' 
      ? JSON.parse(variant.attributes) 
      : (variant.attributes || {});
    return Object.entries(selectedAttributes).every(([k, val]) => attrs[k] === val);
  });

  const variantImages = (() => {
    if (!selectedVariant?.image_url) return [];
    const imgVal = selectedVariant.image_url;
    let parsed = [];
    try {
      if (imgVal.startsWith('[')) {
        parsed = JSON.parse(imgVal);
      } else {
        parsed = imgVal.split(',').map(s => s.trim()).filter(Boolean);
      }
    } catch (e) {
      parsed = [imgVal];
    }
    return parsed.map(url => url.startsWith('http') 
      ? url 
      : `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${url}`);
  })();

  const galleryImages = (userHasSelectedVariant && variantImages.length > 0) ? variantImages : images;

  // Active image bounds check
  const currentActiveIndex = activeThumb >= galleryImages.length ? 0 : activeThumb;
  const activeImageUrl = selectedVariantImage || galleryImages[currentActiveIndex] || '/assets/thukilinam-logo.jpeg';

  const handleNextImage = () => {
    if (galleryImages.length <= 1) return;
    setSelectedVariantImage(null);
    setActiveThumb((prev) => (prev + 1) % galleryImages.length);
  };

  const handlePrevImage = () => {
    if (galleryImages.length <= 1) return;
    setSelectedVariantImage(null);
    setActiveThumb((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 45) {
      handleNextImage();
    } else if (distance < -45) {
      handlePrevImage();
    }
  };

  const scrollThumbnails = (direction) => {
    if (thumbnailTrackRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      thumbnailTrackRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (thumbnailTrackRef.current && thumbnailTrackRef.current.children[currentActiveIndex]) {
      const track = thumbnailTrackRef.current;
      const targetThumb = track.children[currentActiveIndex];
      const targetLeft = targetThumb.offsetLeft - (track.clientWidth / 2) + (targetThumb.clientWidth / 2);
      track.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
    }
  }, [currentActiveIndex]);

  const handleAttributeChange = (attrName, val, currentProduct) => {
    setUserHasSelectedVariant(true);
    const newAttrs = { ...selectedAttributes, [attrName]: val };
    setSelectedAttributes(newAttrs);

    const matchedVariant = currentProduct.variants?.find((variant) => {
      const attrs = typeof variant.attributes === 'string' 
        ? JSON.parse(variant.attributes) 
        : (variant.attributes || {});
      return Object.entries(newAttrs).every(([k, v]) => attrs[k] === v);
    });

    if (matchedVariant?.image_url) {
      let vImgs = [];
      const imgVal = matchedVariant.image_url;
      try {
        if (imgVal.startsWith('[')) {
          vImgs = JSON.parse(imgVal);
        } else {
          vImgs = imgVal.split(',').map(s => s.trim()).filter(Boolean);
        }
      } catch (e) {
        vImgs = [imgVal];
      }

      if (vImgs.length > 0) {
        const firstUrl = vImgs[0];
        const formattedUrl = firstUrl.startsWith('http') 
          ? firstUrl 
          : `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${firstUrl}`;
        setSelectedVariantImage(formattedUrl);
        setActiveThumb(0);
      } else {
        setSelectedVariantImage(null);
      }
    } else {
      setSelectedVariantImage(null);
    }
  };

  const isSaved = wishlistItems.some((item) => item.product_id === product?.id || item.id === product?.id);

  const handleAddToCart = async () => {
    setAdding(true);
    await addToCart(product, selectedVariant || null, 1);
    setAdding(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  const handleBuyNow = async () => {
    setBuyingNow(true);
    await addToCart(product, selectedVariant || null, 1);
    setBuyingNow(false);
    navigate('/checkout');
  };

  const handleWishlist = () => {
    if (product) toggleWishlist(product);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <p className="text-muted">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-5">
        <p className="text-danger">{error || 'Product not found.'}</p>
        <Link to="/shop" className="btn btn-primary mt-3">Back to Shop</Link>
      </div>
    );
  }

  // Pricing calculations
  const currentPrice = parseFloat(selectedVariant ? (selectedVariant.sale_price || selectedVariant.price) : (product.discount_price || product.price));
  const originalPrice = parseFloat(selectedVariant ? selectedVariant.price : product.price);
  const hasDiscount = originalPrice > currentPrice;
  const discountPercent = hasDiscount ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;

  // Description bullets parser
  const descriptionBullets = (() => {
    if (!product.description) return [];
    return product.description
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  })();

  return (
    <main className="amazon-pdp-page">
      {/* Breadcrumb Navigation */}
      <nav className="amazon-breadcrumbs" aria-label="Breadcrumbs">
        <Link to="/">Home</Link>
        <span className="crumb-sep">›</span>
        <Link to={`/shop?cat=${product.category_slug}`}>{product.category_name || 'Collection'}</Link>
        <span className="crumb-sep">›</span>
        <span className="crumb-active">{product.name}</span>
      </nav>

      <div className="amazon-pdp-layout">
        {/* ─── LEFT: COMPACT HORIZONTAL GALLERY ────────────────────────── */}
        <div className="amazon-gallery-column">
          <div 
            className="amazon-main-image-card"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img 
              src={activeImageUrl} 
              alt={product.name} 
              id="active-image"
              onError={(e) => { e.target.src = '/assets/thukilinam-logo.jpeg'; }}
            />

            {galleryImages.length > 1 && (
              <>
                <button 
                  type="button" 
                  className="amazon-gallery-arrow prev" 
                  onClick={handlePrevImage}
                  aria-label="Previous photo"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                <button 
                  type="button" 
                  className="amazon-gallery-arrow next" 
                  onClick={handleNextImage}
                  aria-label="Next photo"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
                <div className="amazon-gallery-counter">
                  {currentActiveIndex + 1} / {galleryImages.length}
                </div>
              </>
            )}
          </div>

          {/* Compact Horizontal Thumbnail Strip */}
          {galleryImages.length > 1 && (
            <div className="amazon-thumbnail-strip-container">
              {galleryImages.length > 5 && (
                <button 
                  type="button" 
                  className="amazon-thumb-scroll-btn left" 
                  onClick={() => scrollThumbnails('left')}
                  aria-label="Scroll thumbnails left"
                >
                  ‹
                </button>
              )}

              <div className="amazon-thumbnail-scroll-track" ref={thumbnailTrackRef}>
                {galleryImages.map((img, i) => (
                  <button 
                    key={i} 
                    type="button"
                    className={`amazon-thumb-card ${currentActiveIndex === i ? 'is-active' : ''}`}
                    onMouseEnter={() => {
                      setActiveThumb(i);
                      setSelectedVariantImage(null);
                    }}
                    onClick={() => {
                      setActiveThumb(i);
                      setSelectedVariantImage(null);
                    }}
                    aria-label={`Thumbnail ${i + 1}`}
                  >
                    <img 
                      src={img} 
                      alt={`Thumbnail ${i + 1}`}
                      onError={(e) => { e.target.src = '/assets/thukilinam-logo.jpeg'; }}
                    />
                  </button>
                ))}
              </div>

              {galleryImages.length > 5 && (
                <button 
                  type="button" 
                  className="amazon-thumb-scroll-btn right" 
                  onClick={() => scrollThumbnails('right')}
                  aria-label="Scroll thumbnails right"
                >
                  ›
                </button>
              )}
            </div>
          )}
        </div>

        {/* ─── RIGHT: AMAZON PRODUCT DETAILS & BUY BOX ─────────────────── */}
        <div className="amazon-details-column">
          {/* Brand Header */}
          <div className="amazon-brand-row">
            <Link to={`/shop?brand=${product.brand_slug || ''}`} className="amazon-brand-link">
              Visit the {product.brand_name || 'Thukilinam'} Store
            </Link>
          </div>

          {/* Product Title */}
          <h1 className="amazon-product-title">{product.name}</h1>

          {/* Badges & SKU Row */}
          <div className="amazon-badge-row">
            {product.is_bestseller ? (
              <span className="amazon-bestseller-badge">
                #1 Best Seller <span className="badge-sub">in {product.category_name || 'Ethnic Wear'}</span>
              </span>
            ) : product.badge ? (
              <span className="amazon-choice-badge">{product.badge}</span>
            ) : null}

            {product.sku && <span className="amazon-sku-label">SKU: {product.sku}</span>}
          </div>

          <hr className="amazon-divider" />

          {/* Amazon Pricing Section */}
          <div className="amazon-pricing-box">
            <div className="amazon-price-headline">
              {hasDiscount && (
                <span className="amazon-discount-rate">-{discountPercent}%</span>
              )}
              <span className="amazon-price-currency">₹</span>
              <span className="amazon-price-value">{currentPrice.toLocaleString('en-IN')}</span>
            </div>

            {hasDiscount && (
              <div className="amazon-mrp-row">
                <span className="mrp-label">M.R.P.:</span>
                <span className="mrp-strikethrough">₹{originalPrice.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="amazon-taxes-note">Inclusive of all taxes</div>
          </div>

          

          {/* Variants Selector */}
          {product.variants?.length > 0 && (
            <div className="amazon-variants-box">
              {(() => {
                const collectedAttrs = {};
                product.variants.forEach(v => {
                  const attrs = typeof v.attributes === 'string' ? JSON.parse(v.attributes) : (v.attributes || {});
                  Object.entries(attrs).forEach(([k, val]) => {
                    if (!collectedAttrs[k]) collectedAttrs[k] = new Set();
                    collectedAttrs[k].add(val);
                  });
                });

                return Object.entries(collectedAttrs).map(([attrName, valuesSet]) => {
                  const isColor = attrName.toLowerCase() === 'color';
                  const currentSelectedVal = selectedAttributes[attrName] || '';
                  const selectedDisplayName = currentSelectedVal.includes('|') 
                    ? currentSelectedVal.split('|')[0] 
                    : currentSelectedVal;

                  return (
                    <div className="amazon-option-group" key={attrName}>
                      <div className="amazon-option-label">
                        <span>{attrName}: </span>
                        <strong>{selectedDisplayName || 'Select an option'}</strong>
                      </div>

                      <div className={isColor ? 'amazon-color-swatches' : 'amazon-chips-selector'}>
                        {Array.from(valuesSet).map(val => {
                          const [colorName, colorHex] = val.includes('|') ? val.split('|') : [val, val];
                          const isActive = selectedAttributes[attrName] === val;

                          return isColor ? (
                            <button
                              key={val}
                              type="button"
                              className={`amazon-color-btn ${isActive ? 'is-active' : ''}`}
                              style={{ backgroundColor: colorHex }}
                              onClick={() => handleAttributeChange(attrName, val, product)}
                              title={colorName}
                              aria-label={colorName}
                            />
                          ) : (
                            <button
                              key={val}
                              type="button"
                              className={`amazon-chip-btn ${isActive ? 'is-active' : ''}`}
                              onClick={() => handleAttributeChange(attrName, val, product)}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {/* Stock Availability */}
          <div className="amazon-stock-status">
            {product.stock > 5 ? (
              <span className="in-stock-label">In stock</span>
            ) : product.stock > 0 ? (
              <span className="low-stock-label">Only {product.stock} left in stock - order soon.</span>
            ) : (
              <span className="out-of-stock-label">Currently unavailable.</span>
            )}
          </div>

          {/* Action Buttons in Original Theme Design - Single Row */}
          <div className="pdp-actions-row">
            <button
              type="button"
              className="pdp-btn-theme pdp-btn-cart"
              onClick={handleAddToCart}
              disabled={adding || product.stock === 0}
            >
              {product.stock === 0 ? 'Out of Stock' : added ? '✓ Added' : adding ? 'Adding...' : 'Add to Bag'}
            </button>

            <button
              type="button"
              className="pdp-btn-theme pdp-btn-buy"
              onClick={handleBuyNow}
              disabled={buyingNow || product.stock === 0}
            >
              {buyingNow ? 'Processing...' : 'Buy Now'}
            </button>

            <button
              type="button"
              className={`pdp-btn-theme pdp-btn-wishlist ${isSaved ? 'is-saved' : ''}`}
              onClick={handleWishlist}
              aria-label={isSaved ? 'Saved to Wishlist' : 'Add to Wishlist'}
              title={isSaved ? 'Saved to Wishlist' : 'Add to Wishlist'}
            >
              <svg viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
          </div>

          <hr className="amazon-divider" />

          {/* Amazon "About this item" Feature Bullets */}
          <div className="amazon-about-section">
            <h2 className="amazon-section-title">About this item</h2>
            <ul className="amazon-bullet-list">
              {descriptionBullets.map((bullet, idx) => (
                <li key={idx}>
                  <span className="bullet-dot">•</span>
                  <span className="bullet-text">{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Product Specifications Table */}
          {product.specs?.length > 0 && (
            <div className="amazon-specs-section">
              <h2 className="amazon-section-title">Product details</h2>
              <table className="amazon-specs-table">
                <tbody>
                  {product.specs.map((spec, i) => (
                    <tr key={i}>
                      <td className="spec-label">{spec.spec_key}</td>
                      <td className="spec-val">{spec.spec_value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ─── RELATED PRODUCTS ("CUSTOMERS ALSO VIEWED") ─────────────────── */}
      {relatedProducts.length > 0 && (
        <section className="amazon-related-section">
          <div className="amazon-section-header">
            <h2>Customers who viewed this item also viewed</h2>
            <p>Explore matching selections from our artisan catalog</p>
          </div>
          <div className="product-grid">
            {relatedProducts.map(p => (
              <ProductCard 
                key={p.id} 
                product={{
                  ...p,
                  image: p.primary_image?.startsWith('http') 
                    ? p.primary_image 
                    : `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${p.primary_image}`
                }} 
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
};

export default ProductDetail;
