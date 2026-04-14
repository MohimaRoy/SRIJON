import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FaBox, FaSearch, FaCheck, FaTimes, FaUndo, FaEye } from 'react-icons/fa';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/admin/orders');
      setOrders(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status, disputeResolved = undefined) => {
    if (!window.confirm(`Are you sure you want to change status to ${status || (disputeResolved ? 'refunded' : '')}?`)) return;
    
    try {
      const payload = {};
      if (status) payload.orderStatus = status;
      if (disputeResolved !== undefined) payload.disputeResolved = disputeResolved;

      await api.patch(`/admin/orders/${id}/status`, payload);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchStatus = filter === 'all' || o.orderStatus === filter;
    const matchSearch = String(o._id).includes(searchTerm) || o.buyer?.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-500 text-sm mt-1">Full control over all platform orders</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"/>
            <input
              type="text"
              placeholder="Search ID or Buyer..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 w-full">
                  <th className="px-6 py-4 font-semibold">Order Details</th>
                  <th className="px-6 py-4 font-semibold">Buyer & Seller</th>
                  <th className="px-6 py-4 font-semibold">Amount & Payment</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map(order => (
                  <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-sm text-gray-900">#{String(order._id).slice(-8)}</div>
                      <div className="text-xs text-gray-500 mt-1">{new Date(order.createdAt).toLocaleDateString()}</div>
                      <div className="text-xs text-emerald-600 mt-1">{order.products.length} items</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm"><span className="text-gray-500 text-xs">B:</span> {order.buyer?.name}</div>
                      <div className="text-sm mt-1"><span className="text-gray-500 text-xs">S:</span> {order.seller?.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-sm">৳{order.totalAmount}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs uppercase text-gray-500">{order.paymentMethod}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          order.paymentStatus === 'completed' ? 'bg-green-100 text-green-700' : 
                          order.paymentStatus === 'refunded' ? 'bg-purple-100 text-purple-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize
                        ${order.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' :
                          order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-700' :
                          order.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'}`}
                      >
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <select 
                        className="text-xs border border-gray-300 rounded px-2 py-1 bg-white mr-2"
                        value=""
                        onChange={(e) => { 
                          if(e.target.value) handleStatusUpdate(order._id, e.target.value); 
                        }}
                      >
                        <option value="">Update Status...</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      <button 
                        onClick={() => { setSelectedOrder(order); setShowPreviewModal(true); }}
                        title="Preview Order Details"
                        className="inline-flex items-center justify-center w-7 h-7 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 mr-2"
                      >
                        <FaEye size={12}/>
                      </button>

                      {order.paymentStatus !== 'refunded' && (
                        <button 
                          onClick={() => handleStatusUpdate(order._id, null, true)}
                          title="Resolve Dispute (Refund Payment)"
                          className="inline-flex items-center justify-center w-7 h-7 bg-purple-100 text-purple-600 rounded hover:bg-purple-200"
                        >
                          <FaUndo size={12}/>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500 flex flex-col items-center">
                       <FaBox className="text-4xl text-gray-300 mb-2"/>
                       No orders found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- PREVIEW MODAL --- */}
      {showPreviewModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Order #{String(selectedOrder._id).slice(-8)}</h2>
                <p className="text-xs text-gray-500 mt-1">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
              </div>
              <button 
                onClick={() => { setShowPreviewModal(false); setSelectedOrder(null); }}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* General Info */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <h3 className="font-semibold text-gray-800 border-b border-gray-200 pb-3 mb-3 text-sm uppercase tracking-wider">Payment & Status</h3>
                  <div className="space-y-3 text-sm">
                    <p className="flex justify-between"><span className="text-gray-500">Total Amount:</span> <span className="font-bold text-emerald-600">৳{selectedOrder.totalAmount}</span></p>
                    <p className="flex justify-between"><span className="text-gray-500">Method:</span> <span className="uppercase font-medium text-gray-700">{selectedOrder.paymentMethod}</span></p>
                    <p className="flex justify-between">
                      <span className="text-gray-500">Payment Status:</span> 
                      <span className={`px-2 py-0.5 rounded text-xs font-bold capitalize ${
                        selectedOrder.paymentStatus === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>{selectedOrder.paymentStatus}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500">Order Status:</span> 
                      <span className={`px-2 py-0.5 rounded text-xs font-bold capitalize ${
                        selectedOrder.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' : 
                        selectedOrder.orderStatus === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>{selectedOrder.orderStatus}</span>
                    </p>
                    {selectedOrder.transactionId && (
                      <p className="flex justify-between"><span className="text-gray-500">Transaction ID:</span> <span className="font-mono text-gray-700 text-xs">{selectedOrder.transactionId}</span></p>
                    )}
                  </div>
                </div>
                
                {/* Shipping & Customer */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                   <h3 className="font-semibold text-gray-800 border-b border-gray-200 pb-3 mb-3 text-sm uppercase tracking-wider">Customer & Shipping</h3>
                   <div className="space-y-3 text-sm">
                     {selectedOrder.buyer && (
                       <>
                         <p className="flex justify-between"><span className="text-gray-500">Name:</span> <span className="font-medium text-gray-800">{selectedOrder.buyer.name}</span></p>
                         <p className="flex justify-between"><span className="text-gray-500">Email:</span> <span className="text-gray-700 truncate ml-4" title={selectedOrder.buyer.email}>{selectedOrder.buyer.email}</span></p>
                       </>
                     )}
                     
                     <div className="mt-4 pt-4 border-t border-gray-200">
                       <p className="text-gray-500 mb-1">Delivery Address:</p>
                       {selectedOrder.deliveryAddress ? (
                         <div className="text-gray-800 font-medium leading-relaxed bg-white p-3 rounded-lg border border-gray-200">
                           {selectedOrder.deliveryAddress.details}<br/>
                           {selectedOrder.deliveryAddress.upazila}, {selectedOrder.deliveryAddress.district}<br/>
                           {selectedOrder.deliveryAddress.division}<br/>
                           Phone: {selectedOrder.deliveryAddress.phone}
                         </div>
                       ) : (
                         <div className="text-gray-400 italic bg-white p-3 rounded-lg border border-gray-200">No address provided</div>
                       )}
                     </div>
                   </div>
                </div>
              </div>
              
              {/* Products List */}
              <div className="mb-4">
                <h3 className="font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4 text-sm uppercase tracking-wider">Order Items ({selectedOrder.products.length})</h3>
                <div className="space-y-3">
                  {selectedOrder.products.map((item, index) => (
                     <div key={index} className="flex gap-4 items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg border border-gray-100" />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs text-center border border-gray-200">
                            No<br/>Image
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                           <p className="font-bold text-sm text-gray-900 truncate">{item.name || "N/A"}</p>
                           <p className="text-xs text-gray-500 mt-1">Quantity: <span className="font-medium text-gray-800">{item.quantity}</span> {item.unit}</p>
                           {item.isCombo && (
                             <span className="inline-block text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 mt-2 rounded border border-indigo-100">Combo Package</span>
                           )}
                        </div>
                        <div className="text-right whitespace-nowrap">
                           <p className="font-bold text-sm text-emerald-600">৳{item.price * item.quantity}</p>
                           {item.quantity > 1 && <p className="text-xs text-gray-400 mt-1">৳{item.price} x {item.quantity}</p>}
                        </div>
                     </div>
                  ))}
                </div>
              </div>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
