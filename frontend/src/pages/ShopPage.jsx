import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import {
  FaShoppingCart, FaRocket, FaGlobe, FaTachometerAlt, FaShoppingBag, FaUsers, FaSeedling, FaBoxOpen, FaTag
} from 'react-icons/fa';
import Navbar from '../components/Navbar';

const SHOP_CATEGORIES = [
  { id: 'all',               en: 'All Products',        bn: 'সকল পণ্য',         icon: '🛍️', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  { id: 'oil-ghee',          en: 'Oil & Ghee',          bn: 'তেল ও ঘি',          icon: '🏺', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  { id: 'honey',             en: 'Honey',               bn: 'মধু',              icon: '🍯', color: '#eab308', bg: '#fefce8', border: '#fef08a' },
  { id: 'dates',             en: 'Dates',               bn: 'খেজুর',            icon: '🌴', color: '#9d174d', bg: '#fdf2f8', border: '#fbcfe8' },
  { id: 'spices',            en: 'Spices',              bn: 'মসলা',             icon: '🌶️', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
  { id: 'nuts-seeds',        en: 'Nuts & Seeds',        bn: 'বাদাম ও বীজ',      icon: '🥜', color: '#84cc16', bg: '#f7fee7', border: '#d9f99d' },
  { id: 'beverage',          en: 'Beverage',            bn: 'পানীয়',           icon: '🍵', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
  { id: 'rice',              en: 'Rice',                bn: 'চাল',              icon: '🌾', color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe' },
  { id: 'flours-lentils',    en: 'Flours & Lentils',    bn: 'আটা ও ডাল',        icon: '🍞', color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
  { id: 'certified',         en: 'Certified',           bn: 'সার্টিফাইড',       icon: '🏅', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  { id: 'pickle',            en: 'Pickle',              bn: 'আচার',             icon: '🥣', color: '#be123c', bg: '#fff1f2', border: '#fecdd3' },
];

const SORT_OPTIONS = [
  { value: 'newest',     label: '🕐 Newest First' },
  { value: 'price_low',  label: '💸 Price: Low → High' },
  { value: 'price_high', label: '💎 Price: High → Low' },
  { value: 'popular',    label: '🔥 Most Popular' },
];

export default function ShopPage() {
  const { isAuthenticated } = useAuth();
  const { currentLanguage }  = useLanguage();
  const navigate             = useNavigate();
  const [searchParams]       = useSearchParams();

  const [products, setProducts]       = useState([]);
  const [combos, setCombos]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [cartLoading, setCartLoading] = useState(null);
  const [addedToCart, setAddedToCart] = useState({});
  const [addedCombos, setAddedCombos] = useState({});
  const [pagination, setPagination]   = useState({});

  const [search,   setSearch]   = useState(searchParams.get('search')   || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sort,     setSort]     = useState(searchParams.get('sort')     || 'newest');
  const [page,     setPage]     = useState(Number(searchParams.get('page')) || 1);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category !== 'all') params.set('category', category);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      params.set('sort', sort);
      params.set('page', page);
      params.set('limit', 12);
      const { data } = await api.get(`/products/public?${params}`);
      setProducts(data.data);
      setPagination(data.pagination);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [search, category, minPrice, maxPrice, sort, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    api.get('/combos')
      .then(res => { if (res.data.success) setCombos(res.data.data.slice(0, 4)); })
      .catch(() => {});
  }, []);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchProducts(); };
  const resetFilters = () => {
    setSearch(''); setCategory('all');
    setMinPrice(''); setMaxPrice('');
    setSort('newest'); setPage(1);
  };
  const handleAddToCart = async (product, silent = false) => {
    const p = products.find(i => i._id === (product._id || product)) || product;
    const productId = p._id;
    
    if (!silent) setCartLoading(productId);
    try {
      if (!isAuthenticated) {
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '{"items":[], "totalAmount":0}');
        const existingItem = guestCart.items.find(item => item.product === productId);
        
        if (existingItem) {
          existingItem.quantity += 1;
        } else {
          guestCart.items.push({
            product: productId,
            name: p.name,
            price: p.discountPrice || p.price,
            originalPrice: p.price,
            discountPercentage: p.discountPercentage || 0,
            image: p.images?.[0]?.url || '',
            quantity: 1,
            unit: p.unit,
            seller: p.seller
          });
        }
        guestCart.totalAmount = guestCart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        localStorage.setItem('guestCart', JSON.stringify(guestCart));
        setAddedToCart(prev => ({ ...prev, [productId]: true }));
        window.dispatchEvent(new Event('cart-updated'));
        return;
      }

      await api.post('/cart/add', { productId, quantity: 1 });
      setAddedToCart(prev => ({ ...prev, [productId]: true }));
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err) { 
      if (!silent) alert(err.response?.data?.message || 'Failed to add to cart'); 
    }
    finally { if (!silent) setCartLoading(null); }
  };

  const handleBuyNow = async (product) => {
    const productId = product._id || product;
    setCartLoading(`buynow-${productId}`);
    try {
      await handleAddToCart(product, true);
      navigate('/checkout');
    } catch (err) {
      console.error('Buy Now failed:', err);
    } finally {
      setCartLoading(null);
    }
  };

  const saveComboToCart = (combo) => {
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

  const handleComboAddToCart = async (combo, e, silent = false) => {
    if (e) e.stopPropagation();
    if (!silent) setCartLoading(`combo-${combo._id}`);
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
        saveComboToCart(combo);
      }
      setAddedCombos(prev => ({ ...prev, [combo._id]: true }));
      if (!silent) {
        setTimeout(() => setAddedCombos(prev => ({ ...prev, [combo._id]: false })), 3000);
      }
      window.dispatchEvent(new Event('cart-updated'));
    } catch {
      if (!silent) alert('Failed to add combo to cart');
    } finally {
      if (!silent) setCartLoading(null);
    }
  };

  const handleComboBuyNow = async (combo, e) => {
    if (e) e.stopPropagation();
    setCartLoading(`combobuy-${combo._id}`);
    try {
      await handleComboAddToCart(combo, null, true);
      navigate('/checkout');
    } catch {
      console.error('Buy Now failed');
    } finally {
      setCartLoading(null);
    }
  };

  const activeCat = SHOP_CATEGORIES.find(c => c.id === category);

  return (
    <>
      <Navbar />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
        .sp * { box-sizing: border-box; }
        .sp { font-family: 'DM Sans', sans-serif; background: #f2f7ff; min-height: 100vh; }
        .serif { font-family: 'DM Serif Display', serif; }

        /* shimmer */
        .shimmer { background: linear-gradient(90deg,#e8f0fe 25%,#dbeafe 50%,#e8f0fe 75%); background-size:200% 100%; animation:sh 1.4s infinite linear; }
        @keyframes sh { 0%{background-position:200% 0}100%{background-position:-200% 0} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
        @keyframes float { 0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)} }

        /* product card */
        .p-card { background:#fff; border:1.5px solid #e0eeff; border-radius:22px; overflow:hidden; transition:transform .28s cubic-bezier(.22,.68,0,1.2),box-shadow .28s; animation:fadeUp .4s ease both; }
        .p-card:hover { transform:translateY(-8px); box-shadow:0 20px 48px rgba(29,78,216,.14),0 4px 12px rgba(29,78,216,.08); }
        .p-card .p-img img { transition:transform .5s cubic-bezier(.22,.68,0,1.2); }
        .p-card:hover .p-img img { transform:scale(1.08); }
        .p-overlay { transition:opacity .28s; opacity:0; }
        .p-card:hover .p-overlay { opacity:1; }

        /* category item in sidebar */
        .cat-item { display:flex; align-items:center; gap:12px; padding:11px 14px; border-radius:14px; border:1.5px solid transparent; cursor:pointer; transition:all .2s; font-size:13px; font-weight:600; width:100%; background:transparent; font-family:'DM Sans',sans-serif; }
        .cat-item:hover { background:#f0f7ff; border-color:#dbeafe; }
        .cat-item.active { border-color:currentColor; }

        /* inputs */
        .sh-input { border:1.5px solid #dbeafe; background:#f8fbff; color:#1e293b; font-family:'DM Sans',sans-serif; font-size:13px; padding:10px 13px; border-radius:12px; width:100%; transition:border-color .2s,box-shadow .2s; }
        .sh-input:focus { outline:none; border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.12); background:#fff; }
        .sh-input::placeholder { color:#94a3b8; }

        /* buttons */
        .btn-blue { background:linear-gradient(135deg,#2563eb,#1d4ed8); color:#fff; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; font-weight:700; border-radius:12px; transition:all .2s; }
        .btn-blue:hover { box-shadow:0 6px 18px rgba(37,99,235,.35); transform:translateY(-1px); }
        .btn-outline { background:#fff; border:1.5px solid #bfdbfe; color:#2563eb; cursor:pointer; font-family:'DM Sans',sans-serif; font-weight:600; border-radius:12px; transition:all .2s; }
        .btn-outline:hover { background:#eff6ff; border-color:#93c5fd; }

        .cart-btn { width:100%; padding:11px 0; border-radius:12px; font-size:13px; font-weight:700; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .2s; }
        .spinner { width:14px; height:14px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; display:inline-block; }

        @media(min-width:1024px){ .show-lg{display:block!important} }
      `}</style>

      <div className="sp">

        {/* ══ HERO ══ */}
        <div style={{ background:'linear-gradient(135deg,#0f172a 0%,#1e3a8a 50%,#1d4ed8 100%)', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute',top:-80,right:-80,width:380,height:380,borderRadius:'50%',background:'radial-gradient(circle,rgba(96,165,250,.18) 0%,transparent 70%)',pointerEvents:'none' }}/>
          <div style={{ position:'absolute',bottom:-60,left:'12%',width:240,height:240,borderRadius:'50%',background:'radial-gradient(circle,rgba(14,165,233,.12) 0%,transparent 70%)',pointerEvents:'none' }}/>
          <div style={{ position:'absolute',inset:0,backgroundImage:'repeating-linear-gradient(45deg,rgba(255,255,255,.025) 0px,rgba(255,255,255,.025) 1px,transparent 1px,transparent 14px)',pointerEvents:'none' }}/>

          {/* floating emojis */}
          {[
            { e:'🛍️', top:'15%', left:'6%',  delay:'0s',   size:32 },
            { e:'🌾', top:'20%', right:'18%', delay:'.6s',  size:28 },
            { e:'🏺', top:'55%', left:'3%',  delay:'1.2s', size:24 },
            { e:'👗', top:'60%', right:'8%', delay:'.3s',  size:26 },
            { e:'✨', top:'30%', left:'18%', delay:'.9s',  size:20 },
          ].map((f,i)=>(
            <div key={i} style={{ position:'absolute',top:f.top,left:f.left,right:f.right,fontSize:f.size,opacity:.35,animation:`float 3s ease-in-out ${f.delay} infinite`,pointerEvents:'none',zIndex:1 }}>{f.e}</div>
          ))}

          <div style={{ maxWidth:1200,margin:'0 auto',padding:'52px 24px 56px',position:'relative',zIndex:10,display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:20 }}>
            <div>
              <div style={{ display:'inline-flex',alignItems:'center',gap:8,background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.2)',borderRadius:999,padding:'5px 14px',marginBottom:14 }}>
                <span style={{ fontSize:14 }}>🛒</span>
                <span style={{ fontSize:11,fontWeight:700,letterSpacing:'.15em',color:'#93c5fd',textTransform:'uppercase' }}>Marketplace</span>
              </div>
              <h1 className="serif" style={{ fontSize:'clamp(2rem,5vw,3.4rem)',color:'#fff',lineHeight:1.1,margin:0 }}>
                Discover<br/><span style={{ fontStyle:'italic',color:'#7dd3fc' }}>fresh finds. ✨</span>
              </h1>
              <p style={{ color:'#94a3b8',marginTop:14,fontSize:15,lineHeight:1.6 }}>
                🇧🇩 High-quality handcrafted and artisanal products curated from across Bangladesh
              </p>
            </div>
            <div style={{ display:'flex',gap:12 }}>
              {[
                { val: loading ? '…' : pagination.total ?? 0, label:'Products', icon:'📦' },
                { val: SHOP_CATEGORIES.length - 1, label:'Categories', icon:'🗂️' },
              ].map(s=>(
                <div key={s.label} style={{ background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.15)',borderRadius:18,padding:'14px 22px',textAlign:'center',backdropFilter:'blur(8px)' }}>
                  <div style={{ fontSize:22,marginBottom:4 }}>{s.icon}</div>
                  <div className="serif" style={{ fontSize:24,color:'#fff',lineHeight:1 }}>{s.val}</div>
                  <div style={{ fontSize:10,color:'#93c5fd',fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',marginTop:4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ BODY ══ */}
        <div style={{ maxWidth:'98%', margin:'0 auto', padding:'10px 20px 80px' }}>
          
          {/* Main Layout Grid */}
          <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:'40px', alignItems:'flex-start' }}>

          {/* ══ SIDEBAR ══ */}
          <aside style={{ width:'100%', flexShrink:0, display:'none' }} className="show-lg">
            <div style={{ background:'rgba(255,255,255,0.94)', border:'1.5px solid #e0eeff', borderRadius:24, overflow:'hidden', position:'sticky', top:'20px', boxShadow:'0 10px 30px -10px rgba(29,78,216,0.1)' }}>

              {/* sidebar header */}
              <div style={{ background:'linear-gradient(135deg,#1d4ed8,#2563eb 60%,#0ea5e9)', padding:'14px 20px', display:'flex', alignItems:'center', gap:10 }}>
                <div className="relative flex items-center justify-center w-8 h-8 bg-gradient-to-br from-[#1B2B4B] via-[#2563eb] to-[#5BA4CF] rounded-lg shadow-lg overflow-hidden">
                  <FaSeedling className="text-white text-sm relative z-10" />
                  <div className="absolute inset-0 bg-white/40 rounded-lg animate-logo-glow"></div>
                </div>
                <span style={{ fontWeight:800, fontSize:13, color:'#fff', letterSpacing:'.03em', textTransform:'uppercase' }}>Filters</span>
              </div>

              <div style={{ padding:20,display:'flex',flexDirection:'column',gap:20 }}>

                {/* search */}
                <div>
                  <label style={{ display:'flex',alignItems:'center',gap:6,fontSize:11,fontWeight:800,color:'#3b82f6',textTransform:'uppercase',letterSpacing:'.12em',marginBottom:10 }}>
                    🔎 Search
                  </label>
                  <form onSubmit={handleSearch} style={{ display:'flex',gap:8 }}>
                    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products…" className="sh-input" style={{ flex:1 }}/>
                    <button type="submit" className="btn-blue" style={{ padding:'10px 14px',fontSize:15,flexShrink:0 }}>→</button>
                  </form>
                </div>

                {/* divider */}
                <div style={{ height:1,background:'linear-gradient(90deg,#dbeafe,#bfdbfe 50%,transparent)' }}/>

                {/* categories */}
                <div>
                  <label style={{ display:'flex',alignItems:'center',gap:6,fontSize:11,fontWeight:800,color:'#3b82f6',textTransform:'uppercase',letterSpacing:'.12em',marginBottom:12 }}>
                    🗂️ Category
                  </label>
                  <div style={{ display:'flex',flexDirection:'column',gap:4 }}>
                    {SHOP_CATEGORIES.map(c => {
                      const isActive = category === c.id;
                      return (
                        <button key={c.id} onClick={()=>{setCategory(c.id);setPage(1);}}
                          className="cat-item"
                          style={{
                            color: isActive ? c.color : '#475569',
                            background: isActive ? c.bg : 'transparent',
                            borderColor: isActive ? c.border : 'transparent',
                          }}>
                          {/* emoji icon badge */}
                          <div style={{ width:34,height:34,borderRadius:10,background:isActive?c.bg:'#f1f5f9',border:`1.5px solid ${isActive?c.border:'#e2e8f0'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,flexShrink:0,transition:'all .2s' }}>
                            {c.icon}
                          </div>
                          <span style={{ flex:1,textAlign:'left',fontSize:13 }}>{currentLanguage==='bn'?c.bn:c.en}</span>
                          {isActive && <span style={{ fontSize:10,fontWeight:800,color:c.color }}>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ height:1,background:'linear-gradient(90deg,#dbeafe,#bfdbfe 50%,transparent)' }}/>

                {/* price */}
                <div>
                  <label style={{ display:'flex',alignItems:'center',gap:6,fontSize:11,fontWeight:800,color:'#3b82f6',textTransform:'uppercase',letterSpacing:'.12em',marginBottom:10 }}>
                    💰 Price Range (৳)
                  </label>
                  <div style={{ display:'flex',gap:8,marginBottom:10 }}>
                    <input type="number" value={minPrice} onChange={e=>setMinPrice(e.target.value)} placeholder="Min" className="sh-input"/>
                    <input type="number" value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} placeholder="Max" className="sh-input"/>
                  </div>
                  <button onClick={()=>{setPage(1);fetchProducts();}} className="btn-blue" style={{ width:'100%',padding:'11px 0',fontSize:13 }}>
                    ✓ Apply Filter
                  </button>
                </div>

                <div style={{ height:1,background:'linear-gradient(90deg,#dbeafe,#bfdbfe 50%,transparent)' }}/>

                <button onClick={resetFilters} className="btn-outline" style={{ width:'100%',padding:'11px 0',fontSize:13 }}>
                  ↺ Reset All Filters
                </button>
              </div>
            </div>
          </aside>

          {/* ══ MAIN CONTENT ══ */}
          <div style={{ flex:1,minWidth:0 }}>

            {/* toolbar */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'32px', flexWrap:'wrap', gap:'16px', background:'white', padding:'13px 20px', borderRadius:'22px', border:'1.5px solid #e0eeff', boxShadow:'0 4px 12px rgba(29,78,216,0.03)' }}>
              <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                <div style={{ width:40,height:40,borderRadius:12,background:activeCat?.bg||'#eff6ff',border:`1.5px solid ${activeCat?.border||'#bfdbfe'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20 }}>
                  {activeCat?.icon}
                </div>
                <div>
                  <h2 className="serif" style={{ fontSize:22,color:'#0f172a',margin:0,lineHeight:1.2 }}>
                    {currentLanguage==='bn'?activeCat?.bn:activeCat?.en}
                  </h2>
                  <p style={{ fontSize:13,color:'#94a3b8',margin:'2px 0 0' }}>
                    {loading ? '⏳ Loading…' : <><b style={{color:'#2563eb'}}>{pagination.total??0}</b> products found</>}
                  </p>
                </div>
              </div>
              <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                <span style={{ fontSize:12,color:'#94a3b8',fontWeight:600 }}>Sort by</span>
                <select value={sort} onChange={e=>{setSort(e.target.value);setPage(1);}} className="sh-input" style={{ width:'auto',padding:'9px 32px 9px 12px',cursor:'pointer' }}>
                  {SORT_OPTIONS.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>

            {/* active filter tag */}
            {category !== 'all' && (
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:16,flexWrap:'wrap' }}>
                <span style={{ fontSize:12,color:'#64748b' }}>Active filter:</span>
                <span style={{ display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',borderRadius:999,background:activeCat.bg,border:`1px solid ${activeCat.border}`,color:activeCat.color,fontSize:12,fontWeight:700 }}>
                  {activeCat.icon} {currentLanguage==='bn'?activeCat.bn:activeCat.en}
                  <button onClick={()=>setCategory('all')} style={{ background:'none',border:'none',cursor:'pointer',color:activeCat.color,fontSize:14,lineHeight:1,padding:0,marginLeft:2 }}>×</button>
                </span>
              </div>
            )}

            {/* ── Combos Section (Top) ── */}
            {combos.length > 0 && page === 1 && (
            <div style={{ marginBottom: 40 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 className="serif" style={{ fontSize: 24, margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FaBoxOpen color="#8b5cf6" /> Combo Offers
                </h2>
                <Link to="/combos" style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6', textDecoration: 'none' }}>View All →</Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 20 }}>
                {combos.map(combo => {
                  const effectivePrice = combo.discountedPrice ?? combo.totalPrice;
                  const hasDiscount    = combo.discountPercentage > 0;
                  const isAdded        = addedCombos[combo._id];

                  return (
                    <div key={combo._id} onClick={(e) => {
                      if (!e.defaultPrevented) navigate(`/combo/${combo._id}`);
                    }} className="p-card" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
                      <div className="p-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', height: 140, overflow: 'hidden', background: '#f8fbff', padding: '12px' }}>
                        {combo.image?.url ? <img src={combo.image.url} alt={combo.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>📦</div>}
                        {hasDiscount && (
                          <div style={{ position: 'absolute', top: 10, left: 10, background: 'linear-gradient(135deg,#f43f5e,#e11d48)', color: '#fff', fontSize: 9, fontWeight: 900, padding: '4px 8px', borderRadius: 6, boxShadow: '0 4px 12px rgba(225,29,72,0.25)', textTransform: 'uppercase' }}>
                            {combo.discountPercentage}% OFF
                          </div>
                        )}
                      </div>
                      <div style={{ padding: '12px 14px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 4px', lineHeight: 1.3, height: 36, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {combo.name}
                        </h3>
                        {combo.description && <p style={{ margin: '0 0 8px', fontSize: 11, color: '#94a3b8', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{combo.description}</p>}
                        
                        <div style={{ marginTop: 'auto' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
                            <div>
                              <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#8b5cf6', lineHeight: 1 }}>৳{effectivePrice.toLocaleString()}</p>
                              {hasDiscount && (
                                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8', textDecoration: 'line-through', lineHeight: 1 }}>৳{combo.totalPrice?.toLocaleString()}</p>
                              )}
                            </div>
                            {hasDiscount && (
                              <span style={{ fontSize: 9, fontWeight: 900, color: '#f43f5e' }}>SAVE ৳{(combo.totalPrice - effectivePrice).toLocaleString()}</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {isAdded ? (
                              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate('/cart'); }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '9px 0', borderRadius: 10, background: '#ecfdf5', color: '#059669', fontSize: 11, fontWeight: 700, border: '1px solid #a7f3d0', cursor: 'pointer' }}>
                                ✓ View Cart
                              </button>
                            ) : (
                              <button onClick={(e) => { e.preventDefault(); handleComboAddToCart(combo, e); }} disabled={cartLoading === `combo-${combo._id}`} style={{ flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 11, fontWeight: 700, border: '1.5px solid #8b5cf6', background: '#fff', color: '#8b5cf6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {cartLoading === `combo-${combo._id}` ? <span className="spinner" style={{ width: 10, height: 10, borderTopColor: '#8b5cf6' }} /> : <><FaShoppingCart style={{ marginRight: 4 }}/> Add Cart</>}
                              </button>
                            )}
                            <button onClick={(e) => { e.preventDefault(); handleComboBuyNow(combo, e); }} disabled={cartLoading === `combobuy-${combo._id}`} style={{ flex: 1.5, padding: '9px 0', borderRadius: 10, fontSize: 11, fontWeight: 800, border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {cartLoading === `combobuy-${combo._id}` ? <span className="spinner" style={{ width: 10, height: 10 }} /> : 'Buy Now'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            )}

            {/* ── product grid ── */}
            {loading ? (
              <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))',gap:20 }}>
                {[...Array(8)].map((_,i)=>(
                  <div key={i} style={{ borderRadius:22,overflow:'hidden',border:'1.5px solid #e0eeff',background:'#fff' }}>
                    <div className="shimmer" style={{ height: 150 }}/>
                    <div style={{ padding:18,display:'flex',flexDirection:'column',gap:10 }}>
                      <div className="shimmer" style={{ height:11,borderRadius:8,width:'45%' }}/>
                      <div className="shimmer" style={{ height:14,borderRadius:8,width:'72%' }}/>
                      <div className="shimmer" style={{ height:20,borderRadius:8,width:'40%' }}/>
                      <div className="shimmer" style={{ height:40,borderRadius:12 }}/>
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div style={{ textAlign:'center',padding:'80px 24px',background:'#fff',borderRadius:28,border:'1.5px solid #e0eeff' }}>
                <div style={{ fontSize:64,marginBottom:16,animation:'float 3s ease-in-out infinite' }}>🔍</div>
                <h3 className="serif" style={{ fontSize:26,color:'#0f172a',marginBottom:8 }}>Nothing found</h3>
                <p style={{ color:'#94a3b8',fontSize:14,marginBottom:24 }}>Try adjusting your search or filters</p>
                <button onClick={resetFilters} className="btn-blue" style={{ padding:'12px 32px',fontSize:14 }}>
                  ↺ Reset Filters
                </button>
              </div>
            ) : (
              <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))',gap:20 }}>
                {products.map((product,idx)=>(
                  <ProductCard key={product._id} product={product} idx={idx}
                    onAddToCart={handleAddToCart}
                    onBuyNow={handleBuyNow}
                    isLoading={cartLoading===product._id || cartLoading===`buynow-${product._id}`}
                    isBuyNowLoading={cartLoading===`buynow-${product._id}`}
                    isAdded={addedToCart[product._id]}/>
                ))}
              </div>
            )}

            {/* pagination */}
            {pagination.pages > 1 && (
              <div style={{ display:'flex',justifyContent:'center',gap:8,marginTop:48,flexWrap:'wrap' }}>
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="btn-outline" style={{ padding:'9px 20px',fontSize:13,opacity:page===1?.4:1 }}>← Prev</button>
                {[...Array(pagination.pages)].map((_,i)=>(
                  <button key={i} onClick={()=>setPage(i+1)} className={page===i+1?'btn-blue':'btn-outline'} style={{ padding:'9px 16px',fontSize:13,minWidth:42,borderRadius:10 }}>{i+1}</button>
                ))}
                <button onClick={()=>setPage(p=>Math.min(pagination.pages,p+1))} disabled={page===pagination.pages} className="btn-blue" style={{ padding:'9px 20px',fontSize:13,opacity:page===pagination.pages?.5:1 }}>Next →</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

/* ══ PRODUCT CARD ══ */
function ProductCard({ product, idx, onAddToCart, onBuyNow, isLoading, isBuyNowLoading, isAdded }) {
  const [hovered, setHovered] = useState(false);
  const { t } = useLanguage();
  const discount   = product.discountPrice ? Math.round(((product.price-product.discountPrice)/product.price)*100) : 0;
  const outOfStock = product.stock === 0;

  return (
    <div className="p-card" onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
      style={{ animationDelay:`${idx*40}ms`, minWidth: '220px' }}>

      {/* image area */}
      <Link to={`/product/${product._id}`} className="p-img" style={{ display:'block',position:'relative' }}>
        <div style={{ height:150,overflow:'hidden',background:'#f8fbff',position:'relative' }}>
          {product.images?.[0]
            ? <img src={product.images[0].url} alt={product.name} style={{ width:'100%',height:'100%',objectFit:'cover',display:'block' }}/>
            : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:48 }}>🌿</div>
          }
          <div className="p-overlay" style={{ position:'absolute',inset:0,background:'rgba(0,0,0,0.03)' }}/>
          
          {discount > 0 && (
            <div style={{ position:'absolute',top:10,left:10,background:'linear-gradient(135deg,#f43f5e,#e11d48)',color:'#fff',fontSize:9,fontWeight:900,padding:'4px 8px',borderRadius:6,boxShadow:'0 4px 12px rgba(225,29,72,0.25)',textTransform:'uppercase',letterSpacing:'-0.01em' }}>
              {discount}% OFF
            </div>
          )}
        </div>

        {outOfStock && (
          <div style={{ position:'absolute',inset:0,background:'rgba(255,255,255,0.7)',backdropFilter:'blur(2px)',display:'flex',alignItems:'center',justifyContent:'center', zIndex:20 }}>
            <span style={{ color:'#fff',fontSize:11,fontWeight:800,textTransform:'uppercase',background:'#64748b',padding:'6px 14px',borderRadius:99,boxShadow:'0 4px 12px rgba(0,0,0,0.1)' }}>
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* content body */}
      <div style={{ padding:'12px 14px 14px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, marginBottom:4 }}>
          <Link to={`/product/${product._id}`} style={{ textDecoration:'none', flex: 1 }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:'#1e293b', margin:0, lineHeight:1.3, height:36, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
              {product.name}
            </h3>
          </Link>
          <div style={{ textAlign:'right', flexShrink:0 }}>
             <p style={{ margin:0, fontSize:15, fontWeight:800, color:'#2563eb', lineHeight:1 }}>৳{(product.discountPrice||product.price).toLocaleString()}</p>
             {product.discountPrice && (
               <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', marginTop:2 }}>
                 <p style={{ margin:0, fontSize:11, color:'#94a3b8', textDecoration:'line-through', lineHeight:1 }}>৳{product.price.toLocaleString()}</p>
                 <span style={{ fontSize:9, fontWeight:900, color:'#f43f5e', marginTop:2 }}>SAVE ৳{product.price - product.discountPrice}</span>
               </div>
             )}
          </div>
        </div>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <span style={{ fontSize:10, color:'#059669', fontWeight:800, textTransform:'uppercase', letterSpacing:'-0.025em' }}>
              {product.stock > 9 ? 'Available' : product.stock > 0 ? `Only ${product.stock} left` : 'Out of Stock'}
            </span>
            {product.weightPerUnit > 0 && (
              <span style={{ fontSize:10, color:'#94a3b8', fontWeight:700 }}>
                {product.weightPerUnit}{product.weightUnit}
              </span>
            )}
          </div>

        {/* Buttons pashapashi */}
        <div style={{ display:'flex', gap:8 }}>
          {isAdded ? (
            <Link to="/cart" style={{ flex:1, display:'flex',alignItems:'center',justifyContent:'center',gap:4,padding:'9px 0',borderRadius:10,background:'#eff6ff',color:'#2563eb',fontSize:12,fontWeight:700,textDecoration:'none',border:'1px solid #dbeafe' }}>
               {t('home.ourProducts.addedToCart')} ✓
            </Link>
          ) : (
            <button onClick={e=>{e.preventDefault();onAddToCart(product);}} disabled={isLoading||outOfStock}
              style={{
                flex:1, padding:'9px 0', borderRadius:10, fontSize:12, fontWeight:700, border:'1.5px solid #2563eb',
                background: hovered ? '#2563eb' : '#fff', color: hovered ? '#fff' : '#2563eb',
                cursor: outOfStock?'not-allowed':'pointer', transition:'all 0.2s', opacity: outOfStock ? 0.5 : 1
              }}>
              {isLoading && !isBuyNowLoading ? <span className="spinner" style={{ width:10, height:10, borderTopColor:'#2563eb' }}/> : t('home.ourProducts.addToCart')}
            </button>
          )}

          <button onClick={e=>{e.preventDefault();onBuyNow(product);}} disabled={isLoading||outOfStock}
            style={{
              flex: 1.5, padding:'9px 0', borderRadius:10, fontSize:12, fontWeight:800, border:'none',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff',
              cursor: outOfStock?'not-allowed':'pointer', transition:'all 0.2s', opacity: outOfStock ? 0.5 : 1,
              boxShadow: hovered ? '0 4px 12px rgba(37,99,235,0.2)' : 'none'
            }}>
            {isBuyNowLoading ? <span className="spinner" style={{ width:10, height:10 }}/> : t('home.ourProducts.buyNow')}
          </button>
        </div>
      </div>
    </div>
  );
}