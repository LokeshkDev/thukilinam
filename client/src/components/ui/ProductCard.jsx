import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { wishlistItems, toggleWishlist } = useWishlist();
  const [adding, setAdding] = React.useState(false);
  const [added, setAdded] = React.useState(false);
  const price = product.discount_price || product.price;
  const isSaved = wishlistItems.some((item) => item.product_id === product.id || item.id === product.id);

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setAdding(true);
    const success = await addToCart(product.id, null, 1);
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
    <article className="product-card" data-aos="fade-up">
      <button
        className={`heart ${isSaved ? 'is-saved' : ''}`}
        type="button"
        onClick={handleWishlist}
        aria-label={`${isSaved ? 'Remove' : 'Add'} ${product.name} ${isSaved ? 'from' : 'to'} wishlist`}
      >
        <svg className="icon" aria-hidden="true">
          <use href="#icon-heart"></use>
        </svg>
      </button>
      <Link to={`/product/${product.slug}`} className="product-art">
        <img src={product.image} alt={product.name} loading="lazy" />
        {product.badge && <span className="badge product-badge">{product.badge}</span>}
      </Link>
      <div className="product-info">
        <Link to={`/product/${product.slug}`}>
          <h3>{product.name}</h3>
        </Link>
        <p className="product-category">{product.category_name}</p>
        <div className="price-row">
          <strong>Rs. {Number(price || 0).toLocaleString('en-IN')}</strong>
          <div className="product-rating">
            <svg className="icon fill-star" aria-hidden="true">
              <use href="#icon-star"></use>
            </svg>
            <span>{product.rating || product.avg_rating || '4.5'}</span>
          </div>
        </div>
        <button className="cart-button" type="button" onClick={handleAddToCart} disabled={adding || product.stock === 0}>
          {product.stock === 0 ? 'Out of stock' : added ? 'Added' : adding ? 'Adding...' : 'Add to bag'}
        </button>
      </div>
    </article>
  );
};

export default ProductCard;
