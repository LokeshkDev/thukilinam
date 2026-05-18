import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';
import ProductCard from '../../components/ui/ProductCard';

const Wishlist = () => {
  const { wishlistItems, loading } = useWishlist();

  return (
    <main className="app-page dashboard-page">
      <section className="app-page-head">
        <div>
          <p className="eyebrow">Your Account</p>
          <h1>Wishlist</h1>
          <p>Saved pieces stay ready for the next drop or a quick checkout.</p>
        </div>
      </section>

      <section className="dashboard-layout">
        <aside className="account-panel">
          <div className="account-avatar">T</div>
          <div>
            <p className="eyebrow">Dashboard</p>
            <h2>My Account</h2>
          </div>
          <nav className="account-nav" aria-label="Account navigation">
            <Link to="/profile">Profile Settings</Link>
            <Link to="/orders">Order History</Link>
            <Link to="/wishlist" className="is-active">My Wishlist</Link>
          </nav>
        </aside>

        <div className="dashboard-content">
          <div className="content-toolbar">
            <div>
              <h2>Saved Items</h2>
              <p>{wishlistItems.length} items saved</p>
            </div>
            <Link to="/shop" className="button secondary">Shop More</Link>
          </div>

          {loading ? (
            <div className="app-empty-state compact">
              <p>Loading your saved items...</p>
            </div>
          ) : wishlistItems.length === 0 ? (
            <div className="app-empty-state compact">
              <span className="app-empty-icon">
                <svg className="icon" aria-hidden="true">
                  <use href="#icon-heart"></use>
                </svg>
              </span>
              <h2>No saved items yet</h2>
              <p>Tap the heart on pieces you love and they will appear here.</p>
              <Link to="/shop" className="button primary">Explore Collection</Link>
            </div>
          ) : (
            <div className="wishlist-grid">
              {wishlistItems.map((item) => (
                <ProductCard
                  key={item.id}
                  product={{
                    id: item.product_id,
                    name: item.name,
                    slug: item.slug,
                    price: item.discount_price || item.price,
                    discount_price: item.discount_price,
                    image: item.image,
                    category_name: item.category_name || 'Boutique Collection',
                    avg_rating: 5.0
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default Wishlist;
