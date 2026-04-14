import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import {
  FaArrowLeft, FaShoppingCart, FaTag, FaCheckCircle,
  FaBoxOpen, FaInfoCircle,
} from 'react-icons/fa';

export default function ComboDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [combo, setCombo]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [added, setAdded]     = useState(false);
  const [adding, setAdding]   = useState(false);

  useEffect(() => {
    api.get(`/combos/${id}`)
      .then(res => { if (res.data.success) setCombo(res.data.data); })
      .catch(() => setError('Combo not found or no longer available.'))
      .finally(() => setLoading(false));
  }, [id]);

  const saveToCart = () => {
    if (!combo) return;
    // Store combo in localStorage cart (same shape as existing CartPage logic)
    try {
      const stored = JSON.parse(localStorage.getItem('guestCart') || '{"items":[], "totalAmount":0}');
      if (Array.isArray(stored)) {
        // Migration if somehow they have the old array based cart
        localStorage.removeItem('guestCart');
        return;
      }

      const existing = stored.items.find(i => i.comboId && (i.comboId._id === combo._id || i.comboId === combo._id));
      if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
      } else {
        stored.items.push({
          comboId: {
            _id: combo._id,
            items: combo.items, // Important to show what's inside
            name: combo.name,
            image: combo.image
          },
          isCombo: true,
          name: combo.name,
          image: combo.image?.url || '',
          price: combo.effectivePrice ?? combo.totalPrice,
          quantity: 1,
          unit: 'combo',
        });
      }
      
      // Update totalAmount
      stored.totalAmount = stored.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      localStorage.setItem('guestCart', JSON.stringify(stored));
      window.dispatchEvent(new Event('cart-updated'));
    } catch (e) { console.error('Guest cart save error', e); }
  };

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      // Try authenticated cart API first
      await api.post('/cart/combo', {
        comboId: combo._id,
        name: combo.name,
        image: combo.image?.url,
        price: combo.effectivePrice ?? combo.totalPrice,
        quantity: 1,
      });
    } catch {
      // Fall back to guest cart
      saveToCart();
    }
    setAdded(true);
    setAdding(false);
    setTimeout(() => setAdded(false), 3000);
  };

  const effectivePrice = combo?.discountedPrice ?? combo?.totalPrice ?? 0;
  const hasDiscount    = combo?.discountPercentage > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50 font-sans">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Back button */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-violet-600 font-bold mb-8 group transition-colors">
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          <span>Back</span>
        </button>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="animate-spin w-14 h-14 rounded-full border-4 border-violet-500 border-t-transparent" />
            <p className="text-gray-400 font-bold">Loading combo details…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
            <FaBoxOpen className="text-6xl text-gray-200" />
            <p className="text-xl font-black text-gray-400">{error}</p>
            <button onClick={() => navigate('/combos')}
              className="px-6 py-3 rounded-2xl bg-violet-600 text-white font-bold shadow-md hover:bg-violet-700 transition-colors">
              Browse Other Combos
            </button>
          </div>
        )}

        {/* Main content */}
        {!loading && combo && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

            {/* ──── LEFT: Image ──────────────────────────────────── */}
            <div className="space-y-4">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-violet-200/50 aspect-square bg-white">
                {combo.image?.url ? (
                  <img src={combo.image.url} alt={combo.name}
                    className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-8xl bg-violet-50">📦</div>
                )}
                {/* Discount badge */}
                {hasDiscount && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white font-black text-sm px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                    <FaTag size={11} /> {combo.discountPercentage}% OFF
                  </div>
                )}
                {combo.isFeatured && (
                  <div className="absolute top-4 right-4 bg-yellow-400 text-white font-black text-sm px-3 py-1.5 rounded-full shadow-lg">
                    ⭐ Featured
                  </div>
                )}
              </div>

              {/* Info box */}
              <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 flex gap-3 items-start">
                <FaInfoCircle className="text-violet-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-violet-700 font-medium">
                  This combo package contains <strong>{combo.items?.length || 0} products</strong>.
                  Individual product prices are not shown — you only pay the bundle price.
                </p>
              </div>
            </div>

            {/* ──── RIGHT: Details ───────────────────────────────── */}
            <div className="space-y-6">

              {/* Name + desc */}
              <div>
                <h1 className="text-3xl font-black text-gray-900 leading-tight mb-3">{combo.name}</h1>
                {combo.description && (
                  <p className="text-gray-500 text-base leading-relaxed">{combo.description}</p>
                )}
              </div>

              {/* Price section */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Total Package Price</p>

                <div className="flex items-end gap-3">
                  <span className="text-4xl font-black text-violet-600">
                    ৳{effectivePrice.toLocaleString()}
                  </span>
                  {hasDiscount && (
                    <span className="text-xl text-gray-300 line-through mb-1">
                      ৳{combo.totalPrice?.toLocaleString()}
                    </span>
                  )}
                </div>

                {hasDiscount && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="bg-red-100 text-red-600 font-black text-xs px-3 py-1 rounded-full">
                      🏷️ You save ৳{(combo.totalPrice - effectivePrice).toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-400">({combo.discountPercentage}% discount applied)</span>
                  </div>
                )}
              </div>

              {/* Add to cart button */}
              <button
                onClick={handleAddToCart}
                disabled={adding}
                className={`w-full py-4 rounded-2xl font-black text-white text-base shadow-lg transition-all flex items-center justify-center gap-3
                  ${added
                    ? 'bg-green-500 shadow-green-200'
                    : 'bg-gradient-to-r from-violet-600 to-purple-700 shadow-violet-300 hover:shadow-violet-400 hover:from-violet-700 hover:to-purple-800'
                  } disabled:opacity-70`}>
                {adding ? (
                  <><div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> Adding…</>
                ) : added ? (
                  <><FaCheckCircle /> Added to Cart!</>
                ) : (
                  <><FaShoppingCart /> Add Combo to Cart</>
                )}
              </button>

              {/* What's inside */}
              <div>
                <h2 className="font-black text-gray-800 text-base mb-4 flex items-center gap-2">
                  <FaBoxOpen className="text-violet-500" />
                  What's Inside This Combo
                </h2>

                <div className="space-y-3">
                  {combo.items?.map((item, i) => (
                    <div key={item._id || i}
                      className="bg-white border border-gray-100 rounded-2xl p-4 flex items-start gap-4 shadow-sm hover:shadow-md hover:border-violet-100 transition-all group">
                      
                      {/* Image Thumbnail */}
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100 relative group-hover:scale-105 transition-transform">
                        {item.image?.url ? (
                          <img src={item.image.url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                        )}
                        <div className="absolute top-0 right-0 bg-violet-600 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-bl-lg">
                          {i + 1}
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <p className="font-bold text-gray-800 text-sm leading-tight">{item.name}</p>
                          {item.quantity && (
                            <span className="text-[9px] font-black bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-md uppercase tracking-tight">
                              {item.quantity}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-gray-400 leading-tight">{item.description}</p>
                        )}
                      </div>
                      <FaCheckCircle className="text-violet-300 flex-shrink-0 mt-1 group-hover:text-violet-500 transition-colors" />
                    </div>
                  ))}
                </div>

                <p className="text-xs text-gray-400 mt-3 text-center">
                  Individual product prices are part of our bundled pricing.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
