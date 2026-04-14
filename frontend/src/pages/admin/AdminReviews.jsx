import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FaStar, FaCheck, FaTimes, FaTrash } from 'react-icons/fa';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const { data } = await api.get('/reviews/admin');
      setReviews(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (id, approve) => {
    if (!window.confirm(`Are you sure you want to ${approve ? 'approve' : 'reject'} this review?`)) return;
    try {
      await api.patch(`/reviews/${id}/moderate`, { adminApproved: approve });
      fetchReviews();
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review entirely?')) return;
    try {
      await api.delete(`/reviews/${id}`);
      fetchReviews();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Review Moderation</h1>
        <p className="text-gray-500 text-sm mt-1">Approve or reject customer product reviews before they go live</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>
      ) : (
        <div className="grid gap-4">
          {reviews.map(review => (
            <div key={review._id} className={`bg-white rounded-xl shadow-sm border p-5 flex flex-col md:flex-row gap-4 md:items-center justify-between ${review.adminApproved ? 'border-green-200' : 'border-yellow-200'}`}>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <FaStar key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-200'} size={14} />
                    ))}
                  </div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${review.adminApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {review.adminApproved ? 'Approved Live' : 'Pending Review'}
                  </span>
                </div>
                
                <p className="text-gray-800 text-sm italic mb-3">"{review.comment}"</p>
                
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                  <div><span className="font-semibold text-gray-700">Buyer:</span> {review.buyer?.name}</div>
                  <div><span className="font-semibold text-gray-700">Product:</span> {review.product?.name}</div>
                  <div><span className="font-semibold text-gray-700">Seller:</span> {review.seller?.name}</div>
                </div>
              </div>

              <div className="flex md:flex-col gap-2 shrink-0">
                {!review.adminApproved ? (
                  <button 
                    onClick={() => handleModerate(review._id, true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-sm font-semibold transition"
                  >
                    <FaCheck size={12}/> Approve
                  </button>
                ) : (
                  <button 
                    onClick={() => handleModerate(review._id, false)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 rounded-lg text-sm font-semibold transition"
                  >
                    <FaTimes size={12}/> Hide
                  </button>
                )}
                <button 
                  onClick={() => handleDelete(review._id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-semibold transition"
                >
                  <FaTrash size={12}/> Delete
                </button>
              </div>
            </div>
          ))}
          {reviews.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-500">
               No reviews found across the platform.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
