import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { FaTrash, FaSearch, FaFilter, FaExternalLinkAlt } from 'react-icons/fa';

export default function LiveProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

  const fetchLiveProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/products/public', {
        params: { search, category, limit: 100 }
      });
      setProducts(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveProducts();
  }, [category]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLiveProducts();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this live product? This action cannot be undone.')) return;
    setDeletingId(id);
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter(p => p._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  };

  const CATEGORIES = [
    { id: 'all', name: 'All' },
    { id: 'oil-ghee', name: 'Oil & Ghee' },
    { id: 'honey', name: 'Honey' },
    { id: 'dates', name: 'Dates' },
    { id: 'spices', name: 'Spices' },
    { id: 'nuts-seeds', name: 'Nuts & Seeds' },
    { id: 'beverage', name: 'Beverage' },
    { id: 'rice', name: 'Rice' },
    { id: 'flours-lentils', name: 'Flours & Lentils' },
    { id: 'certified', name: 'Certified' },
    { id: 'pickle', name: 'Pickle' }
  ];

  return (
    <div className="p-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2B4B]">Marketplace Inventory</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and monitor all approved products currently live for customers</p>
        </div>
        <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-1.5 h-fit">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                category === cat.id ? 'bg-[#2563eb] text-white shadow-md' : 'text-gray-500 hover:text-[#2563eb]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <form onSubmit={handleSearch} className="lg:col-span-3 flex gap-2">
          <div className="relative flex-1">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search by product name, seller, or description..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="px-6 bg-[#2563eb] text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200/50">
            Search
          </button>
        </form>

        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">
            {products.length}
          </div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Live Items</span>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-gray-400 font-medium text-sm">Loading market inventory...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-20 text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-300 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">📦</div>
            <p className="font-bold text-gray-700">No live products found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your category or search filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f8faff] border-b border-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Product info</th>
                  <th className="px-6 py-4 text-left text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Seller</th>
                  <th className="px-6 py-4 text-left text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Stock & Price</th>
                  <th className="px-6 py-4 text-right text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                          {p.images?.[0] ? (
                            <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">🌿</div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-sm leading-tight mb-1">{p.name}</p>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-extrabold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md uppercase">{p.category}</span>
                             {p.isFeatured && <span className="text-[10px] font-extrabold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md uppercase">★ Featured</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-semibold text-gray-700">{p.seller?.name || 'Unknown Seller'}</p>
                      <p className="text-xs text-gray-400">{p.location?.district || 'Not Specified'}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                           <span className="text-lg font-bold text-[#1B2B4B]">৳{p.discountPrice || p.price}</span>
                           {p.discountPrice && (
                             <div className="flex flex-col">
                               <span className="text-[10px] text-gray-400 line-through leading-none">৳{p.price}</span>
                               <span className="text-[9px] font-black text-rose-500 mt-0.5">-{p.discountPercent}%</span>
                             </div>
                           )}
                        </div>
                        <p className={`text-[10px] font-extrabold uppercase mt-1 ${p.stock < 10 ? 'text-red-500' : 'text-emerald-500'}`}>
                           {p.stock <= 0 ? 'Out of Stock' : `${p.stock} ${p.unit} remaining`}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link 
                          to={`/product/${p._id}`}
                          target="_blank"
                          className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="View in Shop"
                        >
                          <FaExternalLinkAlt className="text-sm" />
                        </Link>
                        <button
                          onClick={() => handleDelete(p._id)}
                          disabled={deletingId === p._id}
                          className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Product"
                        >
                          {deletingId === p._id ? (
                            <div className="w-4 h-4 border-2 border-red-200 border-t-red-600 rounded-full animate-spin" />
                          ) : (
                            <FaTrash className="text-sm" />
                          )}
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
    </div>
  );
}
