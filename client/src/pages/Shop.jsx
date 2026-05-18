import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ui/ProductCard';
import api from '../api/axios';

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [availableColors, setAvailableColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [expandedFilters, setExpandedFilters] = useState({
    category: true,
    price: true,
    colors: true
  });

  // Current filters from URL
  const currentCategory = searchParams.get('cat') || '';
  const currentSort = searchParams.get('sort') || 'newest';
  const currentMinPrice = searchParams.get('min_price') || '';
  const currentMaxPrice = searchParams.get('max_price') || '';

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const catRes = await api.get('/categories');
        if (catRes.data.success) setCategories(catRes.data.categories);
        
        const colorRes = await api.get('/products/colors');
        if (colorRes.data.success) setAvailableColors(colorRes.data.colors);
      } catch (err) {
        console.error('Error fetching initial data:', err);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (currentCategory) params.append('category', currentCategory);
        if (currentSort) params.append('sort', currentSort);
        if (currentMinPrice) params.append('min_price', currentMinPrice);
        if (currentMaxPrice) params.append('max_price', currentMaxPrice);

        const res = await api.get(`/products?${params.toString()}`);
        if (res.data.success) setProducts(res.data.products);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [currentCategory, currentSort, currentMinPrice, currentMaxPrice]);

  const toggleFilter = (section) => {
    setExpandedFilters(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCategoryChange = (slug) => {
    const categories = currentCategory ? currentCategory.split(',') : [];
    const index = categories.indexOf(slug);
    if (index > -1) {
      categories.splice(index, 1);
    } else {
      categories.push(slug);
    }
    
    if (categories.length > 0) {
      searchParams.set('cat', categories.join(','));
    } else {
      searchParams.delete('cat');
    }
    setSearchParams(searchParams);
  };

  const handlePriceChange = (e) => {
    searchParams.set('max_price', e.target.value);
    setSearchParams(searchParams);
  };

  const handleSortChange = (e) => {
    searchParams.set('sort', e.target.value);
    setSearchParams(searchParams);
  };

  return (
    <main className="shop-main">
      <div className="shop-layout">
        <aside className={`shop-sidebar ${isSidebarOpen ? 'is-open' : ''}`} id="shop-sidebar">
          <div className="sidebar-header">
            <h3><svg className="icon"><use href="#icon-filter"></use></svg> Filters</h3>
            <button className="close-sidebar mobile-only" onClick={() => setIsSidebarOpen(false)}>×</button>
          </div>

          <div className="filter-section">
            <button className="filter-trigger" onClick={() => toggleFilter('category')} aria-expanded={expandedFilters.category}>
              <span><svg className="icon"><use href="#icon-tag"></use></svg> Categories</span>
              <svg className={`icon chevron ${!expandedFilters.category ? 'rotate-180' : ''}`}><use href="#icon-chevron-down"></use></svg>
            </button>
            {expandedFilters.category && (
              <div className="filter-content">
                {categories.map(cat => (
                  <label key={cat.id} className="custom-checkbox">
                    <input 
                      type="checkbox" 
                      checked={currentCategory.split(',').includes(cat.slug)}
                      onChange={() => handleCategoryChange(cat.slug)}
                    />
                    <span className="checkmark"></span>
                    {cat.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="filter-section">
            <button className="filter-trigger" onClick={() => toggleFilter('price')} aria-expanded={expandedFilters.price}>
              <span><svg className="icon"><use href="#icon-upi"></use></svg> Price Range</span>
              <svg className={`icon chevron ${!expandedFilters.price ? 'rotate-180' : ''}`}><use href="#icon-chevron-down"></use></svg>
            </button>
            {expandedFilters.price && (
              <div className="filter-content">
                <div className="price-slider-container">
                  <input 
                    type="range" 
                    min="0" 
                    max="10000" 
                    step="500"
                    value={currentMaxPrice || 10000} 
                    onChange={handlePriceChange}
                    className="slider"
                  />
                  <div className="price-labels">
                    <span>Rs. 0</span>
                    <span>Rs. {currentMaxPrice || 10000}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Rating filter removed */}

          <div className="filter-section">
            <button className="filter-trigger" onClick={() => toggleFilter('colors')} aria-expanded={expandedFilters.colors}>
              <span><svg className="icon"><use href="#icon-heart"></use></svg> Shop by Color</span>
              <svg className={`icon chevron ${!expandedFilters.colors ? 'rotate-180' : ''}`}><use href="#icon-chevron-down"></use></svg>
            </button>
            {expandedFilters.colors && (
              <div className="filter-content">
                <div className="color-swatches">
                  {availableColors.map(color => (
                    <div key={color} className="swatch" style={{ backgroundColor: color }} title={color}></div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        <section className="shop-content">
          <div className="shop-toolbar">
            <div className="toolbar-left">
              <p className="results-count">Showing <strong>{products.length}</strong> products</p>
            </div>

            <div className="toolbar-right">
              <div className="view-toggles">
                <button 
                  className={`view-btn ${viewMode === 'grid' ? 'is-active' : ''}`} 
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                >
                  <svg className="icon"><use href="#icon-grid"></use></svg>
                </button>
                <button 
                  className={`view-btn ${viewMode === 'list' ? 'is-active' : ''}`} 
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                >
                  <svg className="icon"><use href="#icon-list"></use></svg>
                </button>
              </div>

              <div className="sort-dropdown">
                <select aria-label="Sort products" value={currentSort} onChange={handleSortChange}>
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="popular">Popularity</option>
                  <option value="name">Name</option>
                </select>
              </div>

              <button className="mobile-filter-btn mobile-only" onClick={() => setIsSidebarOpen(true)}>
                <svg className="icon"><use href="#icon-filter"></use></svg>
              </button>
            </div>
          </div>

          <div className={`product-grid shop-grid ${viewMode === 'list' ? 'is-list-view' : ''}`} id="product-container">
            {loading ? (
              <div className="text-center w-100 py-5">
                <p className="text-muted">Loading products...</p>
              </div>
            ) : products.length > 0 ? (
              products.map(product => (
                <ProductCard key={product.id} product={{
                  ...product,
                  image: product.primary_image?.startsWith('http') ? product.primary_image : `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${product.primary_image}`
                }} />
              ))
            ) : (
              <div className="text-center w-100 py-5">
                <p className="text-muted">No products found matching your filters.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default Shop;
