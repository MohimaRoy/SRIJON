import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { FaBoxOpen, FaTag, FaArrowRight, FaStar, FaSearch, FaShoppingCart } from 'react-icons/fa';

export default function ComboShop() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [combos, setCombos]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [cartLoading, setCartLoading] = useState(null);
  const [addedCombos, setAddedCombos] = useState({});

  useEffect(() => {
    api.get('/combos')
      .then(res => { if (res.data.success) setCombos(res.data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const saveToCart = (combo) => {
    try {
      const stored = JSON.parse(localStorage.getItem('guestCart') || '{"items":[], "totalAmount":0}');
      if (Array.isArray(stored)) {
        localStorage.removeItem('guestCart');
        return;
      }
      const existing = stored.items.find(i => i.comboId && (i.comboId._id === combo._id || i.comboId === combo._id));
      if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
      } else {
        stored.items.push({
          comboId: { _id: combo._id, items: combo.items, name: combo.name, image: combo.image },
          isCombo: true,
          name: combo.name,
          image: combo.image?.url || '',
          price: combo.discountedPrice ?? combo.totalPrice,
          quantity: 1,
          unit: 'combo',
        });
      }
      stored.totalAmount = stored.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      localStorage.setItem('guestCart', JSON.stringify(stored));
      window.dispatchEvent(new Event('cart-updated'));
    } catch (e) { console.error('Guest cart save error', e); }
  };

  const handleAddToCart = async (combo, e, silent = false) => {
    if (e) e.stopPropagation();
    if (!silent) setCartLoading(combo._id);
    try {
      if (isAuthenticated) {
        await api.post('/cart/combo', {
          comboId: combo._id,
          name: combo.name,
          image: combo.image?.url,
          price: combo.discountedPrice ?? combo.totalPrice,
          quantity: 1,
        });
      } else {
        saveToCart(combo);
      }
      setAddedCombos(prev => ({ ...prev, [combo._id]: true }));
      if (!silent) {
        setTimeout(() => setAddedCombos(prev => ({ ...prev, [combo._id]: false })), 3000);
      }
    } catch {
      if (!silent) alert('Failed to add combo to cart');
    } finally {
      if (!silent) setCartLoading(null);
    }
  };

  const handleBuyNow = async (combo, e) => {
    e.stopPropagation();
    setCartLoading(`buynow-${combo._id}`);
    try {
      await handleAddToCart(combo, null, true);
      navigate('/checkout');
    } catch {
      console.error('Buy Now failed');
    } finally {
      setCartLoading(null);
    }
  };

  const filtered = combos.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-purple-50 font-sans">
      <Navbar />

      {/* ── Hero banner ─────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-violet-700 to-purple-800 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div className="max-w-6xl mx-auto px-6 relative z-10 text-center">
          <p className="text-violet-300 text-sm font-black uppercase tracking-widest mb-3">🎁 Bundle & Save</p>
          <h1 className="text-4xl md:text-5xl font-black mb-4">Combo Packages</h1>
          <p className="text-violet-200 text-lg max-w-xl mx-auto">
            Handpicked product bundles at unbeatable prices. Get more, pay less.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">

        {/* ── Search ──────────────────────────────────────────────── */}
        <div className="relative mb-10 max-w-xl mx-auto">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search combo packages…"
            className="w-full pl-11 pr-5 py-4 rounded-2xl bg-white border border-gray-100 shadow-md font-medium outline-none focus:ring-2 focus:ring-violet-200 transition-all"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="animate-spin w-14 h-14 rounded-full border-4 border-violet-500 border-t-transparent" />
            <p className="text-gray-400 font-bold">Finding great deals…</p>
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center py-28 text-center gap-3">
            <FaBoxOpen className="text-6xl text-gray-200" />
            <p className="text-xl font-black text-gray-300">
              {search ? 'No combos match your search' : 'No combo packages available yet'}
            </p>
            {search && (
              <button onClick={() => setSearch('')}
                className="mt-1 text-sm text-violet-500 font-bold hover:underline">
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(combo => {
              const effectivePrice = combo.discountedPrice ?? combo.totalPrice;
              const hasDiscount    = combo.discountPercentage > 0;
              return (
                <div key={combo._id}
                  onClick={() => navigate(`/combo/${combo._id}`)}
                  className="bg-white rounded-3xl shadow-sm hover:shadow-xl border border-gray-100 hover:border-violet-200 overflow-hidden cursor-pointer transition-all duration-300 group">

                  {/* Image */}
                  <div className="relative h-44 bg-violet-50 overflow-hidden flex items-center justify-center p-4">
                    {combo.image?.url ? (
                      <img src={combo.image.url} alt={combo.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                      {hasDiscount && (
                        <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                          <FaTag size={8} /> {combo.discountPercentage}% OFF
                        </span>
                      )}
                      {combo.isFeatured && (
                        <span className="bg-yellow-400 text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                          <FaStar size={8} /> Featured
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    <h3 className="font-black text-gray-900 text-lg leading-snug mb-1 group-hover:text-violet-700 transition-colors">
                      {combo.name}
                    </h3>
                    {combo.description && (
                      <p className="text-xs text-gray-400 line-clamp-2 mb-4">{combo.description}</p>
                    )}

                    {/* Price & Actions */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-end gap-2">
                            <span className="text-2xl font-black text-violet-600">
                              ৳{effectivePrice?.toLocaleString()}
                            </span>
                            {hasDiscount && (
                              <span className="text-sm text-gray-300 line-through mb-0.5">
                                ৳{combo.totalPrice?.toLocaleString()}
                              </span>
                            )}
                          </div>
                          {hasDiscount && (
                            <p className="text-[10px] text-red-400 font-bold">
                              Save ৳{(combo.totalPrice - effectivePrice).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        {addedCombos[combo._id] ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate('/cart'); }}
                            className="flex-1 py-2.5 rounded-xl bg-green-50 text-green-600 border border-green-200 font-bold text-sm transition-all hover:bg-green-100 flex items-center justify-center gap-2">
                            ✓ View Cart
                          </button>
                        ) : (
                          <button
                            onClick={(e) => handleAddToCart(combo, e)}
                            disabled={cartLoading === combo._id}
                            className="flex-1 py-2.5 rounded-xl bg-violet-50 text-violet-600 border border-violet-200 font-bold text-sm transition-all hover:bg-violet-600 hover:text-white flex items-center justify-center gap-2 disabled:opacity-50">
                            {cartLoading === combo._id ? '...' : <><FaShoppingCart /> Add to Cart</>}
                          </button>
                        )}
                        <button
                          onClick={(e) => handleBuyNow(combo, e)}
                          disabled={cartLoading === `buynow-${combo._id}`}
                          className="flex-[1.2] py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-black text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50">
                          {cartLoading === `buynow-${combo._id}` ? '...' : 'Buy Now'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
