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
          <p className="eyebrow">Your Favorites</p>
          <h1>Saved Items</h1>
          <p>Your saved boutique pieces stay ready here for quick checkout.</p>
        </div>
      </section>

      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px 60px' }}>
        <div className="content-toolbar" style={{ marginBottom: '24px' }}>
          <div>
            <h2>My Wishlist</h2>
            <p>{wishlistItems.length} items saved</p>
          </div>
          <Link to="/shop" className="button secondary">Explore More Styles</Link>
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
            <p>Tap the heart icon on any piece you love and it will be saved here.</p>
            <Link to="/shop" className="button primary">Explore Collection</Link>
          </div>
        ) : (
          <div className="wishlist-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
            {wishlistItems.map((item) => (
              <ProductCard
                key={item.id || item.product_id}
                product={{
                  id: item.product_id || item.id,
                  name: item.name,
                  slug: item.slug,
                  price: item.discount_price || item.price,
                  discount_price: item.discount_price,
                  image: item.image || item.primary_image,
                  category_name: item.category_name || 'Boutique Collection',
                  avg_rating: item.avg_rating || 5.0
                }}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default Wishlist;
