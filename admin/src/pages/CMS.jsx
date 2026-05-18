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
  content_pages: Object.fromEntries(
    Object.entries(defaultSettings.content_pages).map(([key, value]) => [key, { ...value, ...(incoming.content_pages?.[key] || {}) }])
  ),
  header_links: incoming.header_links || defaultSettings.header_links,
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
        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white fw-bold">Header Configuration</div>
            <div className="card-body">
              <label className="form-label">Announcement Bar Text</label>
              <input className="form-control mb-3" value={settings.header.announcement || ''} onChange={(e) => updateGroup('header', 'announcement', e.target.value)} />
              <label className="form-label">Logo Text</label>
              <input className="form-control" value={settings.header.logo_text || ''} onChange={(e) => updateGroup('header', 'logo_text', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white fw-bold d-flex justify-content-between align-items-center">
              <span>Header Navigation Links</span>
              <button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" onClick={addHeaderLink}>
                <Plus size={16} /> Add Link
              </button>
            </div>
            <div className="card-body p-0">
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
                            placeholder="Label (e.g. Sarees)" 
                            value={link.label} 
                            onChange={(e) => updateHeaderLink(link.id, 'label', e.target.value)}
                          />
                        </div>
                        <div className="col-7">
                          <input 
                            type="text" 
                            className="form-control form-control-sm" 
                            placeholder="URL (e.g. /shop?cat=sarees)" 
                            value={link.url} 
                            onChange={(e) => updateHeaderLink(link.id, 'url', e.target.value)}
                          />
                        </div>
                        <div className="col-1 text-end">
                          <button className="btn btn-sm btn-light text-danger" onClick={() => removeHeaderLink(link.id)}>
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
                                type="text" 
                                className="form-control form-control-sm" 
                                placeholder="e.g. /uploads/... or http..." 
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
