import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Settings, Image, Trash2, Edit, Plus, CheckCircle, XCircle } from 'lucide-react';

const Banners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBanner, setEditingBanner] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    mobile_image_url: '',
    link: '',
    sort_order: 0,
    is_active: 1
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data } = await api.get('/banners');
      if (data.success) {
        setBanners(data.banners);
      }
    } catch (err) {
      console.error('Failed to fetch banners:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (banner = null) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title: banner.title || '',
        subtitle: banner.subtitle || '',
        image_url: banner.image_url || '',
        mobile_image_url: banner.mobile_image_url || '',
        link: banner.link || '',
        sort_order: banner.sort_order || 0,
        is_active: banner.is_active
      });
    } else {
      setEditingBanner(null);
      setFormData({
        title: '',
        subtitle: '',
        image_url: '',
        mobile_image_url: '',
        link: '',
        sort_order: 0,
        is_active: 1
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBanner(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image_url) {
      alert('Desktop Banner Image is required.');
      return;
    }
    try {
      if (editingBanner) {
        await api.put(`/banners/${editingBanner.id}`, formData);
      } else {
        await api.post('/banners', formData);
      }
      fetchBanners();
      handleCloseModal();
    } catch (err) {
      console.error('Failed to save banner:', err);
      alert('Failed to save banner');
    }
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (type === 'desktop') setUploadingDesktop(true);
    else setUploadingMobile(true);

    const data = new FormData();
    data.append('file', file);
    try {
      const res = await api.post('/upload?folder=banners', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        if (type === 'desktop') {
          setFormData(prev => ({ ...prev, image_url: res.data.url }));
        } else {
          setFormData(prev => ({ ...prev, mobile_image_url: res.data.url }));
        }
      }
    } catch (err) {
      console.error('Error uploading banner image:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      if (type === 'desktop') setUploadingDesktop(false);
      else setUploadingMobile(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await api.put(`/banners/${id}`, { is_active: currentStatus ? 0 : 1 });
      fetchBanners();
    } catch (err) {
      alert('Failed to toggle status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    try {
      await api.delete(`/banners/${id}`);
      fetchBanners();
    } catch (err) {
      alert('Failed to delete banner');
    }
  };

  const formatImageUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${url}`;
  };

  if (loading) return <div className="p-4">Loading Banners...</div>;

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Homepage Banners</h2>
          <p className="text-muted mb-0">Manage responsive banners displayed on the storefront homepage carousel (Desktop vs. Mobile bleed).</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Add Responsive Banner
        </button>
      </div>

      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th scope="col" className="ps-4">Desktop View</th>
                <th scope="col">Mobile View</th>
                <th scope="col">Title & Subtitle</th>
                <th scope="col">Link</th>
                <th scope="col">Order</th>
                <th scope="col">Status</th>
                <th scope="col" className="text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    No banners found. Add a banner to display it on the homepage.
                  </td>
                </tr>
              ) : (
                banners.map((banner) => {
                  const title = banner.title?.trim() || '';
                  const subtitle = banner.subtitle?.trim() || '';

                  return (
                  <tr key={banner.id}>
                    <td className="ps-4">
                      <div style={{ width: '120px', height: '60px', borderRadius: '4px', overflow: 'hidden', background: '#f8f9fa', border: '1px solid #eee' }}>
                        <img 
                          src={formatImageUrl(banner.image_url)} 
                          alt={title || 'Desktop preview'} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    </td>
                    <td>
                      {banner.mobile_image_url ? (
                        <div style={{ width: '50px', height: '60px', borderRadius: '4px', overflow: 'hidden', background: '#f8f9fa', border: '1px solid #eee' }}>
                          <img 
                            src={formatImageUrl(banner.mobile_image_url)} 
                            alt={title || 'Mobile preview'} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </div>
                      ) : (
                        <span className="text-muted small">Same as desktop</span>
                      )}
                    </td>
                    <td>
                      {title && <div className="fw-bold">{title}</div>}
                      {subtitle && <div className="text-muted small">{subtitle}</div>}
                    </td>
                    <td>
                      {banner.link ? (
                        <span className="text-truncate d-inline-block" style={{ maxWidth: '150px' }} title={banner.link}>
                          <a href={banner.link} target="_blank" rel="noreferrer" className="text-decoration-none small">
                            {banner.link}
                          </a>
                        </span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td><span className="badge bg-light text-dark border">{banner.sort_order}</span></td>
                    <td>
                      <div className="form-check form-switch">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          checked={banner.is_active === 1} 
                          onChange={() => toggleStatus(banner.id, banner.is_active)}
                          style={{ cursor: 'pointer' }}
                        />
                        <label className="form-check-label ms-1">
                          {banner.is_active === 1 ? <span className="badge bg-success">Active</span> : <span className="badge bg-secondary">Hidden</span>}
                        </label>
                      </div>
                    </td>
                    <td className="text-end pe-4">
                      <button className="btn btn-sm btn-light me-2" onClick={() => handleOpenModal(banner)} title="Edit">
                        <Edit size={16} className="text-primary" />
                      </button>
                      <button className="btn btn-sm btn-light" onClick={() => handleDelete(banner.id)} title="Delete">
                        <Trash2 size={16} className="text-danger" />
                      </button>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header border-bottom-0 pb-0">
                  <h5 className="modal-title fw-bold">
                    {editingBanner ? 'Edit Banner' : 'Add New Responsive Banner'}
                  </h5>
                  <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                </div>
                <div className="modal-body animate__animated animate__fadeIn animate__fast">
                  <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Title (Optional overlay/tag)</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={formData.title} 
                          onChange={(e) => setFormData({...formData, title: e.target.value})} 
                          placeholder="Festive Saree Launch"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Subtitle (Optional)</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={formData.subtitle} 
                          onChange={(e) => setFormData({...formData, subtitle: e.target.value})} 
                          placeholder="Up to 40% OFF"
                        />
                      </div>
                      
                      {/* Desktop Image upload */}
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-primary">Desktop Banner Image (Required)</label>
                        <input 
                          type="file" 
                          className="form-control mb-2" 
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'desktop')}
                        />
                        {uploadingDesktop && (
                          <div className="d-flex align-items-center gap-2 mb-2 text-primary">
                            <span className="spinner-border spinner-border-sm" role="status"></span>
                            <span className="small">Uploading desktop image...</span>
                          </div>
                        )}
                        <input 
                          type="text" 
                          className="form-control" 
                          value={formData.image_url} 
                          onChange={(e) => setFormData({...formData, image_url: e.target.value})} 
                          required 
                          placeholder="Image URL or upload a file"
                        />
                        {formData.image_url && (
                          <div className="mt-2 text-center bg-light p-2 rounded-3 border">
                            <div className="text-muted small mb-1">Desktop Preview</div>
                            <img src={formatImageUrl(formData.image_url)} alt="Desktop Preview" style={{ maxHeight: '110px', maxWidth: '100%', objectFit: 'contain' }} className="rounded" />
                          </div>
                        )}
                      </div>

                      {/* Mobile Image upload */}
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-success">Mobile Banner Image (Optional)</label>
                        <input 
                          type="file" 
                          className="form-control mb-2" 
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'mobile')}
                        />
                        {uploadingMobile && (
                          <div className="d-flex align-items-center gap-2 mb-2 text-success">
                            <span className="spinner-border spinner-border-sm" role="status"></span>
                            <span className="small">Uploading mobile image...</span>
                          </div>
                        )}
                        <input 
                          type="text" 
                          className="form-control" 
                          value={formData.mobile_image_url} 
                          onChange={(e) => setFormData({...formData, mobile_image_url: e.target.value})} 
                          placeholder="Leaves empty to reuse desktop image"
                        />
                        {formData.mobile_image_url && (
                          <div className="mt-2 text-center bg-light p-2 rounded-3 border">
                            <div className="text-muted small mb-1">Mobile Preview (Potrait bleed)</div>
                            <img src={formatImageUrl(formData.mobile_image_url)} alt="Mobile Preview" style={{ maxHeight: '110px', maxWidth: '100%', objectFit: 'contain' }} className="rounded" />
                          </div>
                        )}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Redirect Link (Optional)</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={formData.link} 
                          onChange={(e) => setFormData({...formData, link: e.target.value})} 
                          placeholder="/shop?cat=sarees"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Sort Order (Lower numbers show first)</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          value={formData.sort_order} 
                          onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})} 
                        />
                      </div>
                      <div className="col-12">
                        <div className="form-check form-switch mt-2">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            id="activeSwitch" 
                            checked={formData.is_active === 1} 
                            onChange={(e) => setFormData({...formData, is_active: e.target.checked ? 1 : 0})}
                          />
                          <label className="form-check-label fw-semibold" htmlFor="activeSwitch">
                            Activate Banner Immediately
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                      <button type="button" className="btn btn-light" onClick={handleCloseModal}>Cancel</button>
                      <button type="submit" className="btn btn-primary px-4" disabled={uploadingDesktop || uploadingMobile}>
                        {editingBanner ? 'Save Changes' : 'Create Banner'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Banners;
