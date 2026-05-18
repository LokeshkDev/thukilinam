import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Settings, Image, Trash2, Edit, Plus, CheckCircle, XCircle } from 'lucide-react';

const Banners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBanner, setEditingBanner] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    link: '',
    sort_order: 0,
    is_active: 1
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data } = await api.get('/admin/manage/banners');
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
    try {
      if (editingBanner) {
        await api.put(`/admin/manage/banners/${editingBanner.id}`, formData);
      } else {
        await api.post('/admin/manage/banners', formData);
      }
      fetchBanners();
      handleCloseModal();
    } catch (err) {
      console.error('Failed to save banner:', err);
      alert('Failed to save banner');
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await api.put(`/admin/manage/banners/${id}`, { is_active: currentStatus ? 0 : 1 });
      fetchBanners();
    } catch (err) {
      alert('Failed to toggle status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    try {
      await api.delete(`/admin/manage/banners/${id}`);
      fetchBanners();
    } catch (err) {
      alert('Failed to delete banner');
    }
  };

  if (loading) return <div className="p-4">Loading Banners...</div>;

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Homepage Banners</h2>
          <p className="text-muted mb-0">Manage and activate banners displayed on the storefront homepage carousel.</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Add Banner
        </button>
      </div>

      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th scope="col" className="ps-4">Preview</th>
                <th scope="col">Title & Subtitle</th>
                <th scope="col">Link</th>
                <th scope="col">Order</th>
                <th scope="col">Status (Active)</th>
                <th scope="col" className="text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    No banners found. Add a banner to display it on the homepage.
                  </td>
                </tr>
              ) : (
                banners.map((banner) => (
                  <tr key={banner.id}>
                    <td className="ps-4">
                      <div style={{ width: '120px', height: '60px', borderRadius: '4px', overflow: 'hidden', background: '#f8f9fa' }}>
                        <img 
                          src={banner.image_url.startsWith('http') ? banner.image_url : `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${banner.image_url}`} 
                          alt={banner.title} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    </td>
                    <td>
                      <div className="fw-bold">{banner.title || 'Untitled'}</div>
                      <div className="text-muted small">{banner.subtitle}</div>
                    </td>
                    <td>
                      {banner.link ? (
                        <a href={banner.link} target="_blank" rel="noreferrer" className="text-decoration-none">
                          {banner.link}
                        </a>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>{banner.sort_order}</td>
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
                ))
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
                    {editingBanner ? 'Edit Banner' : 'Add New Banner'}
                  </h5>
                  <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Title (Optional)</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={formData.title} 
                          onChange={(e) => setFormData({...formData, title: e.target.value})} 
                          placeholder="Summer Collection"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Subtitle (Optional)</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={formData.subtitle} 
                          onChange={(e) => setFormData({...formData, subtitle: e.target.value})} 
                          placeholder="Discover the newest trends"
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold">Image URL (Required)</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={formData.image_url} 
                          onChange={(e) => setFormData({...formData, image_url: e.target.value})} 
                          required 
                          placeholder="https://example.com/banner.jpg or /uploads/banner.jpg"
                        />
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
                        <label className="form-label fw-semibold">Sort Order</label>
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
                      <button type="submit" className="btn btn-primary px-4">
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
