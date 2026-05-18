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
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/products/${slug}`);
        if (res.data.success) {
          setProduct(res.data.product);
          setRelatedProducts(res.data.related || []);
          if (res.data.product.variants?.length > 0) {
            const firstVar = res.data.product.variants[0];
            const attrs = typeof firstVar.attributes === 'string' ? JSON.parse(firstVar.attributes) : (firstVar.attributes || {});
            setSelectedAttributes(attrs);
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

  if (loading) return <div className="text-center py-5"><p className="text-muted">Loading product details...</p></div>;
  if (error || !product) return <div className="text-center py-5"><p className="text-danger">{error || 'Product not found.'}</p><Link to="/shop" className="btn btn-primary mt-3">Back to Shop</Link></div>;

  const images = product.images?.length > 0 
    ? product.images.map(img => img.image_url.startsWith('http') ? img.image_url : `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${img.image_url}`)
    : ["/assets/placeholder.png"];
  const selectedVariant = product.variants?.find((variant) => {
    const attrs = typeof variant.attributes === 'string' ? JSON.parse(variant.attributes) : (variant.attributes || {});
    return Object.entries(selectedAttributes).every(([k, val]) => attrs[k] === val);
  });
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
            <img src={selectedVariant?.image_url ? (selectedVariant.image_url.startsWith('http') ? selectedVariant.image_url : `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${selectedVariant.image_url}`) : images[activeThumb]} alt={product.name} id="active-image" />
          </div>
          <div className="thumbnail-list">
            {images.map((img, i) => (
              <button 
                key={i} 
                className={activeThumb === i ? 'is-active' : ''} 
                onClick={() => setActiveThumb(i)}
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
              <div className="rating">
                <svg className="icon star-filled">
                  <use href="#icon-star"></use>
                </svg>
                <span>{product.avg_rating} ({product.review_count} reviews)</span>
              </div>
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
                                onClick={() => setSelectedAttributes({ ...selectedAttributes, [attrName]: val })}
                                title={colorName}
                              />
                              <span style={{ fontSize: '11px', color: 'var(--muted)', textAlign: 'center', maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{colorName}</span>
                            </div>
                          ) : (
                            <button 
                              key={val} 
                              type="button" 
                              className={selectedAttributes[attrName] === val ? 'is-active' : ''}
                              onClick={() => setSelectedAttributes({ ...selectedAttributes, [attrName]: val })}
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
