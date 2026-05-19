import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Search, Edit2, Trash2, ExternalLink, X, Save, Image as ImageIcon, UploadCloud, CheckCircle } from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    sku: '',
    price: '',
    discount_price: '',
    stock: '',
    category_id: '',
    description: '',
    is_active: 1,
    is_bestseller: 0,
    is_new_arrival: 0,
    badge: '',
    variants: []
  });
  
  const [attributes, setAttributes] = useState([{ name: 'Size', values: [] }]);
  const [bulkActionData, setBulkActionData] = useState({ price: '', stock: '', discount: '' });
  const [productImages, setProductImages] = useState([]);
  const [pickingVariantIdx, setPickingVariantIdx] = useState(null);

  const currentAttrNames = attributes.filter(a => a.name && a.values.length > 0).map(a => a.name).sort();
  const variantAttrNames = formData.variants?.length > 0 ? Object.keys(typeof formData.variants[0].attributes === 'string' ? JSON.parse(formData.variants[0].attributes) : (formData.variants[0].attributes || {})).sort() : [];
  const attributesMatch = JSON.stringify(currentAttrNames) === JSON.stringify(variantAttrNames);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [searchTerm, selectedCategory]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products', { 
        params: { 
          search: searchTerm,
          category: selectedCategory 
        } 
      });
      if (res.data.success) {
        setProducts(res.data.products);
        setTotal(res.data.total);
      }
    } catch (err) {
      console.error('Error fetching admin products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (res.data.success) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleEdit = async (product) => {
    setCurrentProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      sku: product.sku || '',
      price: product.price,
      discount_price: product.discount_price || '',
      stock: product.stock,
      category_id: product.category_id || '',
      description: product.description || '',
      is_active: product.is_active,
      is_bestseller: product.is_bestseller,
      is_new_arrival: product.is_new_arrival,
      badge: product.badge || '',
      variants: []
    });
    
    try {
      const res = await api.get(`/products/${product.id}/variants`);
      if (res.data.success) {
        setFormData(prev => ({ ...prev, variants: res.data.variants }));
        
        // Populate attributes state for builder
        if (res.data.variants && res.data.variants.length > 0) {
          const collectedAttrs = {};
          res.data.variants.forEach(v => {
            const attrs = typeof v.attributes === 'string' ? JSON.parse(v.attributes) : v.attributes;
            if (attrs) {
              Object.entries(attrs).forEach(([k, val]) => {
                if (!collectedAttrs[k]) collectedAttrs[k] = new Set();
                collectedAttrs[k].add(val);
              });
            }
          });
          const attrsArray = Object.entries(collectedAttrs).map(([name, valuesSet]) => ({
            name,
            values: Array.from(valuesSet)
          }));
          if (attrsArray.length > 0) {
            setAttributes(attrsArray);
          } else {
            setAttributes([{ name: 'Size', values: [] }]);
          }
        } else {
          setAttributes([{ name: 'Size', values: [] }]);
        }
      }
    } catch (err) {
      console.error('Error fetching variants:', err);
    }

    try {
      const detailRes = await api.get(`/products/${product.id}/images`);
      if (detailRes.data.success) {
        setProductImages(detailRes.data.images || []);
      }
    } catch (err) {
      console.error('Error fetching product images:', err);
    }
    
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this product?')) return;
    try {
      const res = await api.delete(`/products/${id}`);
      if (res.data.success) {
        fetchProducts();
      }
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form data being saved:', formData);
    try {
      const validAttrs = attributes.filter(a => a.name && a.values.length > 0);
      if (validAttrs.length > 0 && (!formData.variants || formData.variants.length === 0)) {
        if (!window.confirm('You have defined attributes but generated NO variants. Do you want to save without variants?')) {
          return;
        }
      }

      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'variants') {
          data.append(key, value);
        }
      });
      
      const variantsToSave = formData.variants?.map(v => {
        const { image_file, ...rest } = v;
        return rest;
      }) || [];
      data.append('variants', JSON.stringify(variantsToSave));
      
      formData.variants?.forEach((v, idx) => {
        if (v.image_file) {
          data.append(`variant_image_${idx}`, v.image_file);
        }
      });

      data.append('product_images', JSON.stringify(productImages));

      if (currentProduct) {
        await api.put(`/products/${currentProduct.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/products', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setShowModal(false);
      fetchProducts();
      resetForm();
    } catch (err) {
      console.error('Error saving product:', err);
    }
  };

  const resetForm = () => {
    setCurrentProduct(null);
    setFormData({
      name: '',
      slug: '',
      sku: '',
      price: '',
      discount_price: '',
      stock: '',
      category_id: '',
      description: '',
      is_active: 1,
      is_bestseller: 0,
      is_new_arrival: 0,
      badge: '',
      variants: []
    });
    setAttributes([{ name: 'Size', values: [] }]);
    setProductImages([]);
  };

  const handleProductImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    for (const file of files) {
      const data = new FormData();
      data.append('file', file);
      
      const tempId = 'temp-' + Date.now() + '-' + Math.round(Math.random() * 1e5);
      setProductImages(prev => [...prev, { id: tempId, image_url: '', is_loading: true }]);
      
      try {
        const res = await api.post('/upload?folder=products', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data.success) {
          setProductImages(prev => {
            const list = prev.filter(img => img.id !== tempId);
            const hasPrimary = list.some(img => img.is_primary === 1);
            return [...list, {
              id: 'new-' + Date.now() + '-' + Math.round(Math.random() * 1e5),
              image_url: res.data.url,
              is_primary: hasPrimary ? 0 : 1
            }];
          });
        }
      } catch (err) {
        console.error('Error uploading product image:', err);
        setProductImages(prev => prev.filter(img => img.id !== tempId));
        alert('Failed to upload image. Please try again.');
      }
    }
  };

  const makeImagePrimary = (index) => {
    setProductImages(prev => prev.map((img, idx) => ({
      ...img,
      is_primary: idx === index ? 1 : 0
    })));
  };

  const deleteProductImage = (index) => {
    setProductImages(prev => {
      const list = prev.filter((_, idx) => idx !== index);
      if (prev[index]?.is_primary === 1 && list.length > 0) {
        list[0].is_primary = 1;
      }
      return list;
    });
  };

  return (
    <div className="admin-products">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Inventory <span className="text-muted small">({total})</span></h4>
        <button 
          className="btn btn-primary d-flex align-items-center gap-2 rounded-pill px-4"
          onClick={() => { resetForm(); setShowModal(true); }}
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      <div className="filters-card bg-white p-3 rounded-4 shadow-sm mb-4">
        <div className="row align-items-center">
          <div className="col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0"><Search size={18} className="text-muted" /></span>
              <input 
                type="text" 
                className="form-control border-start-0" 
                placeholder="Search products by name or SKU..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-6 text-md-end mt-3 mt-md-0">
            <select 
              className="form-select d-inline-block w-auto me-2"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="products-table bg-white rounded-4 shadow-sm overflow-hidden">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="ps-4">Product</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Flags</th>
                <th>Status</th>
                <th className="text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center py-5">Loading...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-5">No products found.</td></tr>
              ) : products.map((product) => (
                <tr key={product.id}>
                  <td className="ps-4">
                    <div className="d-flex align-items-center gap-3">
                      <img src={product.primary_image || 'https://via.placeholder.com/40x60'} alt="" className="rounded-2" style={{ width: '40px', height: '55px', objectFit: 'cover' }} />
                      <div>
                        <h6 className="mb-0 fw-bold">{product.name}</h6>
                        <small className="text-muted">{product.category_name}</small>
                      </div>
                    </div>
                  </td>
                  <td><code className="small text-dark">{product.sku || 'N/A'}</code></td>
                  <td>
                    <div className="fw-bold">₹{product.discount_price || product.price}</div>
                    {product.discount_price && <small className="text-muted text-decoration-line-through">₹{product.price}</small>}
                  </td>
                  <td>
                    <span className={`fw-bold ${product.stock < 10 ? 'text-danger' : 'text-success'}`}>{product.stock}</span>
                  </td>
                  <td>
                    <div className="d-flex gap-1 flex-wrap">
                      {product.is_bestseller ? <span className="badge bg-warning-soft text-warning border border-warning-subtle">Best Seller</span> : null}
                      {product.is_new_arrival ? <span className="badge bg-info-soft text-info border border-info-subtle">New Arrival</span> : null}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${product.is_active ? 'bg-success-soft text-success' : 'bg-secondary-soft text-secondary'}`}>
                      {product.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="text-end pe-4">
                    <div className="d-flex justify-content-end gap-2">
                      <button className="btn btn-sm btn-icon border" onClick={() => handleEdit(product)}><Edit2 size={16} /></button>
                      <button className="btn btn-sm btn-icon border text-danger" onClick={() => handleDelete(product.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">{currentProduct ? 'Edit Product' : 'Add Product'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body overflow-auto" style={{ maxHeight: '80vh' }}>
                  <div className="row g-3">
                    <div className="col-md-8">
                      <label className="form-label small fw-bold text-muted">Product Name</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">SKU</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">Category</label>
                      <select 
                        className="form-select"
                        required
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">Slug</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        required
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">Price (₹)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        required
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">Discount Price (₹)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        value={formData.discount_price}
                        onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">Stock</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        required
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted">Description</label>
                      <textarea 
                        className="form-control" 
                        rows="3"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      ></textarea>
                    </div>
                    
                    {/* Product Gallery Images & Primary Selection */}
                    <div className="col-12">
                      <div className="card border shadow-sm rounded-3 overflow-hidden mb-3">
                        <div className="card-header bg-white border-bottom py-3">
                          <h6 className="fw-bold mb-0 text-dark d-flex align-items-center">
                            <ImageIcon size={18} className="text-primary me-2" /> Product Gallery Images & Primary Selection
                          </h6>
                          <small className="text-muted text-xs">Upload high-resolution images. The highlighted primary image represents the default storefront display.</small>
                        </div>
                        <div className="card-body bg-light-subtle">
                          <div className="row g-3">
                            {productImages.map((img, idx) => (
                              <div key={img.id} className="col-6 col-sm-4 col-md-3" style={{ minWidth: '150px' }}>
                                <div className={`card h-100 border position-relative overflow-hidden transition-all shadow-sm ${img.is_primary ? 'border-primary ring-2' : 'border-light-subtle'}`} style={{ minHeight: '160px' }}>
                                  {img.is_loading ? (
                                    <div className="d-flex flex-column align-items-center justify-content-center h-100 p-3" style={{ minHeight: '160px' }}>
                                      <div className="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
                                      <span className="text-muted small fs-7">Uploading...</span>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="position-relative" style={{ height: '110px' }}>
                                        <img 
                                          src={img.image_url} 
                                          alt="Product" 
                                          className="w-100 h-100 object-fit-cover" 
                                        />
                                        
                                        {/* Image Action Overlays */}
                                        <div className="position-absolute top-0 end-0 p-1">
                                          <button
                                            type="button"
                                            onClick={() => deleteProductImage(idx)}
                                            className="btn btn-danger btn-sm p-1 rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                                            style={{ width: '24px', height: '24px', opacity: 0.9 }}
                                            title="Delete image"
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                      </div>
                                      
                                      <div className="card-body p-2 d-flex flex-column justify-content-between align-items-center bg-white border-top">
                                        {img.is_primary ? (
                                          <span className="badge bg-primary w-100 py-1.5 fs-7 d-flex align-items-center justify-content-center">
                                            <CheckCircle size={12} className="me-1" /> Primary
                                          </span>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => makeImagePrimary(idx)}
                                            className="btn btn-outline-secondary btn-sm w-100 py-0.5 fs-7 text-nowrap"
                                          >
                                            Set Primary
                                          </button>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                            
                            {/* Upload Button Card */}
                            <div className="col-6 col-sm-4 col-md-3" style={{ minWidth: '150px' }}>
                              <label className="card h-100 border border-dashed border-2 d-flex flex-column align-items-center justify-content-center text-center p-3 cursor-pointer hover-bg-light transition-all text-muted" style={{ minHeight: '160px', borderStyle: 'dashed', cursor: 'pointer' }}>
                                <input 
                                  type="file" 
                                  className="d-none" 
                                  multiple 
                                  accept="image/*" 
                                  onChange={handleProductImageUpload} 
                                />
                                <UploadCloud size={32} className="text-primary mb-2" />
                                <span className="fw-semibold small text-primary">Upload Images</span>
                                <span className="fs-7 text-muted mt-1">PNG, JPG, WebP</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Advanced Variants Section */}
                    <div className="col-12">
                      <div className="bg-light p-3 rounded-3 mb-3">
                        <h6 className="small fw-bold mb-3">Product Variants</h6>
                        
                        {/* Attribute Builder */}
                        <div className="mb-4">
                          <label className="form-label small text-muted mb-2">Define Attributes (e.g. Size, Color)</label>
                          {attributes.map((attr, attrIdx) => (
                            <div key={attrIdx} className="card p-2 mb-2 border-0 shadow-sm">
                              <div className="d-flex gap-2 align-items-center mb-2">
                                <input 
                                  type="text" 
                                  className="form-control form-control-sm w-25" 
                                  placeholder="Attribute Name (e.g. Size)" 
                                  value={attr.name}
                                  onChange={(e) => {
                                    const newAttrs = [...attributes];
                                    newAttrs[attrIdx].name = e.target.value;
                                    setAttributes(newAttrs);
                                  }}
                                />
                                <div className="d-flex flex-wrap gap-1 flex-grow-1">
                                  {attr.values.map((val, valIdx) => (
                                    <span key={valIdx} className="badge bg-white text-dark border d-flex align-items-center gap-1">
                                      {val}
                                      <button 
                                        type="button" 
                                        className="btn-close" 
                                        style={{ fontSize: '0.5rem' }}
                                        onClick={() => {
                                          const newAttrs = [...attributes];
                                          newAttrs[attrIdx].values = attr.values.filter((_, i) => i !== valIdx);
                                          setAttributes(newAttrs);
                                        }}
                                      ></button>
                                    </span>
                                  ))}
                                  <input 
                                    type="text" 
                                    className="form-control form-control-sm d-inline-block w-auto" 
                                    placeholder="Add value..." 
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && e.target.value.trim()) {
                                        e.preventDefault();
                                        const newAttrs = [...attributes];
                                        newAttrs[attrIdx].values.push(e.target.value.trim());
                                        setAttributes(newAttrs);
                                        e.target.value = '';
                                      }
                                    }}
                                  />
                                </div>
                                <button 
                                  type="button" 
                                  className="btn btn-sm text-danger"
                                  onClick={() => {
                                    setAttributes(attributes.filter((_, i) => i !== attrIdx));
                                  }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                          <button 
                            type="button" 
                            className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                            onClick={() => setAttributes([...attributes, { name: '', values: [] }])}
                          >
                            <Plus size={14} /> Add Attribute
                          </button>
                        </div>

                        {/* Generate Button */}
                        <div className="mb-3 d-flex justify-content-between align-items-center">
                          <button 
                            type="button" 
                            className="btn btn-sm btn-primary"
                            onClick={() => {
                              // Cartesian product generator
                              const generateCombinations = (arrays) => {
                                return arrays.reduce((acc, curr) => {
                                  return acc.flatMap(d => curr.map(e => [...d, e]));
                                }, [[]]);
                              };

                              const validAttrs = attributes.filter(a => a.name && a.values.length > 0);
                              if (validAttrs.length === 0) {
                                alert('Please add at least one attribute with values.');
                                return;
                              }

                              const arrays = validAttrs.map(a => a.values);
                              const combinations = generateCombinations(arrays);

                              const newVariants = combinations.map(combo => {
                                const attrsObj = {};
                                validAttrs.forEach((attr, idx) => {
                                  attrsObj[attr.name] = combo[idx];
                                });

                                // Check if exact combination already exists
                                const existing = formData.variants?.find(v => {
                                  const vAttrs = typeof v.attributes === 'string' ? JSON.parse(v.attributes) : (v.attributes || {});
                                  return JSON.stringify(vAttrs) === JSON.stringify(attrsObj);
                                });

                                if (existing) return existing;

                                // Find a partial match to copy data (price, stock, etc.)
                                const partialMatch = formData.variants?.find(v => {
                                  const vAttrs = typeof v.attributes === 'string' ? JSON.parse(v.attributes) : (v.attributes || {});
                                  return Object.entries(vAttrs).some(([k, val]) => attrsObj[k] === val);
                                });

                                return {
                                  attributes: attrsObj,
                                  sku: '',
                                  price: partialMatch?.price || formData.price || '',
                                  sale_price: partialMatch?.sale_price || '',
                                  stock: partialMatch?.stock || '0',
                                  barcode: partialMatch?.barcode || '',
                                  weight: partialMatch?.weight || '',
                                  image_url: partialMatch?.image_url || '',
                                  is_active: partialMatch?.is_active !== undefined ? partialMatch.is_active : 1
                                };
                              });

                              setFormData(prev => ({ ...prev, variants: newVariants }));
                            }}
                          >
                            Generate Combinations
                          </button>
                          
                          {formData.variants && formData.variants.length > 0 && (
                            <span className="small text-muted">{formData.variants.length} variants generated</span>
                          )}
                        </div>

                        {/* Bulk Actions */}
                        {formData.variants && formData.variants.length > 0 && (
                          <div className="card p-2 mb-3 border-0 shadow-sm bg-white">
                            <h6 className="small fw-bold mb-2">Bulk Actions</h6>
                            <div className="row g-2 align-items-end">
                              <div className="col-md-3">
                                <label className="form-label small text-muted mb-1">Price</label>
                                <input type="number" className="form-control form-control-sm" placeholder="Set price" value={bulkActionData.price} onChange={(e) => setBulkActionData({...bulkActionData, price: e.target.value})} />
                              </div>
                              <div className="col-md-3">
                                <label className="form-label small text-muted mb-1">Stock</label>
                                <input type="number" className="form-control form-control-sm" placeholder="Set stock" value={bulkActionData.stock} onChange={(e) => setBulkActionData({...bulkActionData, stock: e.target.value})} />
                              </div>
                              <div className="col-md-3">
                                <label className="form-label small text-muted mb-1">Discount %</label>
                                <input type="number" className="form-control form-control-sm" placeholder="Apply discount" value={bulkActionData.discount} onChange={(e) => setBulkActionData({...bulkActionData, discount: e.target.value})} />
                              </div>
                              <div className="col-md-3">
                                <div className="d-flex gap-1">
                                  <button 
                                    type="button" 
                                    className="btn btn-sm btn-outline-primary flex-grow-1"
                                    onClick={() => {
                                      const updated = formData.variants.map(v => ({
                                        ...v,
                                        price: bulkActionData.price || v.price,
                                        stock: bulkActionData.stock || v.stock,
                                        sale_price: bulkActionData.discount ? (parseFloat(bulkActionData.price || v.price) * (1 - parseFloat(bulkActionData.discount)/100)).toFixed(2) : v.sale_price
                                      }));
                                      setFormData({ ...formData, variants: updated });
                                    }}
                                  >
                                    Apply
                                  </button>
                                  <button 
                                    type="button" 
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => {
                                      if (window.confirm('Delete all variants?')) {
                                        setFormData({ ...formData, variants: [] });
                                      }
                                    }}
                                  >
                                    Clear All
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Variants Table */}
                        {formData.variants && formData.variants.length > 0 && !attributesMatch && (
                          <div className="alert alert-warning small py-2 mb-2">
                            ⚠️ Attributes have changed! Please click "Generate Combinations" to update the table.
                          </div>
                        )}
                        {formData.variants && formData.variants.length > 0 && (
                          <div className="table-responsive" style={{ maxHeight: '400px' }}>
                            <table className="table table-sm align-middle mb-0 table-borderless">
                              <thead className="text-muted small" style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa', zIndex: 1 }}>
                                <tr>
                                  <th>Variant</th>
                                  <th>Image</th>
                                  <th>SKU</th>
                                  <th>Price</th>
                                  <th>Sale Price</th>
                                  <th>Stock</th>
                                  <th>Barcode</th>
                                  <th>Weight</th>
                                  <th>Status</th>
                                  <th className="text-end">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {formData.variants.map((v, idx) => {
                                  const attrs = typeof v.attributes === 'string' ? JSON.parse(v.attributes) : (v.attributes || {});
                                  const comboStr = Object.entries(attrs).map(([k, val]) => `${val}`).join(' / ') || 'Default';
                                  return (
                                    <tr key={idx} className="border-bottom">
                                      <td className="small fw-bold">{comboStr}</td>
                                      <td>
                                        <div className="d-flex align-items-center gap-1">
                                          {(() => {
                                            const imgs = (() => {
                                              const imgVal = v.image_url;
                                              if (!imgVal) return [];
                                              try { if (imgVal.startsWith('[')) return JSON.parse(imgVal); } catch(e){}
                                              return imgVal.split(',').map(s => s.trim()).filter(Boolean);
                                            })();
                                            
                                            if (imgs.length === 0) {
                                              return <span className="text-muted small text-xs italic">No image</span>;
                                            }
                                            
                                            return (
                                              <div className="d-flex gap-1" style={{ maxWidth: '60px', overflow: 'hidden' }}>
                                                {imgs.slice(0, 2).map((url, i) => (
                                                  <img key={i} src={url} alt="" className="rounded-1 border" style={{ width: '28px', height: '28px', objectFit: 'cover' }} />
                                                ))}
                                                {imgs.length > 2 && <span className="text-muted small align-self-center" style={{ fontSize: '10px' }}>+{imgs.length - 2}</span>}
                                              </div>
                                            );
                                          })()}
                                          <button 
                                            type="button" 
                                            onClick={() => setPickingVariantIdx(idx)}
                                            className="btn btn-sm btn-outline-secondary p-1 d-flex align-items-center justify-content-center border-0"
                                            style={{ width: '28px', height: '28px' }}
                                            title="Manage Variant Images"
                                          >
                                            <ImageIcon size={14} />
                                          </button>
                                        </div>
                                      </td>
                                      <td>
                                        <input type="text" className="form-control form-control-sm" style={{ width: '100px' }} value={v.sku} onChange={(e) => {
                                          const updated = [...formData.variants];
                                          updated[idx].sku = e.target.value;
                                          setFormData(prev => ({ ...prev, variants: updated }));
                                        }} />
                                      </td>
                                      <td>
                                        <input type="number" className="form-control form-control-sm" style={{ width: '80px' }} value={v.price} onChange={(e) => {
                                          const updated = [...formData.variants];
                                          updated[idx].price = e.target.value;
                                          setFormData(prev => ({ ...prev, variants: updated }));
                                        }} />
                                      </td>
                                      <td>
                                        <input type="number" className="form-control form-control-sm" style={{ width: '80px' }} value={v.sale_price} onChange={(e) => {
                                          const updated = [...formData.variants];
                                          updated[idx].sale_price = e.target.value;
                                          setFormData(prev => ({ ...prev, variants: updated }));
                                        }} />
                                      </td>
                                      <td>
                                        <input type="number" className="form-control form-control-sm" style={{ width: '70px' }} value={v.stock} onChange={(e) => {
                                          const updated = [...formData.variants];
                                          updated[idx].stock = e.target.value;
                                          setFormData(prev => ({ ...prev, variants: updated }));
                                        }} />
                                      </td>
                                      <td>
                                        <input type="text" className="form-control form-control-sm" style={{ width: '100px' }} value={v.barcode} onChange={(e) => {
                                          const updated = [...formData.variants];
                                          updated[idx].barcode = e.target.value;
                                          setFormData(prev => ({ ...prev, variants: updated }));
                                        }} />
                                      </td>
                                      <td>
                                        <input type="text" className="form-control form-control-sm" style={{ width: '70px' }} value={v.weight} onChange={(e) => {
                                          const updated = [...formData.variants];
                                          updated[idx].weight = e.target.value;
                                          setFormData(prev => ({ ...prev, variants: updated }));
                                        }} />
                                      </td>
                                      <td>
                                        <div className="form-check form-switch">
                                          <input 
                                            className="form-check-input" 
                                            type="checkbox" 
                                            checked={v.is_active === 1}
                                            onChange={(e) => {
                                              const updated = [...formData.variants];
                                              updated[idx].is_active = e.target.checked ? 1 : 0;
                                              setFormData({ ...formData, variants: updated });
                                            }}
                                          />
                                        </div>
                                      </td>
                                      <td className="text-end">
                                        <button 
                                          type="button" 
                                          className="btn btn-sm text-danger"
                                          onClick={() => {
                                            const updated = formData.variants.filter((_, i) => i !== idx);
                                            setFormData({ ...formData, variants: updated });
                                          }}
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="bg-light p-3 rounded-3">
                        <h6 className="small fw-bold mb-3">Product Flags & Status</h6>
                        <div className="d-flex gap-4">
                          <div className="form-check form-switch">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              checked={formData.is_bestseller}
                              onChange={(e) => setFormData({ ...formData, is_bestseller: e.target.checked ? 1 : 0 })}
                            />
                            <label className="form-check-label small fw-bold text-muted">Best Seller</label>
                          </div>
                          <div className="form-check form-switch">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              checked={formData.is_new_arrival}
                              onChange={(e) => setFormData({ ...formData, is_new_arrival: e.target.checked ? 1 : 0 })}
                            />
                            <label className="form-check-label small fw-bold text-muted">New Arrival</label>
                          </div>
                          <div className="form-check form-switch ms-auto">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              checked={formData.is_active}
                              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                            />
                            <label className="form-check-label small fw-bold text-muted">Active</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary rounded-pill px-4">
                    <Save size={18} className="me-2" /> Save Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {pickingVariantIdx !== null && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}>
          <div className="modal-dialog modal-md modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-0 pb-0">
                <h6 className="modal-title fw-bold text-dark d-flex align-items-center">
                  <ImageIcon size={18} className="text-primary me-2" /> Manage Variant Images
                </h6>
                <button type="button" className="btn-close" onClick={() => setPickingVariantIdx(null)}></button>
              </div>
              <div className="modal-body">
                <p className="text-muted small mb-3">
                  Select one or more images from the product gallery for this variant, or upload new variant-specific images.
                </p>
                
                {/* Currently Selected Variant Images */}
                <div className="mb-4">
                  <label className="form-label small fw-bold text-muted d-block">Selected for this Variant ({
                    (() => {
                      const v = formData.variants[pickingVariantIdx];
                      const imgVal = v?.image_url;
                      if (!imgVal) return 0;
                      try { if (imgVal.startsWith('[')) return JSON.parse(imgVal).length; } catch(e){}
                      return imgVal.split(',').filter(Boolean).length;
                    })()
                  })</label>
                  <div className="d-flex flex-wrap gap-2 p-2 border rounded-3 bg-light" style={{ minHeight: '60px' }}>
                    {(() => {
                      const v = formData.variants[pickingVariantIdx];
                      if (!v) return null;
                      const imgs = (() => {
                        const imgVal = v.image_url;
                        if (!imgVal) return [];
                        try { if (imgVal.startsWith('[')) return JSON.parse(imgVal); } catch(e){}
                        return imgVal.split(',').map(s => s.trim()).filter(Boolean);
                      })();
                      
                      if (imgs.length === 0) {
                        return <span className="text-muted small m-auto">No images selected for this variant.</span>;
                      }
                      
                      return imgs.map((url, i) => (
                        <div key={i} className="position-relative" style={{ width: '50px', height: '50px' }}>
                          <img src={url} className="w-100 h-100 object-fit-cover rounded-2 border" alt="" />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...formData.variants];
                              const nextImgs = imgs.filter((_, idx) => idx !== i);
                              updated[pickingVariantIdx].image_url = JSON.stringify(nextImgs);
                              setFormData({ ...formData, variants: updated });
                            }}
                            className="position-absolute top-0 end-0 btn btn-danger p-0 rounded-circle d-flex align-items-center justify-content-center text-white border-0"
                            style={{ width: '16px', height: '16px', marginTop: '-6px', marginRight: '-6px', padding: 0 }}
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
                
                {/* Choose from Product Gallery */}
                <div className="mb-4">
                  <label className="form-label small fw-bold text-muted">Select from Product Gallery</label>
                  {productImages.length === 0 ? (
                    <div className="text-center p-3 border rounded-3 bg-light-subtle">
                      <span className="text-muted small">No product gallery images uploaded yet.</span>
                    </div>
                  ) : (
                    <div className="row g-2 overflow-auto" style={{ maxHeight: '180px' }}>
                      {productImages.map((img) => {
                        const v = formData.variants[pickingVariantIdx];
                        const imgs = v ? (() => {
                          const imgVal = v.image_url;
                          if (!imgVal) return [];
                          try { if (imgVal.startsWith('[')) return JSON.parse(imgVal); } catch(e){}
                          return imgVal.split(',').map(s => s.trim()).filter(Boolean);
                        })() : [];
                        const isSelected = imgs.includes(img.image_url);
                        
                        return (
                          <div key={img.id} className="col-3">
                            <div 
                              onClick={() => {
                                const updated = [...formData.variants];
                                const nextImgs = isSelected 
                                  ? imgs.filter(url => url !== img.image_url)
                                  : [...imgs, img.image_url];
                                updated[pickingVariantIdx].image_url = JSON.stringify(nextImgs);
                                setFormData({ ...formData, variants: updated });
                              }}
                              className={`card p-0 border overflow-hidden cursor-pointer position-relative h-100 ${isSelected ? 'border-primary ring-2' : 'border-light'}`}
                              style={{ height: '70px', cursor: 'pointer' }}
                            >
                              <img src={img.image_url} className="w-100 h-100 object-fit-cover" alt="" />
                              {isSelected && (
                                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-primary bg-opacity-25">
                                  <CheckCircle size={18} className="text-primary bg-white rounded-circle" />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                {/* Upload New Specifically for Variant */}
                <div>
                  <label className="form-label small fw-bold text-muted">Upload New Images for this Variant</label>
                  <input 
                    type="file" 
                    className="form-control form-control-sm" 
                    multiple 
                    accept="image/*"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files);
                      if (!files.length) return;
                      
                      for (const file of files) {
                        const data = new FormData();
                        data.append('file', file);
                        
                        try {
                          const res = await api.post('/upload?folder=products', data, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                          });
                          if (res.data.success) {
                            const newUrl = res.data.url;
                            
                            // Add to main product gallery first so it's visible & selectable
                            setProductImages(prev => {
                              const hasPrimary = prev.some(img => img.is_primary === 1);
                              return [...prev, {
                                id: 'new-' + Date.now() + '-' + Math.round(Math.random() * 1e5),
                                image_url: newUrl,
                                is_primary: hasPrimary ? 0 : 1
                              }];
                            });
                            
                            // Add to this variant's image list
                            const updated = [...formData.variants];
                            const v = updated[pickingVariantIdx];
                            const imgs = (() => {
                              const imgVal = v.image_url;
                              if (!imgVal) return [];
                              try { if (imgVal.startsWith('[')) return JSON.parse(imgVal); } catch(e){}
                              return imgVal.split(',').map(s => s.trim()).filter(Boolean);
                            })();
                            
                            updated[pickingVariantIdx].image_url = JSON.stringify([...imgs, newUrl]);
                            setFormData({ ...formData, variants: updated });
                          }
                        } catch (err) {
                          console.error('Error uploading variant image:', err);
                          alert('Upload failed.');
                        }
                      }
                    }}
                  />
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-primary rounded-pill px-4" onClick={() => setPickingVariantIdx(null)}>Done</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
