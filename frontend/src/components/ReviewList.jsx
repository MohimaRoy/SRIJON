import { useState, useEffect } from 'react';
import api from '../utils/api';
import { FaStar } from 'react-icons/fa';

export default function ReviewList({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const { data } = await api.get(`/reviews/product/${productId}`);
      setReviews(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="py-4 text-sm text-gray-500">Loading reviews...</div>;

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <FaStar className="text-yellow-400" /> 
        Customer Reviews <span className="text-sm font-normal text-gray-400">({reviews.length})</span>
      </h3>
      
      {reviews.length === 0 ? (
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-8 text-center text-gray-500">
          No reviews yet. Check back soon!
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
             <div key={review._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4 mb-3">
                   <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex justify-center items-center font-bold text-lg">
                      {review.buyer?.name?.charAt(0) || 'U'}
                   </div>
                   <div>
                      <div className="font-semibold text-gray-800 text-sm">{review.buyer?.name || 'Anonymous User'}</div>
                      <div className="flex text-yellow-400 mt-1">
                        {[...Array(5)].map((_, i) => (
                           <FaStar key={i} size={12} className={i < review.rating ? 'text-yellow-400' : 'text-gray-200'}/>
                        ))}
                      </div>
                   </div>
                   <div className="ml-auto text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString()}
                   </div>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed pl-14">
                  "{review.comment}"
                </p>
             </div>
          ))}
        </div>
      )}
    </div>
  );
}
