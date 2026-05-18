import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ui/ProductCard';
import { useSettings } from '../context/SettingsContext';
import api from '../api/axios';

const MENU_DEFAULTS = {
  'new-in': {
    eyebrow: 'Fresh Arrivals',
    title: 'New In',
    intro: 'Latest boutique pieces selected for everyday polish, festive comfort, and fresh wardrobe updates.',
    image: '/assets/thukilinam-polished-desktop.png',
    shopUrl: '/shop?sort=newest',
    query: 'new_arrival=1&limit=8'
  },
  sarees: {
    eyebrow: 'Signature Drapes',
    title: 'Sarees',
    intro: 'Silks, soft drapes, and boutique sarees curated for celebrations and graceful daily moments.',
    image: '/assets/tamilnadu_boutique_saree_hero_1778563702008.png',
    shopUrl: '/shop?cat=sarees',
    query: 'category=sarees&limit=8'
  },
  'kurti-sets': {
    eyebrow: 'Easy Ethnic',
    title: 'Kurti Sets',
    intro: 'Comfort-first kurti sets with refined details, clean colors, and versatile styling.',
    image: '/assets/tamilnadu_boutique_kurti_tile_1778564263790.png',
    shopUrl: '/shop?cat=kurtis',
    query: 'category=kurtis&limit=8'
  },
  'fusion-wear': {
    eyebrow: 'Modern Boutique',
    title: 'Fusion Wear',
    intro: 'Contemporary silhouettes with ethnic details for workdays, events, and travel-ready dressing.',
    image: '/assets/tamilnadu_boutique_fusion_hero_1778563927977.png',
    shopUrl: '/shop?cat=salwar-sets',
    query: 'category=salwar-sets&limit=8'
  },
  'boutique-deals': {
    eyebrow: 'Limited Offers',
    title: 'Boutique Deals',
    intro: 'Specially priced finds and customer-loved edits, refreshed for quick discovery.',
    image: '/assets/tamilnadu_boutique_accessories_hero_1778563950144.png',
    shopUrl: '/shop?sort=price_asc',
    query: 'sort=price_asc&limit=8'
  }
};

const resolveImage = (image) => {
  if (!image) return '';
  if (image.startsWith('http') || image.startsWith('/assets')) return image;
  return `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${image}`;
};

const CategoryLanding = ({ pageKey }) => {
  const { settings } = useSettings();
  const page = {
    ...MENU_DEFAULTS[pageKey],
    ...(settings?.menu_pages?.[pageKey] || {})
  };
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/products?${page.query || MENU_DEFAULTS[pageKey].query}`);
        if (data.success) setProducts(data.products || []);
      } catch (err) {
        console.error('Error fetching landing products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [page.query, pageKey]);

  return (
    <main className="category-page">
      <section className="category-hero">
        <div>
          <p className="eyebrow">{page.eyebrow}</p>
          <h1>{page.title}</h1>
          <p>{page.intro}</p>
          <Link className="button primary" to={page.shopUrl || '/shop'}>Shop Collection</Link>
        </div>
        <div className="category-visual">
          <img src={resolveImage(page.image)} alt={page.title} />
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Curated Edit</p>
            <h2>{page.title} Picks</h2>
          </div>
          <Link to={page.shopUrl || '/shop'}>View all</Link>
        </div>

        {loading ? (
          <div className="app-empty-state compact">
            <p>Loading collection...</p>
          </div>
        ) : products.length > 0 ? (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  ...product,
                  image: resolveImage(product.primary_image)
                }}
              />
            ))}
          </div>
        ) : (
          <div className="app-empty-state compact">
            <h2>No products found</h2>
            <p>Products added in admin will appear here when they match this page.</p>
            <Link to="/shop" className="button primary">Browse Shop</Link>
          </div>
        )}
      </section>
    </main>
  );
};

export default CategoryLanding;
