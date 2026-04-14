import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import {
  FaUsers,
  FaChartBar,
  FaBoxOpen,
  FaShoppingCart,
} from 'react-icons/fa';

// ─── Skeleton loader ──────────────────────────────────────────────────────────
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />
);

// ─── Summary Card ─────────────────────────────────────────────────────────────
const SummaryCard = ({ label, value, icon, gradient, loading, to }) => {
  const content = (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-5 h-full transition-all hover:shadow-md hover:-translate-y-1">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl text-white flex-shrink-0 ${gradient}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
        {loading
          ? <Skeleton className="h-7 w-16" />
          : <p className="text-3xl font-extrabold text-gray-800">{value ?? 0}</p>
        }
      </div>
    </div>
  );
  return to ? <Link to={to} className="block">{content}</Link> : content;
};

const AdminDashboard = () => {
  const [stats, setStats]     = useState(null);
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/analytics');
        if (res.data.success) {
          setStats(res.data.data);
        } else {
          setError('Failed to load analytics data.');
        }

        api.get('/admin/users')
          .then(res => setUsers(res.data))
          .catch(err => console.error(err));
      } catch (err) {
        console.error('Analytics fetch error:', err);
        setError('Could not connect to the server. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="bg-gray-50 min-h-full font-sans">
      {/* ── PAGE HEADER ── */}
      <div className="bg-[#0f172a] pb-32 pt-10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -ml-10" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center border border-blue-400/20">
              <FaChartBar className="text-blue-400 text-xl" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">System Analytics 🛡️</h1>
          </div>
          <p className="text-slate-400 text-sm font-medium">Real-time overview of your marketplace ecosystem</p>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="container mx-auto px-6 -mt-24 pb-12 relative z-20 space-y-8">
        {/* TOP ROW: Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SummaryCard
            loading={loading}
            label="Total Customers 👤"
            value={stats?.totalUsers}
            icon={<FaUsers />}
            gradient="bg-gradient-to-br from-blue-600 to-indigo-700"
          />
          <SummaryCard
            loading={loading}
            label="Total Products 📦"
            value={stats?.totalProducts}
            icon={<FaBoxOpen />}
            gradient="bg-gradient-to-br from-slate-700 to-slate-900"
            to="/manager/products"
          />
          <SummaryCard
            loading={loading}
            label="Total Orders 🛒"
            value={stats?.totalOrders}
            icon={<FaShoppingCart />}
            gradient="bg-gradient-to-br from-[#1B2B4B] to-[#2563eb]"
            to="/manager/orders"
          />
        </div>

        {/* User List summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between">
            <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Recent Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-100 uppercase text-xs font-semibold text-gray-500">
                <tr>
                  <th className="px-6 py-3.5">Name</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5 text-center">Verified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.slice(0, 10).map(u => (
                  <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-800">{u.name}</td>
                    <td className="px-6 py-4">{u.email}</td>
                    <td className="px-6 py-4 text-center">
                      {u.isVerified ? 
                        <span className="text-green-600 font-bold">Yes</span> : 
                        <span className="text-red-400 font-bold">No</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
