import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import ReviewList from '../components/ReviewList';
import ReviewForm from '../components/ReviewForm';
import Navbar from '../components/Navbar';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const [product, setProduct]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [adding, setAdding]     = useState(false);
  const [added, setAdded]       = useState(false);
  const [reviewKey, setReviewKey] = useState(0);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data } = await api.get(`/products/public/${id}`);
      setProduct(data.data);
    } catch (err) {
      navigate('/shop');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (silent = false) => {
    if (!silent) setAdding(true);
    try {
      if (!isAuthenticated) {
        // Support guest cart in detail as well
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '{"items":[], "totalAmount":0}');
        const existingItem = guestCart.items.find(item => item.product === product._id);
        
        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          guestCart.items.push({
            product: product._id,
            name: product.name,
            price: product.discountPrice || product.price,
            originalPrice: product.price,
            discountPercentage: product.discountPercentage || 0,
            image: product.images?.[0]?.url || '',
            quantity: quantity,
            unit: product.unit,
            seller: product.seller
          });
        }
        guestCart.totalAmount = guestCart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        localStorage.setItem('guestCart', JSON.stringify(guestCart));
        if (!silent) {
          setAdded(true);
          setTimeout(() => setAdded(false), 2000);
        }
        window.dispatchEvent(new Event('cart-updated'));
        return;
      }

      await api.post('/cart/add', { productId: product._id, quantity });
      if (!silent) {
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      }
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err) {
      if (!silent) alert(err.response?.data?.message || 'Failed to add to cart');
    } finally {
      if (!silent) setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    setAdding(true);
    try {
      await handleAddToCart(true);
      navigate('/checkout');
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const discountPercent = product?.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">Loading product...</div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#f8fbff] relative overflow-hidden">
        
        {/* ── BACKGROUND DECORATION ── */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-[#eef4ff] to-transparent pointer-events-none" />
        <div 
          className="absolute -top-24 -right-24 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-40 pointer-events-none"
          style={{ animation: 'pulse 8s infinite' }}
        />
        
        <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">

          {/* ── INTERACTIVE STICKERS ── */}
          <div className="hidden lg:block">
            <div className="sticker-float" style={{ top: '150px', left: '-60px', fontSize: '42px', animationDelay: '0s' }}>🌿</div>
            <div className="sticker-float" style={{ top: '400px', right: '-70px', fontSize: '38px', animationDelay: '1.5s' }}>🌾</div>
            <div className="sticker-float" style={{ bottom: '200px', left: '-80px', fontSize: '46px', animationDelay: '0.8s' }}>🚜</div>
            <div className="sticker-float" style={{ top: '600px', right: '-40px', fontSize: '44px', animationDelay: '2.2s' }}>🏗️</div>
          </div>

          <style>{`
            .sticker-float {
              position: absolute;
              cursor: default;
              user-select: none;
              opacity: 0.7;
              transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
              filter: drop-shadow(0 10px 15px rgba(37,99,235,0.15));
            }
            .sticker-float:hover {
              opacity: 1;
              transform: scale(1.4) rotate(15deg);
              filter: drop-shadow(0 20px 25px rgba(37,99,235,0.3));
            }
            @keyframes pulse {
              0%, 100% { opacity: 0.3; transform: scale(1); }
              50% { opacity: 0.5; transform: scale(1.1); }
            }
            .p-detail-card {
              background: rgba(255, 255, 255, 0.95);
              backdrop-filter: blur(10px);
              border: 1.5px solid #e0eeff;
              box-shadow: 0 20px 50px -12px rgba(29, 78, 216, 0.08);
            }
          `}</style>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-blue-400 mb-8 px-2">
            <Link to="/" className="hover:text-[#2563eb] font-bold transition-colors">Home</Link>
            <span className="opacity-40">/</span>
            <Link to="/shop" className="hover:text-[#2563eb] font-bold transition-colors">Shop</Link>
            <span className="opacity-40">/</span>
            <span className="text-[#1B2B4B] font-extrabold">{product.name}</span>
          </div>

          <div className="p-detail-card rounded-[32px] overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">

              {/* Images Section */}
              <div className="p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-blue-50">
                <div className="aspect-square rounded-[24px] overflow-hidden bg-gradient-to-br from-white to-[#f0f7ff] shadow-inner border border-blue-50 relative group">
                  {product.images?.[activeImg] ? (
                    <img
                      src={product.images[activeImg].url}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-7xl">🪴</div>
                  )}

                  {product.discountPrice && (
                    <div className="absolute top-4 right-4">
                      <span className="bg-rose-500 text-white text-[10px] font-black px-4 py-2 rounded-2xl shadow-xl shadow-rose-200 uppercase tracking-widest animate-bounce">
                        {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
                      </span>
                    </div>
                  )}
                  
                  {/* Category overlay label */}
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/80 backdrop-blur-md text-[#2563eb] text-[10px] font-black px-4 py-2 rounded-full shadow-sm border border-blue-100 uppercase tracking-widest">
                       {product.subCategory || 'Srijon Choice'}
                    </span>
                  </div>
                </div>

                {/* Thumbnail strip */}
                {product.images?.length > 1 && (
                  <div className="flex gap-4 mt-8 overflow-x-auto pb-2 scrollbar-hide">
                    {product.images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImg(i)}
                        className={`w-20 h-20 rounded-[16px] overflow-hidden flex-shrink-0 border-2 transition-all shadow-sm ${
                          activeImg === i ? 'border-[#2563eb] scale-105 shadow-md shadow-blue-100' : 'border-white hover:border-blue-200'
                        }`}
                      >
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info Section */}
              <div className="p-8 lg:p-12 flex flex-col">
                <div className="flex-1 space-y-6">
                  
                  {/* Status & Category */}
                  <div className="flex flex-wrap items-center gap-3">
                    {product.stock === 0 ? (
                      <span className="bg-red-50 text-red-600 text-[10px] font-black px-3 py-1.5 rounded-lg border border-red-100 uppercase tracking-tighter">
                        Sold Out
                      </span>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1.5 rounded-lg border border-emerald-100 uppercase tracking-tighter flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        In Stock
                      </span>
                    )}

                    <span className="bg-blue-50 text-[#2563eb] text-[10px] font-black px-3 py-1.5 rounded-lg border border-blue-100 uppercase tracking-tighter">
                      {(() => {
                        const PRODUCT_CATEGORIES = [
                          { id: 'oil-ghee', en: 'Oil & Ghee' },
                          { id: 'honey', en: 'Honey' },
                          { id: 'dates', en: 'Dates' },
                          { id: 'spices', en: 'Spices' },
                          { id: 'nuts-seeds', en: 'Nuts & Seeds' },
                          { id: 'beverage', en: 'Beverage' },
                          { id: 'rice', en: 'Rice' },
                          { id: 'flours-lentils', en: 'Flours & Lentils' },
                          { id: 'certified', en: 'Certified' },
                          { id: 'pickle', en: 'Pickle' }
                        ];
                        return PRODUCT_CATEGORIES.find(c => c.id === product.category)?.en || product.category;
                      })()}
                    </span>
                  </div>

                  <div>
                    <h1 className="text-3xl lg:text-4xl font-black text-[#1B2B4B] leading-tight mb-2 tracking-tight">
                      {product.name}
                    </h1>
                    <div className="flex items-center gap-2 group cursor-pointer w-fit">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs">🏪</div>
                      <span className="text-sm font-bold text-gray-500 group-hover:text-[#2563eb] transition-colors tracking-wide">
                        Sold by <span className="text-[#1B2B4B] underline decoration-[#2563eb]/30 decoration-2 underline-offset-2">{product.seller?.name}</span>
                      </span>
                    </div>
                  </div>

                  {/* Price Block */}
                  <div className="bg-[#f0f7ff]/50 rounded-[24px] p-6 border border-[#e0eeff]">
                    <div className="flex items-baseline gap-3 mb-1">
                      <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#1B2B4B] to-[#2563eb]">
                        ৳{(product.discountPrice || product.price).toLocaleString()}
                      </span>
                    </div>
                    {product.discountPrice && (
                      <div className="flex items-center gap-3">
                        <span className="text-lg text-gray-300 line-through font-semibold">৳{product.price.toLocaleString()}</span>
                        <div className="flex flex-col">
                          <span className="bg-rose-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg shadow-rose-100 uppercase tracking-tighter">
                            SAVE ৳{product.price - product.discountPrice}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info Points */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white border border-blue-50 shadow-sm">
                      <p className="text-[10px] font-extrabold text-blue-300 uppercase tracking-widest mb-1">Location</p>
                      <p className="text-xs font-bold text-[#1B2B4B] line-clamp-1">📍 {product.location?.district || 'Bangladesh'}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-blue-50 shadow-sm">
                      <p className="text-[10px] font-extrabold text-blue-300 uppercase tracking-widest mb-1">Stock Portfolio</p>
                      <div className="text-xs font-black text-emerald-600">
                        {product.stock > 9 ? 'Available' : product.stock > 0 ? `Only ${product.stock} products left` : 'Out of Stock'}
                        {product.weightPerUnit > 0 && (
                          <span className="block text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-tight">
                            ⚖️ {product.weightPerUnit}{product.weightUnit} product
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quantity & Action */}
                  <div className="space-y-4 pt-4">
                    {product.stock > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-[#1B2B4B] uppercase tracking-tighter">Adjust Quantity</span>
                        <div className="flex items-center bg-white border border-blue-100 rounded-2xl p-1 shadow-sm">
                          <button
                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-[#2563eb] hover:bg-blue-50 transition-all font-black text-xl"
                          >-</button>
                          <span className="w-12 text-center font-black text-[#1B2B4B] text-lg">{quantity}</span>
                          <button
                            onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-[#2563eb] hover:bg-blue-50 transition-all font-black text-xl"
                          >+</button>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4">
                      <button
                        onClick={() => handleAddToCart()}
                        disabled={adding || added || product.stock === 0}
                        className={`flex-1 py-4 rounded-[18px] font-black text-sm tracking-widest uppercase transition-all shadow-xl active:scale-95 ${
                          added
                            ? 'bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]'
                            : product.stock === 0
                            ? 'bg-[#f1f5f9] text-[#94a3b8] cursor-not-allowed'
                            : 'text-blue-600 bg-white border-2 border-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        {adding ? '...' : added ? (t('home.ourProducts.addedToCart') + ' ✨') : t('home.ourProducts.addToCart')}
                      </button>

                      <button
                        onClick={handleBuyNow}
                        disabled={adding || product.stock === 0}
                        className={`flex-[1.5] py-4 rounded-[18px] font-black text-sm tracking-widest uppercase transition-all shadow-xl active:scale-95 text-white ${
                          product.stock === 0 ? 'bg-slate-400 opacity-50 cursor-not-allowed' : ''
                        }`}
                        style={product.stock > 0 ? {
                          background: 'linear-gradient(135deg, #1B2B4B 0%, #2563eb 100%)',
                          boxShadow: '0 12px 30px -10px rgba(37,99,235,0.5)',
                        } : {}}
                      >
                        {adding ? '...' : t('home.ourProducts.buyNow')}
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="p-8 lg:p-12 bg-white border-t border-blue-50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-sm">📝</div>
                <h3 className="text-xl font-black text-[#1B2B4B] tracking-tight">Expert Narration</h3>
              </div>
              <div 
                className="text-gray-600 text-base leading-relaxed ql-editor !p-0 select-text"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
              <style>{`
                .ql-editor ul { list-style-type: disc; margin-left: 1.5rem; margin-bottom: 1.5rem; color: #475569; }
                .ql-editor ol { list-style-type: decimal; margin-left: 1.5rem; margin-bottom: 1.5rem; color: #475569; }
                .ql-editor p { margin-bottom: 1rem; font-weight: 500; }
              `}</style>
            </div>
          </div>

          {/* ── REVIEWS ── */}
          <div className="mt-12">
             <ReviewList key={`list-${reviewKey}`} productId={product._id} />
             {isAuthenticated && (
               <div className="mt-8 bg-white p-8 rounded-[32px] border border-blue-50 shadow-sm">
                 <ReviewForm 
                   productId={product._id} 
                   sellerId={product.seller?._id} 
                   onReviewAdded={() => setReviewKey(prev => prev + 1)} 
                 />
               </div>
             )}
          </div>

        </div>
      </div>
    </>
  );
}
