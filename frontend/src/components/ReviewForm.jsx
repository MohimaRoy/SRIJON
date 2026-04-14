import { useState } from 'react';
import api from '../utils/api';
import { FaStar } from 'react-icons/fa';

export default function ReviewForm({ productId, sellerId, onReviewAdded }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/reviews', {
        product: productId,
        seller: sellerId,
        rating,
        comment
      });
      setSuccess('Review submitted successfully! It will appear once approved by an admin.');
      setComment('');
      setRating(5);
      if (onReviewAdded) onReviewAdded();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 mt-6 shadow-sm">
      <h3 className="font-bold text-gray-800 mb-4">Write a Review</h3>
      
      {error && <div className="mb-4 text-xs font-semibold text-red-600 bg-red-50 p-2 rounded">{error}</div>}
      {success && <div className="mb-4 text-xs font-semibold text-emerald-600 bg-emerald-50 p-2 rounded">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-2 font-semibold">Your Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <FaStar className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-200'}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-2 font-semibold">Your Review</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
            placeholder="Share your experience with this product..."
            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[100px]"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
}
