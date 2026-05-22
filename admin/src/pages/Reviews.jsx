import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { MessageSquare, Check, X, Trash2, Star, User, Calendar, MessageCircle, AlertCircle } from 'lucide-react';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved', 'declined'

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/reviews');
      if (data.success) {
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const { data } = await api.put(`/reviews/${id}/approve`);
      if (data.success) {
        fetchReviews();
      }
    } catch (err) {
      console.error('Failed to approve review:', err);
      alert('Failed to approve review');
    }
  };

  const handleDecline = async (id) => {
    try {
      const { data } = await api.put(`/reviews/${id}/decline`);
      if (data.success) {
        fetchReviews();
      }
    } catch (err) {
      console.error('Failed to decline review:', err);
      alert('Failed to decline review');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this review? This action cannot be undone.')) return;
    try {
      await api.delete(`/reviews/${id}`);
      fetchReviews();
    } catch (err) {
      console.error('Failed to delete review:', err);
      alert('Failed to delete review');
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i} 
          size={14} 
          className={i <= rating ? "text-warning fill-warning" : "text-light"} 
          style={{ marginRight: '1px' }}
        />
      );
    }
    return <div className="d-flex align-items-center">{stars}</div>;
  };

  // Filter logic
  const filteredReviews = reviews.filter(review => {
    if (filter === 'pending') return review.is_approved === 0 && review.order_id !== null; // Pending means has order_id but not approved
    // Note: in our route, reviews start as approved=0. If declined, it stays as approved=0 but we can track if it was previously declined vs brand new.
    // To make it simple:
    // Approved: is_approved = 1
    // Pending: is_approved = 0
    if (filter === 'approved') return review.is_approved === 1;
    if (filter === 'pending') return review.is_approved === 0;
    return true; // 'all'
  });

  if (loading) return <div className="p-4">Loading Reviews & Feedback...</div>;

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Customer Reviews & Ratings</h2>
          <p className="text-muted mb-0">Monitor product reviews, verify buyers, and approve/decline storefront submissions.</p>
        </div>
        <div className="badge bg-light text-dark p-2 border">
          Total Reviews: {reviews.length}
        </div>
      </div>

      {/* Filters Tabs */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-2 d-flex gap-2 bg-light rounded">
          <button 
            className={`btn btn-sm px-4 py-2 ${filter === 'all' ? 'btn-primary' : 'btn-light'}`}
            onClick={() => setFilter('all')}
          >
            All Reviews ({reviews.length})
          </button>
          <button 
            className={`btn btn-sm px-4 py-2 ${filter === 'pending' ? 'btn-primary' : 'btn-light'}`}
            onClick={() => setFilter('pending')}
          >
            Pending Approval ({reviews.filter(r => r.is_approved === 0).length})
          </button>
          <button 
            className={`btn btn-sm px-4 py-2 ${filter === 'approved' ? 'btn-primary' : 'btn-light'}`}
            onClick={() => setFilter('approved')}
          >
            Approved ({reviews.filter(r => r.is_approved === 1).length})
          </button>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th scope="col" className="ps-4">Product Info</th>
                <th scope="col">Customer</th>
                <th scope="col">Rating & Review</th>
                <th scope="col">Date Submitted</th>
                <th scope="col">Status</th>
                <th scope="col" className="text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    <MessageSquare size={36} className="text-muted opacity-50 mb-3" />
                    <p className="mb-0">No reviews found matching the active filter.</p>
                  </td>
                </tr>
              ) : (
                filteredReviews.map((review) => {
                  return (
                    <tr key={review.id}>
                      <td className="ps-4">
                        <span className="fw-semibold text-truncate d-inline-block" style={{ maxWidth: '200px' }} title={review.product_name}>
                          {review.product_name}
                        </span>
                        <div className="text-muted small">ID: {review.product_id}</div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="bg-light rounded-circle p-2 text-primary" style={{ width: '32px', height: '32px', display: 'grid', placeItems: 'center' }}>
                            <User size={14} />
                          </div>
                          <div>
                            <div className="fw-bold">{review.user_name}</div>
                            {review.order_id && (
                              <span className="badge bg-success-subtle text-success border border-success-subtle small px-1 py-0" style={{ fontSize: '10px' }}>
                                Verified Buyer
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="mb-1">{renderStars(review.rating)}</div>
                        {review.title && <div className="fw-semibold text-dark small">{review.title}</div>}
                        {review.comment ? (
                          <div className="text-muted small text-wrap" style={{ maxWidth: '350px' }}>
                            "{review.comment}"
                          </div>
                        ) : (
                          <span className="text-muted italic small">No description provided</span>
                        )}
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1 text-muted small">
                          <Calendar size={12} />
                          {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td>
                        {review.is_approved === 1 ? (
                          <span className="badge bg-success d-inline-flex align-items-center gap-1">
                            <Check size={12} /> Approved
                          </span>
                        ) : (
                          <span className="badge bg-warning text-dark d-inline-flex align-items-center gap-1">
                            <AlertCircle size={12} /> Pending Approval
                          </span>
                        )}
                      </td>
                      <td className="text-end pe-4">
                        <div className="d-flex justify-content-end gap-1">
                          {review.is_approved === 0 ? (
                            <button 
                              className="btn btn-sm btn-success d-flex align-items-center gap-1"
                              onClick={() => handleApprove(review.id)}
                              title="Approve Review"
                            >
                              <Check size={14} /> Approve
                            </button>
                          ) : (
                            <button 
                              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                              onClick={() => handleDecline(review.id)}
                              title="Decline/Hide Review"
                            >
                              <X size={14} /> Decline
                            </button>
                          )}
                          <button 
                            className="btn btn-sm btn-light text-danger"
                            onClick={() => handleDelete(review.id)}
                            title="Delete Permanently"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reviews;
