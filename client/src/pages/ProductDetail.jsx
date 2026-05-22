import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ui/ProductCard';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { wishlistItems, toggleWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeThumb, setActiveThumb] = useState(0);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [selectedVariantImage, setSelectedVariantImage] = useState(null);
  const [userHasSelectedVariant, setUserHasSelectedVariant] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  // Review states
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [breakdown, setBreakdown] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [totalReviews, setTotalReviews] = useState(0);
  const [canReview, setCanReview] = useState(false);
  const [checkingCanReview, setCheckingCanReview] = useState(false);
  
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState(null);
  const [ratingFilter, setRatingFilter] = useState(null);

  const handleAttributeChange = (attrName, val, currentProduct) => {
    setUserHasSelectedVariant(true);
    const newAttrs = { ...selectedAttributes, [attrName]: val };
    setSelectedAttributes(newAttrs);

    // Find corresponding variant with the new selection
    const matchedVariant = currentProduct.variants?.find((variant) => {
      const attrs = typeof variant.attributes === 'string' ? JSON.parse(variant.attributes) : (variant.attributes || {});
      return Object.entries(newAttrs).every(([k, v]) => attrs[k] === v);
    });

    if (matchedVariant?.image_url) {
      let variantImgs = [];
      const imgVal = matchedVariant.image_url;
      try {
        if (imgVal.startsWith('[')) {
          variantImgs = JSON.parse(imgVal);
        } else {
          variantImgs = imgVal.split(',').map(s => s.trim()).filter(Boolean);
        }
      } catch (e) {
        variantImgs = [imgVal];
      }

      if (variantImgs.length > 0) {
        const firstUrl = variantImgs[0];
        const formattedUrl = firstUrl.startsWith('http') 
          ? firstUrl 
          : `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${firstUrl}`;
        setSelectedVariantImage(formattedUrl);
        setActiveThumb(0); // Reset to the first image of the variant
      } else {
        setSelectedVariantImage(null);
      }
    } else {
      setSelectedVariantImage(null);
    }
  };

  const fetchReviews = async (productId) => {
    try {
      const res = await api.get(`/reviews/${productId}`);
      if (res.data.success) {
        setReviews(res.data.reviews || []);
        setAvgRating(res.data.avgRating || 0);
        setBreakdown(res.data.breakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
        setTotalReviews(res.data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  };

  const checkUserCanReview = async (productId) => {
    console.log('[checkUserCanReview] starting for productId:', productId, 'current user:', user);
    if (!user) {
      console.log('[checkUserCanReview] no user logged in, skipping check.');
      setCanReview(false);
      return;
    }
    setCheckingCanReview(true);
    try {
      const res = await api.get(`/reviews/can-review/${productId}`);
      console.log('[checkUserCanReview] API response:', res.data);
      if (res.data.success) {
        setCanReview(res.data.canReview);
      }
    } catch (err) {
      console.error('[checkUserCanReview] Error checking review permission:', err);
      setCanReview(false);
    } finally {
      setCheckingCanReview(false);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      setRatingFilter(null);
      try {
        const res = await api.get(`/products/${slug}`);
        if (res.data.success) {
          const currentProd = res.data.product;
          setProduct(currentProd);
          setRelatedProducts(res.data.related || []);
          
          if (currentProd.variants?.length > 0) {
            const firstVar = currentProd.variants[0];
            const attrs = typeof firstVar.attributes === 'string' ? JSON.parse(firstVar.attributes) : (firstVar.attributes || {});
            setSelectedAttributes(attrs);
            setSelectedVariantImage(null);
            setUserHasSelectedVariant(false);
          }

          // Fetch reviews and review permissions in parallel
          await Promise.all([
            fetchReviews(currentProd.id),
            checkUserCanReview(currentProd.id)
          ]);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Product not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug, user]);

  // Smooth scroll to reviews section if hash anchor is present
  useEffect(() => {
    if (!loading && window.location.hash === '#product-reviews') {
      const timer = setTimeout(() => {
        const element = document.getElementById('product-reviews');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.rating) {
      setReviewError('Please select a star rating.');
      return;
    }
    setSubmittingReview(true);
    setReviewError(null);
    setReviewSuccess(null);
    try {
      const res = await api.post('/reviews', {
        product_id: product.id,
        rating: reviewForm.rating,
        title: reviewForm.title,
        comment: reviewForm.comment
      });
      if (res.data.success) {
        setReviewSuccess(res.data.message || 'Review submitted successfully!');
        setReviewForm({ rating: 5, title: '', comment: '' });
        setCanReview(false); // Hide the form as they already reviewed now
      }
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <div className="text-center py-5"><p className="text-muted">Loading product details...</p></div>;
  if (error || !product) return <div className="text-center py-5"><p className="text-danger">{error || 'Product not found.'}</p><Link to="/shop" className="btn btn-primary mt-3">Back to Shop</Link></div>;

  const images = product.images?.length > 0 
    ? product.images.map(img => img.image_url.startsWith('http') ? img.image_url : `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${img.image_url}`)
    : ["/assets/placeholder.png"];

  const selectedVariant = product.variants?.find((variant) => {
    const attrs = typeof variant.attributes === 'string' ? JSON.parse(variant.attributes) : (variant.attributes || {});
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
    return parsed.map(url => url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${url}`);
  })();

  const galleryImages = (userHasSelectedVariant && variantImages.length > 0) ? variantImages : images;

  const isSaved = wishlistItems.some((item) => item.product_id === product.id || item.id === product.id);

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setAdding(true);
    const success = await addToCart(product.id, selectedVariant?.id || null, 1);
    setAdding(false);
    setAdded(success);
    if (success) {
      window.setTimeout(() => setAdded(false), 1300);
    }
  };

  const handleWishlist = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    toggleWishlist(product.id);
  };

  const renderStars = (ratingVal, interactive = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isFilled = interactive ? (hoverRating || reviewForm.rating) >= i : ratingVal >= i;
      stars.push(
        <span 
          key={i} 
          className={`star-wrapper ${isFilled ? 'is-filled' : ''} ${interactive ? 'is-interactive' : ''}`}
          onClick={interactive ? () => setReviewForm({ ...reviewForm, rating: i }) : undefined}
          onMouseEnter={interactive ? () => setHoverRating(i) : undefined}
          onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
          style={{ cursor: interactive ? 'pointer' : 'default' }}
        >
          <svg className="icon star-icon" style={{ width: interactive ? '28px' : '16px', height: interactive ? '28px' : '16px' }}>
            <use href="#icon-star"></use>
          </svg>
        </span>
      );
    }
    return <div className="stars-rating">{stars}</div>;
  };

  const displayedReviews = ratingFilter
    ? reviews.filter(r => r.rating === ratingFilter)
    : reviews;

  const handleBreakdownFilter = (starsNum, count) => {
    if (count === 0) return;
    setRatingFilter(prev => (prev === starsNum ? null : starsNum));
  };

  const handleBreakdownKeyDown = (e, starsNum, count) => {
    if (count === 0) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleBreakdownFilter(starsNum, count);
    }
  };

  return (
    <main className="product-page">
      <nav className="breadcrumbs" aria-label="Breadcrumbs">
        <Link to="/">Home</Link>
        <svg className="icon" aria-hidden="true">
          <use href="#icon-chevron-right"></use>
        </svg>
        <Link to={`/shop?cat=${product.category_slug}`}>{product.category_name}</Link>
        <svg className="icon" aria-hidden="true">
          <use href="#icon-chevron-right"></use>
        </svg>
        <span>{product.name}</span>
      </nav>

      <div className="product-container">
        {/* Product Images */}
        <div className="product-gallery">
          <div className="main-image">
            <img src={selectedVariantImage || galleryImages[activeThumb]} alt={product.name} id="active-image" />
          </div>
          <div className="thumbnail-list">
            {galleryImages.map((img, i) => (
              <button 
                key={i} 
                className={activeThumb === i ? 'is-active' : ''} 
                onClick={() => {
                  setActiveThumb(i);
                  setSelectedVariantImage(null);
                }}
                type="button"
              >
                <img src={img} alt={`Thumbnail ${i + 1}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="product-details">
          <div className="product-header">
            {product.badge && <span className="badge">{product.badge}</span>}
            <h1>{product.name}</h1>
            <div className="product-meta">
              {/* Only show rating line when there are actual reviews */}
              {(totalReviews > 0 || (product.review_count > 0 && product.avg_rating > 0)) && (
                <div className="rating">
                  <svg className="icon star-filled">
                    <use href="#icon-star"></use>
                  </svg>
                  <span>{avgRating ? avgRating.toFixed(1) : product.avg_rating} ({totalReviews || product.review_count} reviews)</span>
                </div>
              )}
              {product.sku && <span className="sku">SKU: {product.sku}</span>}
            </div>
          </div>

          <div className="product-price">
            <span className="current">Rs. {selectedVariant ? (selectedVariant.sale_price || selectedVariant.price) : (product.discount_price || product.price)}</span>
            {(selectedVariant ? selectedVariant.sale_price : product.discount_price) && (
              <>
                <span className="original">Rs. {selectedVariant ? selectedVariant.price : product.price}</span>
                <span className="discount">{Math.round((1 - (selectedVariant ? (selectedVariant.sale_price / selectedVariant.price) : (product.discount_price / product.price))) * 100)}% OFF</span>
              </>
            )}
          </div>

          <div className="product-options">
            {product.variants?.length > 0 && (
              <>
                {(() => {
                  const collectedAttrs = {};
                  product.variants.forEach(v => {
                    const attrs = typeof v.attributes === 'string' ? JSON.parse(v.attributes) : (v.attributes || {});
                    Object.entries(attrs).forEach(([k, val]) => {
                      if (!collectedAttrs[k]) collectedAttrs[k] = new Set();
                      collectedAttrs[k].add(val);
                    });
                  });
                  
                  return Object.entries(collectedAttrs).map(([attrName, valuesSet]) => (
                    <div className="option-group" key={attrName}>
                      <div className="option-header">
                        <label>Select {attrName}</label>
                      </div>
                      <div className={attrName.toLowerCase() === 'color' ? 'color-selector d-flex gap-2 flex-wrap' : 'size-selector'}>
                        {Array.from(valuesSet).map(val => {
                          const [colorName, colorValue] = val.includes('|') ? val.split('|') : [val, val];
                          return attrName.toLowerCase() === 'color' ? (
                            <div key={val} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                              <button 
                                type="button" 
                                className={`color-swatch ${selectedAttributes[attrName] === val ? 'is-active' : ''}`}
                                style={{ 
                                  backgroundColor: colorValue, 
                                  width: '32px', 
                                  height: '32px', 
                                  borderRadius: '50%', 
                                  border: '1px solid #ddd', 
                                  padding: 0,
                                  cursor: 'pointer',
                                  boxShadow: selectedAttributes[attrName] === val ? '0 0 0 2px #fff, 0 0 0 4px #000' : 'none',
                                  transition: 'all 0.2s'
                                }}
                                onClick={() => handleAttributeChange(attrName, val, product)}
                                title={colorName}
                              />
                              <span style={{ fontSize: '11px', color: 'var(--muted)', textAlign: 'center', maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{colorName}</span>
                            </div>
                          ) : (
                            <button 
                              key={val} 
                              type="button" 
                              className={selectedAttributes[attrName] === val ? 'is-active' : ''}
                              onClick={() => handleAttributeChange(attrName, val, product)}
                            >{val}</button>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </>
            )}
          </div>

          <div className="product-actions">
            <button className="primary-button" type="button" onClick={handleAddToCart} disabled={adding || product.stock === 0}>
              {product.stock === 0 ? 'Out of Stock' : added ? 'Added to Bag' : adding ? 'Adding...' : 'Add to Bag'}
            </button>
            <button
              className={`secondary-button ${isSaved ? 'is-saved' : ''}`}
              type="button"
              onClick={handleWishlist}
              aria-label={`${isSaved ? 'Remove from' : 'Add to'} wishlist`}
            >
              <svg className="icon">
                <use href="#icon-heart"></use>
              </svg>
            </button>
          </div>

          <div className="product-features">
            <div className="feature-item">
              <svg className="icon">
                <use href="#icon-trend"></use>
              </svg>
              <div>
                <strong>Free Delivery</strong>
                <span>On orders above Rs. 1,999</span>
              </div>
            </div>
            <div className="feature-item">
              <svg className="icon">
                <use href="#icon-tag"></use>
              </svg>
              <div>
                <strong>7 Days Returns</strong>
                <span>Hassle-free exchange policy</span>
              </div>
            </div>
          </div>

          <div className="product-description">
            <h3>Product Details</h3>
            <p>{product.description}</p>
            {product.specs?.length > 0 && (
              <ul>
                {product.specs.map((spec, i) => (
                  <li key={i}>{spec.spec_key}: {spec.spec_value}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ─── PURCHASE-VERIFIED REVIEW SYSTEM ─────────────────────────────────── */}
      {/* Only render the entire reviews section when there are approved reviews OR the user is eligible to write one */}
      {(totalReviews > 0 || canReview || reviewSuccess) && (
        <section className="reviews-section" id="product-reviews" aria-label="Customer Reviews">
          <div className="reviews-header-block">
            <h2>Customer Reviews</h2>
            <p>Read what our shoppers are saying about the styling, fit, and weave.</p>
          </div>

          <div className="reviews-layout">
            {/* Left Panel: Overall Ratings & Distribution — only show when there are reviews */}
            {totalReviews > 0 && (
              <div className="reviews-summary-panel">
                <div className="avg-rating-box">
                  <div className="avg-score">{avgRating ? avgRating.toFixed(1) : '0.0'}</div>
                  {renderStars(Math.round(avgRating))}
                  <div className="total-reviews-count">Based on {totalReviews} verified {totalReviews === 1 ? 'review' : 'reviews'}</div>
                </div>

                <div className="rating-breakdown-bars">
                  {[5, 4, 3, 2, 1].map(starsNum => {
                    const count = breakdown[starsNum] || 0;
                    const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                    const isActive = ratingFilter === starsNum;
                    const isClickable = count > 0;
                    return (
                      <div
                        key={starsNum}
                        className={`breakdown-row${isClickable ? ' is-clickable' : ' is-disabled'}${isActive ? ' is-active' : ''}`}
                        role={isClickable ? 'button' : undefined}
                        tabIndex={isClickable ? 0 : undefined}
                        aria-pressed={isClickable ? isActive : undefined}
                        aria-label={isClickable ? `Filter reviews by ${starsNum} stars` : undefined}
                        onClick={() => handleBreakdownFilter(starsNum, count)}
                        onKeyDown={e => handleBreakdownKeyDown(e, starsNum, count)}
                      >
                        <span className="star-label">{starsNum} ★</span>
                        <div className="progress-bar-bg">
                          <div className="progress-bar-fill" style={{ width: `${percentage}%` }}></div>
                        </div>
                        <span className="count-label">{percentage}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Right Panel: Reviews List & Write Review Form */}
            <div className="reviews-feed-panel">
              {canReview && (
                <div className="write-review-card">
                  <h3>Write a Review</h3>
                  <p className="card-subtext">As a verified purchaser, your review helps other fashion buyers find their perfect fit!</p>
                  
                  {reviewError && <div className="review-alert error">{reviewError}</div>}
                  
                  <form onSubmit={handleReviewSubmit}>
                    <div className="form-group rating-form-group">
                      <label>Your Rating</label>
                      <div className="interactive-star-selector">
                        {renderStars(reviewForm.rating, true)}
                        <span className="rating-text-hint">
                          {reviewForm.rating === 5 && 'Love it! 💖'}
                          {reviewForm.rating === 4 && 'Good quality 👍'}
                          {reviewForm.rating === 3 && 'Decent / Average 😐'}
                          {reviewForm.rating === 2 && 'Needs improvement 👎'}
                          {reviewForm.rating === 1 && 'Highly disappointed 😡'}
                        </span>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="review-title">Review Title</label>
                      <input 
                        type="text" 
                        id="review-title"
                        placeholder="e.g. Stunning weave, perfect for festive wear" 
                        value={reviewForm.title}
                        onChange={e => setReviewForm({ ...reviewForm, title: e.target.value })}
                        maxLength={150}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="review-comment">Review Description</label>
                      <textarea 
                        id="review-comment"
                        placeholder="Describe the fabric quality, color accuracy, and overall fit/finish..." 
                        value={reviewForm.comment}
                        onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                        rows={4}
                        maxLength={1000}
                      />
                    </div>

                    <button type="submit" className="button primary" disabled={submittingReview}>
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                </div>
              )}

              {reviewSuccess && <div className="review-alert success">{reviewSuccess}</div>}

              {totalReviews > 0 && (
                <>
                  {ratingFilter && (
                    <p className="reviews-filter-label">
                      Showing {displayedReviews.length} of {totalReviews} reviews ({ratingFilter}★)
                      <button type="button" className="reviews-filter-clear" onClick={() => setRatingFilter(null)}>
                        Show all
                      </button>
                    </p>
                  )}
                  {displayedReviews.length > 0 ? (
                    <div className={`reviews-list${displayedReviews.length > 3 ? ' reviews-list--scrollable' : ''}`}>
                      {displayedReviews.map(review => (
                        <div key={review.id} className="review-item-card">
                          <div className="review-card-head">
                            <div className="reviewer-info">
                              <div className="reviewer-avatar">
                                {review.user_avatar ? (
                                  <img src={review.user_avatar} alt={review.user_name} />
                                ) : (
                                  <span>{review.user_name?.charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <div>
                                <strong className="reviewer-name">{review.user_name}</strong>
                                <div className="review-date-badge">
                                  <span>{new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                  <span className="verified-badge">
                                    <svg className="icon"><use href="#icon-card"></use></svg>
                                    Verified Buyer
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="review-stars-display">
                              {renderStars(review.rating)}
                            </div>
                          </div>

                          <div className="review-card-body">
                            {review.title && <h4 className="review-title">{review.title}</h4>}
                            {review.comment && <p className="review-comment">{review.comment}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="reviews-filter-empty">
                      <p>No reviews for this rating.</p>
                      <button type="button" className="button secondary" onClick={() => setRatingFilter(null)}>
                        Show all reviews
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="related-section">
          <div className="section-header">
            <h2>Complete the Look</h2>
            <p>Pair it with these handpicked items</p>
          </div>
          <div className="product-grid">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={{
                ...p,
                image: p.primary_image?.startsWith('http') ? p.primary_image : `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${p.primary_image}`
              }} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
};

export default ProductDetail;

