import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Trash2, Plus } from 'lucide-react';

const defaultSettings = {
  header: {
    announcement: 'FREE SHIPPING ON ORDERS OVER Rs.2000!',
    logo_text: '',
    logo_image: ''
  },
  footer: {
    about_text: '',
    address: '',
    email: '',
    phone: '',
    social_links: { facebook: '', instagram: '', twitter: '' }
  },
  shipping: {
    enabled: true,
    standard_cost: 149,
    free_threshold: 2999
  },
  contact: {
    eyebrow: 'Get in Touch',
    title: 'Contact Us',
    intro: 'Reach Thukilinam for orders, styling help, and boutique support.',
    phone: '+91 96006 84270',
    whatsapp: '919600684270',
    email: 'care@thukilinam.com',
    address: 'Thukilinam Boutique, Chennai, Tamil Nadu',
    map_embed_url: ''
  },
  content_pages: {
    'secure-checkout': { title: 'Secure Checkout', eyebrow: 'Payment Safety', intro: '', ctaLabel: 'Start Shopping', ctaUrl: '/shop', points: [] },
    'customer-care': { title: 'Customer Care', eyebrow: 'Support', intro: '', ctaLabel: 'Browse Collection', ctaUrl: '/shop', points: [] },
    'exchange-policy': { title: 'Exchange Policy', eyebrow: 'Easy Help', intro: '', ctaLabel: 'Contact Support', ctaUrl: '/customer-care', points: [] },
    'shipping-details': { title: 'Shipping Details', eyebrow: 'Delivery', intro: '', ctaLabel: 'View New In', ctaUrl: '/new-in', points: [] },
    stores: { title: 'Store & About Thukilinam', eyebrow: 'About Us', intro: '', ctaLabel: 'Explore Sarees', ctaUrl: '/sarees', points: [] },
    help: { title: 'How can we help?', eyebrow: 'Help Center', intro: '', ctaLabel: 'Customer Care', ctaUrl: '/customer-care', points: [] }
  },
  header_links: [
    { id: '1', label: 'New In', url: '/shop?sort=newest' },
    { id: '2', label: 'Sarees', url: '/shop?cat=sarees' },
    { id: '3', label: 'Kurti Sets', url: '/shop?cat=kurtis' },
    { id: '4', label: 'Fusion Wear', url: '/shop?cat=salwar-sets' },
    { id: '5', label: 'Boutique Deals', url: '/shop?sort=price_asc' }
  ],
  bottom_nav_links: [
    { id: '1', label: 'Home', url: '/', icon: 'home', access: 'everyone' },
    { id: '2', label: 'Trends', url: '/#trends', icon: 'trend', access: 'everyone' },
    { id: '3', label: 'Shop', url: '/shop', icon: 'grid', access: 'everyone' },
    { id: '4', label: 'Saved', url: '/wishlist', icon: 'heart', access: 'everyone' },
    { id: '5', label: 'Profile', url: '/profile', icon: 'user', access: 'everyone' }
  ],
  top_collections: {
    heading: 'Top Collections',
    subheading: 'Curated boutique edits crafted for comfort, tradition, and polished everyday moments.',
    list: [
      { id: '1', title: 'Sarees', image: '/uploads/tamilnadu_boutique_saree_tile_1778564289180.png', link: '/shop?cat=sarees' },
      { id: '2', title: 'Salwar Sets', image: '/uploads/tamilnadu_boutique_fusion_hero_1778563927977.png', link: '/shop?cat=salwar-sets' },
      { id: '3', title: 'Kurtis', image: '/uploads/tamilnadu_boutique_kurti_tile_1778564263790.png', link: '/shop?cat=kurtis' },
      { id: '4', title: 'Dupattas', image: '/uploads/tamilnadu_boutique_dupatta_tile_1778564006547.png', link: '/shop?cat=dupattas' },
      { id: '5', title: 'Blouses', image: 'https://images.pexels.com/photos/33325809/pexels-photo-33325809.jpeg?auto=compress&cs=tinysrgb&w=700', link: '/shop?cat=blouses' },
      { id: '6', title: 'Bottom Wear', image: 'https://images.pexels.com/photos/36738093/pexels-photo-36738093.jpeg?auto=compress&cs=tinysrgb&w=700', link: '/shop?cat=bottom-wears' }
    ]
  }
};

const pageLabels = {
  'secure-checkout': 'Secure Checkout',
  'customer-care': 'Customer Care',
  'exchange-policy': 'Exchange Policy',
  'shipping-details': 'Shipping Details',
  stores: 'Store / About Us',
  help: 'Help'
};

const mergeSettings = (incoming = {}) => ({
  header: { ...defaultSettings.header, ...(incoming.header || {}) },
  footer: {
    ...defaultSettings.footer,
    ...(incoming.footer || {}),
    social_links: { ...defaultSettings.footer.social_links, ...(incoming.footer?.social_links || {}) }
  },
  contact: { ...defaultSettings.contact, ...(incoming.contact || {}) },
  shipping: { ...defaultSettings.shipping, ...(incoming.shipping || {}) },
  content_pages: Object.fromEntries(
    Object.entries(defaultSettings.content_pages).map(([key, value]) => [key, { ...value, ...(incoming.content_pages?.[key] || {}) }])
  ),
  header_links: incoming.header_links || defaultSettings.header_links,
  bottom_nav_links: incoming.bottom_nav_links || defaultSettings.bottom_nav_links,
  top_collections: {
    heading: incoming.top_collections?.heading || defaultSettings.top_collections.heading,
    subheading: incoming.top_collections?.subheading || defaultSettings.top_collections.subheading,
    list: incoming.top_collections?.list || defaultSettings.top_collections.list
  }
});

const pointsToText = (points = []) => Array.isArray(points) ? points.join('\n') : '';
const textToPoints = (value) => value.split('\n').map((item) => item.trim()).filter(Boolean);

const CMS = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingLogo(true);
    const data = new FormData();
    data.append('file', file);
    try {
      const res = await api.post('/upload?folder=cms', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        updateGroup('header', 'logo_image', res.data.url);
      }
    } catch (err) {
      console.error('Error uploading logo:', err);
      alert('Failed to upload logo image.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCollectionImageUpload = async (id, e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingId(id);
    const data = new FormData();
    data.append('file', file);
    try {
      const res = await api.post('/upload?folder=cms', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        updateCollection(id, 'image', res.data.url);
      }
    } catch (err) {
      console.error('Error uploading collection image:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingId(null);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      if (data.success && data.settings) {
        setSettings(mergeSettings(data.settings));
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      alert('Failed to load CMS settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/settings', { settings });
      if (data.success) alert('CMS settings updated successfully!');
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Failed to save CMS settings');
    } finally {
      setSaving(false);
    }
  };

  const updateGroup = (group, field, value) => {
    setSettings((prev) => ({ ...prev, [group]: { ...prev[group], [field]: value } }));
  };

  const updateNested = (group, key, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [key]: { ...prev[group][key], [field]: value }
      }
    }));
  };

  // Header Links Helpers
  const addHeaderLink = () => {
    setSettings(prev => ({
      ...prev,
      header_links: [...(prev.header_links || []), { id: Date.now().toString(), label: '', url: '' }]
    }));
  };

  const updateHeaderLink = (id, field, value) => {
    setSettings(prev => ({
      ...prev,
      header_links: prev.header_links.map(link => link.id === id ? { ...link, [field]: value } : link)
    }));
  };

  const removeHeaderLink = (id) => {
    setSettings(prev => ({
      ...prev,
      header_links: prev.header_links.filter(link => link.id !== id)
    }));
  };

  // Bottom Nav Links Helpers
  const addBottomNavLink = () => {
    setSettings(prev => ({
      ...prev,
      bottom_nav_links: [...(prev.bottom_nav_links || []), { id: Date.now().toString(), label: '', url: '', icon: 'grid', access: 'everyone' }]
    }));
  };

  const updateBottomNavLink = (id, field, value) => {
    setSettings(prev => ({
      ...prev,
      bottom_nav_links: prev.bottom_nav_links.map(link => link.id === id ? { ...link, [field]: value } : link)
    }));
  };

  const removeBottomNavLink = (id) => {
    setSettings(prev => ({
      ...prev,
      bottom_nav_links: prev.bottom_nav_links.filter(link => link.id !== id)
    }));
  };

  // Top Collections Helpers
  const addCollection = () => {
    setSettings(prev => ({
      ...prev,
      top_collections: {
        ...prev.top_collections,
        list: [...(prev.top_collections?.list || []), { id: Date.now().toString(), title: '', image: '', link: '' }]
      }
    }));
  };

  const updateCollection = (id, field, value) => {
    setSettings(prev => ({
      ...prev,
      top_collections: {
        ...prev.top_collections,
        list: prev.top_collections.list.map(col => col.id === id ? { ...col, [field]: value } : col)
      }
    }));
  };

  const removeCollection = (id) => {
    setSettings(prev => ({
      ...prev,
      top_collections: {
        ...prev.top_collections,
        list: prev.top_collections.list.filter(col => col.id !== id)
      }
    }));
  };

  const updateCollectionMeta = (field, value) => {
    setSettings(prev => ({
      ...prev,
      top_collections: {
        ...prev.top_collections,
        [field]: value
      }
    }));
  };

  if (loading) return <div className="p-4">Loading CMS settings...</div>;

  return (
    <div className="cms-management p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Storefront CMS</h2>
          <p className="text-muted mb-0">Manage homepage chrome, support pages, and header menu landing pages.</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      <div className="row">
        <div className="col-lg-4 mb-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white fw-bold">Header Configuration</div>
            <div className="card-body">
              <label className="form-label">Announcement Bar Text</label>
              <input className="form-control mb-3" value={settings.header.announcement || ''} onChange={(e) => updateGroup('header', 'announcement', e.target.value)} />
              <label className="form-label">Logo Text</label>
              <input className="form-control mb-3" value={settings.header.logo_text || ''} onChange={(e) => updateGroup('header', 'logo_text', e.target.value)} />
              
              <label className="form-label">Logo Image</label>
              <input type="file" className="form-control mb-2" accept="image/*" onChange={handleLogoUpload} />
              {uploadingLogo && <div className="spinner-border spinner-border-sm text-primary mb-2 animate__animated animate__spin" />}
              <input className="form-control" placeholder="Or paste Logo Image URL" value={settings.header.logo_image || ''} onChange={(e) => updateGroup('header', 'logo_image', e.target.value)} />
              {settings.header.logo_image && (
                <div className="mt-2 p-2 bg-light rounded text-center">
                  <img src={settings.header.logo_image} alt="Logo Preview" style={{ maxHeight: '50px', objectFit: 'contain' }} className="rounded animate__animated animate__fadeIn" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4 mb-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white fw-bold d-flex justify-content-between align-items-center">
              <span>Header Navigation Links</span>
              <button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" onClick={addHeaderLink}>
                <Plus size={16} /> Add
              </button>
            </div>
            <div className="card-body p-0" style={{ maxHeight: '380px', overflowY: 'auto' }}>
              <div className="list-group list-group-flush">
                {(!settings.header_links || settings.header_links.length === 0) ? (
                  <div className="p-4 text-center text-muted">No navigation links added.</div>
                ) : (
                  settings.header_links.map((link, index) => (
                    <div className="list-group-item p-3" key={link.id || index}>
                      <div className="row g-2 align-items-center">
                        <div className="col-4">
                          <input 
                            type="text" 
                            className="form-control form-control-sm" 
                            placeholder="Label" 
                            value={link.label} 
                            onChange={(e) => updateHeaderLink(link.id, 'label', e.target.value)}
                          />
                        </div>
                        <div className="col-6">
                          <input 
                            type="text" 
                            className="form-control form-control-sm" 
                            placeholder="URL" 
                            value={link.url} 
                            onChange={(e) => updateHeaderLink(link.id, 'url', e.target.value)}
                          />
                        </div>
                        <div className="col-2 text-end">
                          <button className="btn btn-sm btn-light text-danger p-1" onClick={() => removeHeaderLink(link.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4 mb-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white fw-bold d-flex justify-content-between align-items-center">
              <span>Mobile Bottom Nav Links</span>
              <button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" onClick={addBottomNavLink}>
                <Plus size={16} /> Add
              </button>
            </div>
            <div className="card-body p-0" style={{ maxHeight: '380px', overflowY: 'auto' }}>
              <div className="list-group list-group-flush">
                {(!settings.bottom_nav_links || settings.bottom_nav_links.length === 0) ? (
                  <div className="p-4 text-center text-muted">No bottom nav links added.</div>
                ) : (
                  settings.bottom_nav_links.map((link, index) => (
                    <div className="list-group-item p-3" key={link.id || index}>
                      <div className="row g-1 align-items-center">
                        <div className="col-3">
                          <input 
                            type="text" 
                            className="form-control form-control-sm px-1" 
                            placeholder="Label" 
                            value={link.label} 
                            onChange={(e) => updateBottomNavLink(link.id, 'label', e.target.value)}
                          />
                        </div>
                        <div className="col-3">
                          <input 
                            type="text" 
                            className="form-control form-control-sm px-1" 
                            placeholder="URL" 
                            value={link.url} 
                            onChange={(e) => updateBottomNavLink(link.id, 'url', e.target.value)}
                          />
                        </div>
                        <div className="col-3">
                          <select 
                            className="form-select form-select-sm px-1"
                            style={{ fontSize: '11px' }}
                            value={link.icon || 'grid'}
                            onChange={(e) => updateBottomNavLink(link.id, 'icon', e.target.value)}
                          >
                            <option value="home">Home</option>
                            <option value="trend">Trend</option>
                            <option value="grid">Grid</option>
                            <option value="heart">Heart</option>
                            <option value="user">User</option>
                            <option value="bag">Bag</option>
                            <option value="search">Search</option>
                          </select>
                        </div>
                        <div className="col-2">
                          <select 
                            className="form-select form-select-sm px-1"
                            style={{ fontSize: '11px' }}
                            value={link.access || 'everyone'}
                            onChange={(e) => updateBottomNavLink(link.id, 'access', e.target.value)}
                          >
                            <option value="everyone">Everyone</option>
                            <option value="logged_in">Logged-in</option>
                            <option value="guest">Guest</option>
                          </select>
                        </div>
                        <div className="col-1 text-end">
                          <button className="btn btn-sm btn-light text-danger p-1" onClick={() => removeBottomNavLink(link.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white fw-bold d-flex justify-content-between align-items-center">
              <span>Top Collections Configuration</span>
              <button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" onClick={addCollection}>
                <Plus size={16} /> Add Collection
              </button>
            </div>
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Section Title</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Top Collections" 
                    value={settings.top_collections?.heading || ''} 
                    onChange={(e) => updateCollectionMeta('heading', e.target.value)}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Section Subtitle</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Curated boutique edits crafted for comfort..." 
                    value={settings.top_collections?.subheading || ''} 
                    onChange={(e) => updateCollectionMeta('subheading', e.target.value)}
                  />
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-borderless align-middle mb-0">
                  <thead>
                    <tr className="text-muted" style={{ fontSize: '12px' }}>
                      <th style={{ width: '25%' }}>Collection Title</th>
                      <th style={{ width: '40%' }}>Image Path / URL</th>
                      <th style={{ width: '30%' }}>Target Link</th>
                      <th style={{ width: '5%', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!settings.top_collections?.list || settings.top_collections.list.length === 0) ? (
                      <tr>
                        <td colSpan="4" className="text-center py-4 text-muted">No collections configured. Click "Add Collection" to get started!</td>
                      </tr>
                    ) : (
                      settings.top_collections.list.map((col, index) => (
                        <tr key={col.id || index}>
                          <td>
                            <input 
                              type="text" 
                              className="form-control form-control-sm" 
                              placeholder="e.g. Sarees" 
                              value={col.title} 
                              onChange={(e) => updateCollection(col.id, 'title', e.target.value)}
                            />
                          </td>
                          <td>
                            <div className="d-flex flex-column gap-1">
                              <div className="d-flex align-items-center gap-2">
                                {col.image && (
                                  <span className="d-inline-block border rounded overflow-hidden" style={{ width: '32px', height: '32px', flexShrink: 0 }}>
                                    <img 
                                      src={col.image.startsWith('http') ? col.image : `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${col.image}`} 
                                      alt="Preview" 
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                      onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                  </span>
                                )}
                                <input 
                                  type="file" 
                                  className="form-control form-control-sm" 
                                  accept="image/*"
                                  onChange={(e) => handleCollectionImageUpload(col.id, e)}
                                />
                                {uploadingId === col.id && <div className="spinner-border spinner-border-sm text-primary" />}
                              </div>
                              <input 
                                type="text" 
                                className="form-control form-control-sm" 
                                placeholder="Or enter Image URL" 
                                value={col.image} 
                                onChange={(e) => updateCollection(col.id, 'image', e.target.value)}
                              />
                            </div>
                          </td>
                          <td>
                            <input 
                              type="text" 
                              className="form-control form-control-sm" 
                              placeholder="e.g. /shop?cat=sarees" 
                              value={col.link} 
                              onChange={(e) => updateCollection(col.id, 'link', e.target.value)}
                            />
                          </td>
                          <td className="text-end">
                            <button className="btn btn-sm btn-light text-danger border-0 rounded-circle" onClick={() => removeCollection(col.id)}>
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 mb-4">
          <div className="card shadow-sm border-0 border-start border-4 border-primary">
            <div className="card-header bg-white fw-bold d-flex justify-content-between align-items-center flex-wrap gap-2">
              <span>Shipping &amp; Delivery Charges</span>
              <span className="badge text-bg-light text-primary border">Checkout · Cart · Orders</span>
            </div>
            <div className="card-body">
              <p className="text-muted small mb-4">
                Set how much customers pay for delivery. Orders at or above the free-shipping amount ship at no extra charge.
              </p>
              <div className="row g-4 align-items-start">
                <div className="col-lg-7">
                  <div className="form-check form-switch mb-4">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="shipping-enabled"
                      checked={settings.shipping?.enabled !== false}
                      onChange={(e) => updateGroup('shipping', 'enabled', e.target.checked)}
                    />
                    <label className="form-check-label fw-semibold" htmlFor="shipping-enabled">
                      Charge shipping on orders
                    </label>
                    <div className="text-muted small">Turn off for complimentary shipping on every order.</div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Standard shipping fee (₹)</label>
                      <div className="input-group">
                        <span className="input-group-text">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          className="form-control"
                          disabled={settings.shipping?.enabled === false}
                          value={settings.shipping?.standard_cost ?? 149}
                          onChange={(e) => updateGroup('shipping', 'standard_cost', Math.max(0, Number(e.target.value) || 0))}
                        />
                      </div>
                      <small className="text-muted">Applied when the cart is below the free-shipping threshold.</small>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Free shipping above (₹)</label>
                      <div className="input-group">
                        <span className="input-group-text">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          className="form-control"
                          disabled={settings.shipping?.enabled === false}
                          value={settings.shipping?.free_threshold ?? 2999}
                          onChange={(e) => updateGroup('shipping', 'free_threshold', Math.max(0, Number(e.target.value) || 0))}
                        />
                      </div>
                      <small className="text-muted">Set to 0 to always charge the standard fee.</small>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm mt-3"
                    onClick={() => {
                      const threshold = Number(settings.shipping?.free_threshold) || 0;
                      if (threshold > 0) {
                        updateGroup('header', 'announcement', `FREE SHIPPING ON ORDERS OVER Rs.${threshold.toLocaleString('en-IN')}!`);
                      }
                    }}
                  >
                    Copy rule to announcement bar
                  </button>
                </div>

                <div className="col-lg-5">
                  <div className="p-4 rounded-3 bg-light h-100">
                    <h6 className="fw-bold mb-3">Customer preview</h6>
                    {settings.shipping?.enabled === false ? (
                      <p className="mb-0 text-success fw-semibold">All orders ship free — no delivery fee.</p>
                    ) : (
                      <>
                        <p className="mb-2">
                          <span className="text-muted">Below ₹{Number(settings.shipping?.free_threshold || 0).toLocaleString('en-IN')}:</span>
                          <strong className="ms-1">₹{Number(settings.shipping?.standard_cost || 0).toLocaleString('en-IN')} shipping</strong>
                        </p>
                        {Number(settings.shipping?.free_threshold) > 0 ? (
                          <p className="mb-2">
                            <span className="text-muted">₹{Number(settings.shipping?.free_threshold).toLocaleString('en-IN')} and above:</span>
                            <strong className="ms-1 text-success">Free shipping</strong>
                          </p>
                        ) : null}
                        <hr className="my-3" />
                        <p className="small text-muted mb-0">
                          Example: cart ₹2,000 → shipping ₹{Number(settings.shipping?.standard_cost || 0).toLocaleString('en-IN')}
                          {Number(settings.shipping?.free_threshold) > 0 && (
                            <> · cart ₹{Number(settings.shipping?.free_threshold).toLocaleString('en-IN')} → <span className="text-success">free</span></>
                          )}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white fw-bold">Footer Configuration</div>
            <div className="card-body row">
              <div className="col-md-4">
                <label className="form-label">About Text</label>
                <textarea className="form-control mb-3" rows="4" value={settings.footer.about_text || ''} onChange={(e) => updateGroup('footer', 'about_text', e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Support Email</label>
                <input className="form-control mb-3" value={settings.footer.email || ''} onChange={(e) => updateGroup('footer', 'email', e.target.value)} />
                <label className="form-label">Support Phone</label>
                <input className="form-control" value={settings.footer.phone || ''} onChange={(e) => updateGroup('footer', 'phone', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white fw-bold">Contact Page</div>
            <div className="card-body">
              <p className="text-muted small mb-4">
                Controls the public <code>/contact</code> page: phone, WhatsApp, email, address, and Google Maps embed.
              </p>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label">Eyebrow</label>
                  <input className="form-control mb-3" value={settings.contact?.eyebrow || ''} onChange={(e) => updateGroup('contact', 'eyebrow', e.target.value)} />
                  <label className="form-label">Page Title</label>
                  <input className="form-control mb-3" value={settings.contact?.title || ''} onChange={(e) => updateGroup('contact', 'title', e.target.value)} />
                  <label className="form-label">Intro Text</label>
                  <textarea className="form-control" rows="4" value={settings.contact?.intro || ''} onChange={(e) => updateGroup('contact', 'intro', e.target.value)} />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Phone (display)</label>
                  <input className="form-control mb-3" placeholder="+91 96006 84270" value={settings.contact?.phone || ''} onChange={(e) => updateGroup('contact', 'phone', e.target.value)} />
                  <label className="form-label">WhatsApp Number</label>
                  <input className="form-control mb-3" placeholder="919600684270" value={settings.contact?.whatsapp || ''} onChange={(e) => updateGroup('contact', 'whatsapp', e.target.value)} />
                  <small className="text-muted d-block mb-3">Digits only with country code, no + or spaces required.</small>
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" placeholder="care@thukilinam.com" value={settings.contact?.email || ''} onChange={(e) => updateGroup('contact', 'email', e.target.value)} />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Store Address</label>
                  <textarea className="form-control mb-3" rows="3" placeholder="Street, city, state" value={settings.contact?.address || ''} onChange={(e) => updateGroup('contact', 'address', e.target.value)} />
                  <label className="form-label">Google Maps Embed URL</label>
                  <textarea className="form-control" rows="4" placeholder="https://www.google.com/maps/embed?pb=..." value={settings.contact?.map_embed_url || ''} onChange={(e) => updateGroup('contact', 'map_embed_url', e.target.value)} />
                  <small className="text-muted d-block mt-2">
                    Paste the iframe <code>src</code> from Google Maps → Share → Embed a map.
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h4 className="fw-bold mb-3 mt-2">Support & Information Pages</h4>
      <div className="row">
        {Object.entries(settings.content_pages).map(([key, page]) => (
          <div className="col-xl-4 col-lg-6 mb-4" key={key}>
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-white fw-bold">{pageLabels[key]}</div>
              <div className="card-body">
                <label className="form-label">Eyebrow</label>
                <input className="form-control mb-3" value={page.eyebrow || ''} onChange={(e) => updateNested('content_pages', key, 'eyebrow', e.target.value)} />
                <label className="form-label">Title</label>
                <input className="form-control mb-3" value={page.title || ''} onChange={(e) => updateNested('content_pages', key, 'title', e.target.value)} />
                <label className="form-label">Intro</label>
                <textarea className="form-control mb-3" rows="3" value={page.intro || ''} onChange={(e) => updateNested('content_pages', key, 'intro', e.target.value)} />
                <label className="form-label">Points, one per line</label>
                <textarea className="form-control mb-3" rows="4" value={pointsToText(page.points)} onChange={(e) => updateNested('content_pages', key, 'points', textToPoints(e.target.value))} />
                <label className="form-label">CTA Label</label>
                <input className="form-control mb-3" value={page.ctaLabel || ''} onChange={(e) => updateNested('content_pages', key, 'ctaLabel', e.target.value)} />
                <label className="form-label">CTA URL</label>
                <input className="form-control" value={page.ctaUrl || ''} onChange={(e) => updateNested('content_pages', key, 'ctaUrl', e.target.value)} />
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default CMS;
