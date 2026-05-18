import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Search, Edit2, Trash2, Save, X } from 'lucide-react';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    sort_order: 0,
    is_active: 1
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      if (res.data.success) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setCurrentCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      sort_order: category.sort_order,
      is_active: category.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      const res = await api.delete(`/categories/${id}`);
      if (res.data.success) {
        fetchCategories();
      }
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentCategory) {
        await api.put(`/categories/${currentCategory.id}`, formData);
      } else {
        await api.post('/categories', formData);
      }
      setShowModal(false);
      fetchCategories();
      resetForm();
    } catch (err) {
      console.error('Error saving category:', err);
    }
  };

  const resetForm = () => {
    setCurrentCategory(null);
    setFormData({ name: '', slug: '', sort_order: 0, is_active: 1 });
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-categories">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Categories</h4>
        <button 
          className="btn btn-primary d-flex align-items-center gap-2 rounded-pill px-4"
          onClick={() => { resetForm(); setShowModal(true); }}
        >
          <Plus size={18} /> Add Category
        </button>
      </div>

      <div className="filters-card bg-white p-3 rounded-4 shadow-sm mb-4">
        <div className="input-group">
          <span className="input-group-text bg-transparent border-end-0"><Search size={18} className="text-muted" /></span>
          <input 
            type="text" 
            className="form-control border-start-0" 
            placeholder="Search categories..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-4 shadow-sm overflow-hidden">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="ps-4">Name</th>
                <th>Slug</th>
                <th>Sort Order</th>
                <th>Status</th>
                <th className="text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-5">Loading...</td></tr>
              ) : filteredCategories.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-5">No categories found.</td></tr>
              ) : filteredCategories.map((cat) => (
                <tr key={cat.id}>
                  <td className="ps-4 fw-bold">{cat.name}</td>
                  <td><code>{cat.slug}</code></td>
                  <td>{cat.sort_order}</td>
                  <td>
                    <span className={`badge ${cat.is_active ? 'bg-success-soft text-success' : 'bg-secondary-soft text-secondary'}`}>
                      {cat.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="text-end pe-4">
                    <div className="d-flex justify-content-end gap-2">
                      <button className="btn btn-sm btn-icon border" onClick={() => handleEdit(cat)}><Edit2 size={16} /></button>
                      <button className="btn btn-sm btn-icon border text-danger" onClick={() => handleDelete(cat.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">{currentCategory ? 'Edit Category' : 'Add Category'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">Category Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">Slug</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">Sort Order</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="mb-3 form-check form-switch">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                    />
                    <label className="form-check-label small fw-bold text-muted">Active Status</label>
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary rounded-pill px-4">Save Category</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
