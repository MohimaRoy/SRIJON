import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { FaBoxOpen, FaShoppingCart, FaMoneyBillWave, FaStar, FaPlus } from 'react-icons/fa';

const STATUS_COLORS = {
  pending:  { bg: 'bg-amber-50',   text: 'text-amber-600',   dot: 'bg-amber-400',  label: 'Pending' },
  approved: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-400',label: 'Approved' },
  rejected: { bg: 'bg-red-50',     text: 'text-red-500',     dot: 'bg-red-400',    label: 'Rejected' },
};

const StatCard = ({ icon, label, value, sub, gradient }) => (
  <div className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-lg ${gradient}`}>
    {/* decorative circle */}
    <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
    <div className="absolute -bottom-6 -right-2 w-16 h-16 rounded-full bg-white/10" />
    <div className="relative z-10">
      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-4 text-xl">
        {icon}
      </div>
      <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-bold leading-none">{value ?? '—'}</p>
      {sub && <p className="text-white/60 text-xs mt-1">{sub}</p>}
    </div>
  </div>
);

export default function AdminMyProducts() {
  const { user } = useAuth();

  const [stats, setStats]           = useState(null);
  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('all');
  const [page, setPage]             = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchProducts();
  }, [filter, page]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 8 });
      if (filter !== 'all') params.append('status', filter);
      const { data } = await api.get(`/products/my-products?${params}`);
      setProducts(data.data);
      setPagination(data.pagination);
      
      // Basic stats calculation from the current page of products (better than nothing)
      setStats({
        totalProducts: data.pagination.total || 0,
        totalOrders: 0, // Placeholder
        revenue: 0, // Placeholder
        avgRating: 0 // Placeholder
      });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
  };

  return (
    <div className="p-6 space-y-8">
      {/* ── Welcome Section ── */}
      <div className="rounded-2xl p-8 relative overflow-hidden shadow-xl"
           style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Inventory 📦</h1>
            <p className="text-slate-400 text-sm mt-1">Manage and sell products as an Administrator.</p>
          </div>
          <Link to="/manager/products/add"
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all">
            <FaPlus />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<FaBoxOpen />}
          label="Your Products"
          value={stats?.totalProducts}
          sub="Items in your shop"
          gradient="bg-gradient-to-br from-blue-600 to-indigo-700"
        />
        <StatCard
          icon={<FaShoppingCart />}
          label="Your Orders"
          value={stats?.totalOrders}
          sub="Orders for your products"
          gradient="bg-gradient-to-br from-slate-700 to-slate-900"
        />
        <StatCard
          icon={<FaMoneyBillWave />}
          label="Earnings"
          value={stats?.revenue ? `৳${stats.revenue.toLocaleString()}` : '৳0'}
          sub="From your sales"
          gradient="bg-gradient-to-br from-[#1B2B4B] to-[#2563eb]"
        />
        <StatCard
          icon={<FaStar />}
          label="Rating"
          value={stats?.avgRating ? stats.avgRating.toFixed(1) : 'N/A'}
          sub="Customer feedback"
          gradient="bg-gradient-to-br from-sky-500 to-blue-600"
        />
      </div>

      {/* ── Products List ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Inventory Dashboard</h2>
          <div className="flex gap-2">
            {['all', 'approved', 'pending', 'rejected'].map(f => (
              <button key={f} onClick={() => { setFilter(f); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  filter === f
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400 font-medium">Checking inventory...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4">📭</div>
            <p className="font-bold text-gray-700">No products found</p>
            <p className="text-sm text-gray-400 mt-1">Start adding products to your store.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-100 uppercase text-xs font-semibold text-gray-500">
                <tr>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map(p => {
                   const sc = STATUS_COLORS[p.status] || STATUS_COLORS.pending;
                   return (
                    <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                              {p.images?.[0] ? (
                                <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xl">🌿</div>
                              )}
                           </div>
                           <div className="font-semibold text-gray-800">{p.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 capitalize">{p.category}</td>
                      <td className="px-6 py-4 font-bold text-blue-600">৳{p.price?.toLocaleString()}</td>
                      <td className="px-6 py-4">{p.stock}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${sc.bg} ${sc.text}`}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link to={`/manager/products/edit/${p._id}`}
                            className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-100">
                            Edit
                          </Link>
                          <button onClick={() => handleDelete(p._id)}
                            className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-100">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
