import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [actionId, setActionId] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [previewProduct, setPreviewProduct] = useState(null);

  useEffect(() => {
    fetchPendingProducts();
  }, []);

  const fetchPendingProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/products/admin/pending');
      setProducts(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setActionId(id);
    try {
      await api.patch(`/products/${id}/approve`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      if (previewProduct?._id === id) setPreviewProduct(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    setActionId(rejectModal.id);
    try {
      await api.patch(`/products/${rejectModal.id}/reject`, { reason: rejectReason });
      setProducts((prev) => prev.filter((p) => p._id !== rejectModal.id));
      if (previewProduct?._id === rejectModal.id) setPreviewProduct(null);
      setRejectModal(null);
      setRejectReason('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionId(null);
    }
  };

  const CATEGORY_ICONS = {
    vegetables: '🥦', fruits: '🍎', grains: '🌾', dairy: '🥛',
    poultry: '🐔', fish: '🐟', spices: '🌶️', organic: '🌿', other: '📦',
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1B2B4B]">Pending Product Approvals</h1>
        <p className="text-gray-500 text-sm mt-1">
          Review and approve products before they go live on the shop
        </p>
      </div>

      {/* Stats */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center gap-3">
        <span className="text-2xl">📦</span>
        <div>
          <p className="font-bold text-yellow-800">{products.length} products waiting for approval</p>
          <p className="text-xs text-yellow-600">Approved products will appear on the /shop page</p>
        </div>
      </div>

      {/* Product list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-3xl mb-3">✅</p>
            <p className="font-medium text-gray-600">No pending products</p>
            <p className="text-sm text-gray-400 mt-1">All products have been reviewed</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Seller</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {/* Image or icon */}
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center text-xl">
                          {product.images?.[0]
                            ? <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                            : CATEGORY_ICONS[product.category] || '📦'
                          }
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{product.name}</p>
                          <span className="text-xs text-gray-400 capitalize">
                            {CATEGORY_ICONS[product.category]} {product.category}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-gray-700">{product.seller?.name}</p>
                      <p className="text-xs text-gray-400">{product.seller?.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <p className="font-semibold text-gray-800 text-sm">৳{product.discountPrice || product.price}</p>
                        {product.discountPrice && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-gray-400 line-through">৳{product.price}</span>
                            <span className="text-[9px] bg-red-50 text-red-500 font-black px-1 py-0.5 rounded leading-none">-{product.discountPercent}%</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-600">{product.stock} {product.unit}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-500">
                        {new Date(product.createdAt).toLocaleDateString('en-BD', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPreviewProduct(product)}
                          className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => handleApprove(product._id)}
                          disabled={actionId === product._id}
                          className="text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {actionId === product._id ? '...' : '✓ Approve'}
                        </button>
                        <button
                          onClick={() => setRejectModal({ id: product._id, name: product.name })}
                          disabled={actionId === product._id}
                          className="text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewProduct && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">Product Preview</h3>
              <button onClick={() => setPreviewProduct(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="p-5 space-y-4">
              {/* Images */}
              {previewProduct.images?.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {previewProduct.images.map((img, i) => (
                    <img key={i} src={img.url} alt="" className="w-24 h-24 object-cover rounded-xl flex-shrink-0" />
                  ))}
                </div>
              )}

              <div>
                <p className="text-xl font-bold text-gray-800">{previewProduct.name}</p>
                <span className="text-xs text-gray-400 capitalize">{previewProduct.category}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-[#1B2B4B]">৳{previewProduct.discountPrice || previewProduct.price}</span>
                <span className="text-sm text-gray-400">/ {previewProduct.unit}</span>
                {previewProduct.discountPrice && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400 line-through">৳{previewProduct.price}</span>
                    <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm">SAVE {previewProduct.discountPercent}%</span>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">
                <p className="font-semibold text-gray-700 mb-1">Description</p>
                <div 
                  className="leading-relaxed ql-editor !p-0"
                  dangerouslySetInnerHTML={{ __html: previewProduct.description }}
                />
                <style>{`
                  .ql-editor ul { list-style-type: disc; margin-left: 1.25rem; }
                  .ql-editor ol { list-style-type: decimal; margin-left: 1.25rem; }
                `}</style>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs">Stock</p>
                  <p className="font-semibold text-gray-700">{previewProduct.stock} {previewProduct.unit}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs">Seller</p>
                  <p className="font-semibold text-gray-700">{previewProduct.seller?.name}</p>
                </div>
                {previewProduct.location?.district && (
                  <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                    <p className="text-gray-400 text-xs">Location</p>
                    <p className="font-semibold text-gray-700">
                      {[previewProduct.location.upazila, previewProduct.location.district, previewProduct.location.division].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button
                onClick={() => setRejectModal({ id: previewProduct._id, name: previewProduct.name })}
                className="flex-1 py-2.5 border border-red-200 text-red-600 font-bold rounded-xl text-sm hover:bg-red-50 transition-colors"
              >
                ✕ Reject
              </button>
              <button
                onClick={() => handleApprove(previewProduct._id)}
                disabled={actionId === previewProduct._id}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                {actionId === previewProduct._id ? 'Approving...' : '✓ Approve & Go Live'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="font-bold text-gray-800 mb-1">Reject Product</h3>
            <p className="text-sm text-gray-500 mb-4">
              Rejecting <span className="font-semibold text-gray-700">"{rejectModal.name}"</span>
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (will be shown to the seller)..."
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionId === rejectModal.id}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
              >
                {actionId === rejectModal.id ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
