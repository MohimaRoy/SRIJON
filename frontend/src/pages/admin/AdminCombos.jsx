import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import {
  FaPlus, FaEdit, FaTrash, FaBoxOpen, FaTag, FaToggleOn,
  FaToggleOff, FaStar, FaSearch, FaEye,
} from 'react-icons/fa';

export default function AdminCombos() {
  const navigate = useNavigate();
  const [combos, setCombos]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [deleting, setDeleting] = useState(null);

  const fetchCombos = async () => {
    try {
      setLoading(true);
      const res = await api.get('/combos/admin/all');
      if (res.data.success) setCombos(res.data.data);
    } catch (err) {
      console.error('Failed to fetch combos', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCombos(); }, []);

  const handleToggleActive = async (combo) => {
    try {
      await api.put(`/combos/${combo._id}`, { isActive: !combo.isActive });
      setCombos(prev => prev.map(c =>
        c._id === combo._id ? { ...c, isActive: !c.isActive } : c
      ));
    } catch { alert('Failed to toggle status'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this combo? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await api.delete(`/combos/${id}`);
      setCombos(prev => prev.filter(c => c._id !== id));
    } catch { alert('Failed to delete combo.'); }
    finally { setDeleting(null); }
  };

  const filtered = combos.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">

      {/* ── Page Header ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Combo Packages 📦</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Create and manage bundled product offers for your customers.
          </p>
        </div>
        <button
          onClick={() => navigate('/manager/combos/create')}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-bold shadow-lg shadow-violet-300 hover:shadow-violet-400 hover:from-violet-700 hover:to-purple-800 transition-all text-sm"
        >
          <FaPlus /> New Combo
        </button>
      </div>

      {/* ── Stats Row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Combos',   value: combos.length,                        color: 'violet', icon: '📦' },
          { label: 'Active',         value: combos.filter(c => c.isActive).length,  color: 'green',  icon: '✅' },
          { label: 'Featured',       value: combos.filter(c => c.isFeatured).length,color: 'yellow', icon: '⭐' },
          { label: 'Discounted',     value: combos.filter(c => c.discountPercentage > 0).length, color: 'red', icon: '🏷️' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-2xl font-black text-gray-800">{value}</p>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mt-1">{icon} {label}</p>
          </div>
        ))}
      </div>

      {/* ── Search ───────────────────────────────────────────────── */}
      <div className="relative mb-6">
        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search combos by name..."
          className="w-full pl-11 pr-5 py-3.5 rounded-2xl bg-white border border-gray-100 shadow-sm font-medium text-sm outline-none focus:ring-2 focus:ring-violet-200 transition-all"
        />
      </div>

      {/* ── Table / Cards ────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="animate-spin w-12 h-12 rounded-full border-4 border-violet-500 border-t-transparent" />
          <p className="text-gray-400 font-bold">Loading combos…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
          <FaBoxOpen className="text-5xl text-gray-200" />
          <p className="text-xl font-black text-gray-300">
            {search ? 'No combos match your search' : 'No combo packages yet'}
          </p>
          {!search && (
            <button onClick={() => navigate('/manager/combos/create')}
              className="mt-2 px-6 py-3 rounded-2xl bg-violet-600 text-white font-bold text-sm shadow-md hover:bg-violet-700 transition-colors">
              Create Your First Combo
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((combo) => {
            const effectivePrice = combo.discountedPrice ?? combo.totalPrice;
            return (
              <div key={combo._id}
                className={`bg-white rounded-3xl border p-5 flex flex-col sm:flex-row sm:items-center gap-5 shadow-sm hover:shadow-md transition-all
                  ${combo.isActive ? 'border-gray-100' : 'border-gray-200 opacity-70'}`}>

                {/* Image */}
                <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-100 shadow-sm">
                  {combo.image?.url
                    ? <img src={combo.image.url} alt={combo.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-black text-gray-900 text-base truncate">{combo.name}</h3>
                    {combo.isFeatured && (
                      <span className="flex items-center gap-1 text-[10px] bg-yellow-100 text-yellow-700 font-black px-2 py-0.5 rounded-full uppercase">
                        <FaStar size={8} /> Featured
                      </span>
                    )}
                    {combo.discountPercentage > 0 && (
                      <span className="flex items-center gap-1 text-[10px] bg-red-100 text-red-600 font-black px-2 py-0.5 rounded-full uppercase">
                        <FaTag size={8} /> {combo.discountPercentage}% OFF
                      </span>
                    )}
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase
                      ${combo.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {combo.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 mb-2 line-clamp-1">{combo.description || 'No description'}</p>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-gray-400 text-xs">Items: </span>
                      <span className="font-bold text-gray-700">{combo.items?.length || 0} products</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Total: </span>
                      {combo.discountPercentage > 0 && (
                        <span className="line-through text-gray-300 text-xs mr-1">৳{combo.totalPrice?.toLocaleString()}</span>
                      )}
                      <span className="font-black text-violet-600">৳{effectivePrice?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* View on site */}
                  <button
                    onClick={() => window.open(`/combo/${combo._id}`, '_blank')}
                    title="Preview"
                    className="p-2.5 rounded-xl bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors">
                    <FaEye />
                  </button>

                  {/* Toggle active */}
                  <button
                    onClick={() => handleToggleActive(combo)}
                    title={combo.isActive ? 'Hide combo' : 'Activate combo'}
                    className={`p-2.5 rounded-xl transition-colors text-lg
                      ${combo.isActive ? 'bg-green-50 text-green-500 hover:bg-green-100' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                    {combo.isActive ? <FaToggleOn /> : <FaToggleOff />}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => navigate(`/manager/combos/edit/${combo._id}`)}
                    className="p-2.5 rounded-xl bg-violet-50 text-violet-600 hover:bg-violet-100 transition-colors">
                    <FaEdit />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(combo._id)}
                    disabled={deleting === combo._id}
                    className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50">
                    {deleting === combo._id
                      ? <div className="animate-spin w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full" />
                      : <FaTrash />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
