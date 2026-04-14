import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function CartPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [cart, setCart]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [updating, setUpdating] = useState(null);
  const [expandedCombos, setExpandedCombos] = useState({});

  const toggleCombo = (id) => {
    setExpandedCombos(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => { fetchCart(); }, [isAuthenticated]);

  const fetchCart = async () => {
    if (!isAuthenticated) {
      const guestCart = JSON.parse(localStorage.getItem('guestCart') || '{"items":[], "totalAmount":0}');
      setCart(guestCart);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/cart');
      setCart(data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleQuantityChange = async (itemId, newQty) => {
    if (newQty < 1) return;
    setUpdating(itemId);
    
    if (!isAuthenticated) {
      const guestCart = JSON.parse(localStorage.getItem('guestCart') || '{"items":[], "totalAmount":0}');
      const item = guestCart.items.find(i => (i._id || i.product) === itemId);
      if (item) {
        item.quantity = newQty;
        guestCart.totalAmount = guestCart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        localStorage.setItem('guestCart', JSON.stringify(guestCart));
        setCart(guestCart);
      }
      setUpdating(null);
      return;
    }

    try {
      const { data } = await api.put(`/cart/update/${itemId}`, { quantity: newQty });
      setCart(data.data);
    } catch (err) { alert(err.response?.data?.message || 'Update failed'); }
    finally { setUpdating(null); }
  };

  const handleRemove = async (itemId) => {
    setUpdating(itemId);

    if (!isAuthenticated) {
      const guestCart = JSON.parse(localStorage.getItem('guestCart') || '{"items":[], "totalAmount":0}');
      guestCart.items = guestCart.items.filter(i => (i._id || i.product) !== itemId);
      guestCart.totalAmount = guestCart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      localStorage.setItem('guestCart', JSON.stringify(guestCart));
      setCart(guestCart);
      setUpdating(null);
      window.dispatchEvent(new Event('cart-updated'));
      return;
    }

    try {
      const { data } = await api.delete(`/cart/remove/${itemId}`);
      setCart(data.data);
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err) { alert('Failed to remove item'); }
    finally { setUpdating(null); }
  };

  const handleClear = async () => {
    if (!window.confirm('Clear all items from cart?')) return;
    
    if (!isAuthenticated) {
      localStorage.removeItem('guestCart');
      setCart({ items: [], totalAmount: 0 });
      window.dispatchEvent(new Event('cart-updated'));
      return;
    }

    try {
      await api.delete('/cart/clear');
      setCart({ items: [], totalAmount: 0 });
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err) { alert('Failed to clear cart'); }
  };

  const isEmpty = !cart?.items?.length;

  const computedTotalAmount = cart?.items?.reduce((sum, item) => {
    const pPrice = item.product?.discountPrice || item.product?.price || item.price || 0;
    return sum + (pPrice * item.quantity);
  }, 0) || 0;

  return (
    <>
      <Navbar />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
        .cr * { box-sizing:border-box; margin:0; padding:0; }
        .cr { font-family:'DM Sans',sans-serif; background:#f2f7ff; min-height:100vh; }
        .serif { font-family:'DM Serif Display',serif; }

        /* shimmer */
        .shimmer { background:linear-gradient(90deg,#e8f0fe 25%,#dbeafe 50%,#e8f0fe 75%); background-size:200% 100%; animation:sh 1.4s infinite linear; border-radius:10px; }
        @keyframes sh { 0%{background-position:200% 0}100%{background-position:-200% 0} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }

        .item-row {
          background:#fff;
          border:1.5px solid #e0eeff;
          border-radius:20px;
          display:flex;
          gap:0;
          overflow:hidden;
          transition:box-shadow .25s, transform .25s, opacity .2s;
          animation: fadeUp .35s ease both;
        }
        .item-row:hover { box-shadow:0 12px 32px rgba(29,78,216,.11); transform:translateY(-3px); }
        .item-row.dimmed { opacity:.4; pointer-events:none; }

        /* left accent bar on each card */
        .item-accent { width:5px; flex-shrink:0; background:linear-gradient(180deg,#3b82f6,#0ea5e9); }

        .qty-wrap { display:flex; align-items:center; gap:0; background:#f0f7ff; border:1.5px solid #dbeafe; border-radius:12px; overflow:hidden; }
        .qty-btn { width:36px; height:36px; background:transparent; border:none; color:#2563eb; font-size:18px; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background .15s; display:flex; align-items:center; justify-content:center; }
        .qty-btn:hover:not(:disabled) { background:#dbeafe; }
        .qty-btn:disabled { opacity:.3; cursor:not-allowed; }
        .qty-num { min-width:36px; text-align:center; font-weight:800; font-size:15px; color:#1e293b; font-family:'DM Sans',sans-serif; }

        .remove-btn { width:32px; height:32px; border-radius:8px; border:1.5px solid #fecaca; background:#fff5f5; color:#f87171; font-size:16px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .18s; flex-shrink:0; }
        .remove-btn:hover { background:#fee2e2; border-color:#fca5a5; color:#ef4444; transform:scale(1.1); }

        .summary-card { background:#fff; border:1.5px solid #e0eeff; border-radius:24px; overflow:hidden; position:sticky; top:24px; }
        .summary-header { background:linear-gradient(135deg,#1d4ed8,#2563eb 60%,#0ea5e9); padding:22px 24px; }
        .summary-body { padding:22px 24px; }
        .sum-row { display:flex; justify-content:space-between; align-items:center; padding:9px 0; border-bottom:1px dashed #e0eeff; }
        .sum-row:last-child { border-bottom:none; }

        .checkout-btn { width:100%; padding:15px; border-radius:14px; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; font-weight:800; font-size:15px; color:#fff; background:linear-gradient(135deg,#1d4ed8,#2563eb 60%,#0ea5e9); box-shadow:0 6px 20px rgba(29,78,216,.35); transition:all .22s; letter-spacing:.02em; }
        .checkout-btn:hover { transform:translateY(-3px); box-shadow:0 12px 32px rgba(29,78,216,.45); }
        .checkout-btn:active { transform:translateY(0); }

        .trust-row { display:flex; gap:10px; margin-top:16px; }
        .trust-pill { flex:1; background:#f0f7ff; border:1.5px solid #dbeafe; border-radius:12px; padding:10px 8px; text-align:center; }
      `}</style>

      <div className="cr">

        {/* ══ HERO ══ */}
        <div style={{ background:'linear-gradient(135deg,#0f172a 0%,#1e3a8a 50%,#1d4ed8 100%)', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute',top:-70,right:-70,width:320,height:320,borderRadius:'50%',background:'radial-gradient(circle,rgba(96,165,250,.18) 0%,transparent 70%)',pointerEvents:'none' }}/>
          <div style={{ position:'absolute',bottom:-50,left:'20%',width:200,height:200,borderRadius:'50%',background:'radial-gradient(circle,rgba(14,165,233,.12) 0%,transparent 70%)',pointerEvents:'none' }}/>
          <div style={{ position:'absolute',inset:0,backgroundImage:'repeating-linear-gradient(45deg,rgba(255,255,255,.025) 0px,rgba(255,255,255,.025) 1px,transparent 1px,transparent 14px)',pointerEvents:'none' }}/>
          <div style={{ maxWidth:960,margin:'0 auto',padding:'44px 24px 48px',position:'relative',zIndex:10,display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:14 }}>
            <div>
              <p style={{ fontSize:11,fontWeight:700,letterSpacing:'.2em',color:'#93c5fd',marginBottom:8,textTransform:'uppercase' }}>Shopping Bag</p>
              <h1 className="serif" style={{ fontSize:'clamp(1.8rem,4vw,2.8rem)',color:'#fff',lineHeight:1.1 }}>
                My Cart
                {!loading && !isEmpty && (
                  <span className="serif" style={{ fontStyle:'italic',color:'#7dd3fc',marginLeft:14,fontSize:'clamp(1.1rem,2.5vw,1.6rem)' }}>
                    ({cart.items.length} {cart.items.length===1?'item':'items'})
                  </span>
                )}
              </h1>
            </div>
            {!loading && !isEmpty && (
              <button onClick={handleClear} style={{ background:'rgba(239,68,68,.15)',border:'1.5px solid rgba(239,68,68,.4)',borderRadius:12,padding:'8px 18px',color:'#fca5a5',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",transition:'all .2s' }}
                onMouseEnter={e=>{e.target.style.background='rgba(239,68,68,.25)'}}
                onMouseLeave={e=>{e.target.style.background='rgba(239,68,68,.15)'}}>
                🗑 Clear All
              </button>
            )}
          </div>
        </div>

        <div style={{ maxWidth:960,margin:'0 auto',padding:'36px 24px 80px' }}>

          {/* ── LOADING ── */}
          {loading ? (
            <div style={{ display:'flex',gap:24,alignItems:'flex-start',flexWrap:'wrap' }}>
              <div style={{ flex:1,minWidth:0,display:'flex',flexDirection:'column',gap:14 }}>
                {[...Array(3)].map((_,i)=>(
                  <div key={i} style={{ background:'#fff',border:'1.5px solid #e0eeff',borderRadius:20,overflow:'hidden',display:'flex' }}>
                    <div style={{ width:5,background:'linear-gradient(#3b82f6,#0ea5e9)',flexShrink:0 }}/>
                    <div style={{ padding:20,display:'flex',gap:16,flex:1 }}>
                      <div className="shimmer" style={{ width:86,height:86,flexShrink:0 }}/>
                      <div style={{ flex:1,display:'flex',flexDirection:'column',gap:10 }}>
                        <div className="shimmer" style={{ height:14,width:'60%' }}/>
                        <div className="shimmer" style={{ height:11,width:'35%' }}/>
                        <div className="shimmer" style={{ height:36,width:'38%',borderRadius:12 }}/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ width:300,flexShrink:0,background:'#fff',border:'1.5px solid #e0eeff',borderRadius:24,overflow:'hidden' }}>
                <div className="shimmer" style={{ height:90,borderRadius:0 }}/>
                <div style={{ padding:22,display:'flex',flexDirection:'column',gap:12 }}>
                  {[...Array(4)].map((_,i)=><div key={i} className="shimmer" style={{ height:13,width:`${70-i*10}%` }}/>)}
                  <div className="shimmer" style={{ height:50,borderRadius:14,marginTop:8 }}/>
                </div>
              </div>
            </div>
          ) : isEmpty ? (

            /* ── EMPTY STATE ── */
            <div style={{ textAlign:'center',padding:'64px 24px',background:'#fff',borderRadius:28,border:'1.5px solid #e0eeff',boxShadow:'0 4px 24px rgba(29,78,216,.07)' }}>
              <div style={{ width:100,height:100,borderRadius:30,margin:'0 auto 24px',background:'linear-gradient(135deg,#dbeafe,#bfdbfe)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:44,boxShadow:'0 8px 24px rgba(37,99,235,.15)' }}>🛒</div>
              <h3 className="serif" style={{ fontSize:28,color:'#0f172a',marginBottom:10 }}>Your cart is empty</h3>
              <p style={{ color:'#94a3b8',fontSize:15,marginBottom:28,lineHeight:1.6 }}>Looks like you haven't added anything yet.<br/>Explore our fresh products!</p>
              <Link to="/shop" style={{ display:'inline-block',padding:'14px 38px',borderRadius:14,background:'linear-gradient(135deg,#1d4ed8,#2563eb)',color:'#fff',fontWeight:800,fontSize:15,textDecoration:'none',boxShadow:'0 6px 20px rgba(37,99,235,.35)',fontFamily:"'DM Sans',sans-serif" }}>
                Browse Products →
              </Link>
            </div>

          ) : (
            <div style={{ display:'flex',gap:24,alignItems:'flex-start',flexWrap:'wrap' }}>

              {/* ══ LEFT: ITEMS ══ */}
              <div style={{ flex:1,minWidth:0,display:'flex',flexDirection:'column',gap:14 }}>

                {/* section label */}
                <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:4 }}>
                  <div style={{ height:2,flex:1,background:'linear-gradient(90deg,#3b82f6,transparent)' }}/>
                  <span style={{ fontSize:11,fontWeight:800,letterSpacing:'.16em',color:'#3b82f6',textTransform:'uppercase' }}>Your Items</span>
                  <div style={{ height:2,flex:1,background:'linear-gradient(90deg,transparent,#3b82f6)' }}/>
                </div>

                {cart.items.map((item, idx) => {
                  const price         = item.product?.discountPrice || item.product?.price || item.price || 0;
                  const originalPrice = item.product?.price || item.originalPrice || price;
                  const discountPct   = item.product?.discountPercentage || item.discountPercentage || 0;
                  const subtotal      = (price * item.quantity).toFixed(2);
                  const imgSrc        = item.image || item.product?.images?.[0]?.url;
                  const name          = item.name || item.product?.name || 'Product';
                  const seller        = item.seller?.name || item.product?.seller?.name || 'Verified Seller';
                  const unit          = item.unit || item.product?.unit || '';
                  const pid      = item.product?._id || item.product;
                  const itemId   = item._id || pid;
                  const isUpd    = updating === itemId;

                  return (
                    <div key={itemId} className={`item-row ${isUpd?'dimmed':''}`} style={{ animationDelay:`${idx*60}ms` }}>
                      {/* accent bar */}
                      <div className="item-accent"/>

                      <div style={{ flex:1,padding:'18px 20px',display:'flex',gap:16,alignItems:'center' }}>

                        {/* image */}
                        <Link to={`/product/${pid}`} style={{ flexShrink:0 }}>
                          <div style={{ width:88,height:88,borderRadius:16,overflow:'hidden',background:'#eef4ff',border:'2px solid #dbeafe',position:'relative' }}>
                            {imgSrc
                              ? <img src={imgSrc} alt={name} style={{ width:'100%',height:'100%',objectFit:'cover',display:'block',transition:'transform .4s' }}
                                  onMouseEnter={e=>e.target.style.transform='scale(1.08)'}
                                  onMouseLeave={e=>e.target.style.transform='scale(1)'}/>
                              : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32 }}>🌿</div>
                            }
                            {originalPrice > price && (
                              <div style={{ position:'absolute',top:4,left:4,background:'#ef4444',color:'#fff',fontSize:'9px',fontWeight:900,padding:'2px 6px',borderRadius:6,boxShadow:'0 2px 8px rgba(239,68,68,.3)' }}>
                                {discountPct > 0 ? `OFF ${discountPct}%` : 'SALE'}
                              </div>
                            )}
                          </div>
                        </Link>

                        {/* middle info */}
                        <div style={{ flex:1,minWidth:0 }}>
                          <p style={{ fontSize:10,fontWeight:800,letterSpacing:'.14em',color:'#93c5fd',textTransform:'uppercase',marginBottom:4 }}>{seller}</p>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <Link to={item.isCombo ? `/combo/${item.comboId?._id}` : `/product/${pid}`} style={{ textDecoration:'none' }}>
                              <p style={{ fontWeight:700,fontSize:16,color:'#0f172a',marginBottom:6,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',transition:'color .2s',lineHeight:1.3 }}
                                 onMouseEnter={e=>e.target.style.color='#2563eb'}
                                 onMouseLeave={e=>e.target.style.color='#0f172a'}>
                                {name} {item.isCombo && <span style={{fontSize:10,background:'#8b5cf6',color:'#fff',padding:'2px 6px',borderRadius:6,marginLeft:6,verticalAlign:'middle',fontWeight:800}}>COMBO</span>}
                              </p>
                            </Link>

                            {/* Combo toggle link */}
                            {item.isCombo && (
                              <button onClick={() => toggleCombo(itemId)} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#8b5cf6', fontSize: 11, fontWeight: 800, cursor: 'pointer', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                                {expandedCombos[itemId] ? '▲ Hide Items' : '▼ See what is inside'}
                              </button>
                            )}
                          </div>

                          {/* price per unit */}
                          <div style={{ display:'flex',flexDirection:'column',gap:4,marginBottom:14 }}>
                            <div style={{ display:'flex',alignItems:'baseline',gap:6 }}>
                              <span style={{ fontSize:15,fontWeight:800,color:'#1d4ed8' }}>৳{price}</span>
                              {unit && <span style={{ fontSize:12,color:'#94a3b8',fontWeight:500 }}>/ {unit}</span>}
                            </div>
                            {originalPrice > price && (
                              <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                                <span style={{ fontSize:11,color:'#94a3b8',textDecoration:'line-through' }}>৳{originalPrice}</span>
                                <span style={{ color:'#10b981',fontSize:10,fontWeight:800,background:'#ecfdf5',padding:'2px 6px',borderRadius:6,border:'1px solid #a7f3d0' }}>Save {originalPrice - price} TK</span>
                              </div>
                            )}
                          </div>

                          {/* qty stepper */}
                          <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                            <div className="qty-wrap">
                              <button className="qty-btn" onClick={()=>handleQuantityChange(itemId,item.quantity-1)} disabled={item.quantity<=1||isUpd}>−</button>
                              <span className="qty-num">{item.quantity}</span>
                              <button className="qty-btn" onClick={()=>handleQuantityChange(itemId,item.quantity+1)} disabled={isUpd}>+</button>
                            </div>
                            {isUpd && <span style={{ width:16,height:16,border:'2.5px solid #bfdbfe',borderTopColor:'#2563eb',borderRadius:'50%',animation:'spin .7s linear infinite',display:'inline-block',flexShrink:0 }}/>}
                          </div>
                        </div>

                        {/* right: subtotal + remove */}
                        <div style={{ display:'flex',flexDirection:'column',alignItems:'flex-end',justifyContent:'space-between',gap:14,flexShrink:0 }}>
                          <button className="remove-btn" onClick={()=>handleRemove(itemId)} disabled={isUpd} title="Remove item">×</button>

                          <div style={{ textAlign:'right',background:'linear-gradient(135deg,#eff6ff,#dbeafe)',border:'1.5px solid #bfdbfe',borderRadius:14,padding:'8px 14px' }}>
                            <p style={{ fontSize:10,fontWeight:700,color:'#93c5fd',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:2 }}>Subtotal</p>
                            <p className="serif" style={{ fontSize:20,color:'#1d4ed8',fontWeight:700 }}>৳{subtotal}</p>
                          </div>
                        </div>
                      </div>

                      {/* Combo Details Dropdown */}
                      {item.isCombo && expandedCombos[itemId] && item.comboId?.items && (
                        <div style={{ padding: '0 20px 20px 20px', background: '#fafcff' }}>
                           <div style={{ borderTop: '1px dashed #bfdbfe', paddingTop: 16 }}>
                             <p style={{ fontSize: 11, fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', marginBottom: 12 }}>Items in this Combo</p>
                             <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                               {item.comboId.items.map((innerItem, idx2) => (
                                 <div key={idx2} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid #dbeafe', borderRadius: 12, padding: '8px 12px' }}>
                                   <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: '#f8faff', border: '1px solid #eff6ff', flexShrink: 0 }}>
                                     {innerItem.image?.url ? <img src={innerItem.image.url} alt={innerItem.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{width:'100%',height:'100%',display:'flex',justifyContent:'center',alignItems:'center',fontSize:18}}>📦</div>}
                                   </div>
                                   <div>
                                     <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>{innerItem.name}</p>
                                     <p style={{ fontSize: 10, color: '#64748b' }}>{innerItem.quantity || innerItem.description || 'Included in bundle'}</p>
                                   </div>
                                 </div>
                               ))}
                             </div>
                           </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* continue shopping link */}
                <Link to="/shop" style={{ display:'inline-flex',alignItems:'center',gap:6,fontSize:13,fontWeight:600,color:'#2563eb',textDecoration:'none',marginTop:4,alignSelf:'flex-start',padding:'8px 16px',borderRadius:10,border:'1.5px solid #dbeafe',background:'#fff',transition:'all .18s' }}
                  onMouseEnter={e=>{e.currentTarget.style.background='#eff6ff';e.currentTarget.style.borderColor='#93c5fd'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='#fff';e.currentTarget.style.borderColor='#dbeafe'}}>
                  ← Continue Shopping
                </Link>
              </div>

              {/* ══ RIGHT: ORDER SUMMARY ══ */}
              <div style={{ width:300,flexShrink:0 }}>
                <div className="summary-card">

                  {/* header */}
                  <div className="summary-header">
                    <p style={{ fontSize:11,fontWeight:700,letterSpacing:'.16em',color:'rgba(191,219,254,.8)',textTransform:'uppercase',marginBottom:6 }}>Checkout</p>
                    <h3 className="serif" style={{ fontSize:22,color:'#fff',fontWeight:400 }}>Order Summary</h3>
                  </div>

                  <div className="summary-body">

                    {/* item lines */}
                    <div style={{ marginBottom:16, display:'flex', flexDirection:'column', gap:10 }}>
                      {cart.items.map((item, idx) => {
                        const pid      = item.product?._id || item.product;
                        const itemId   = item._id || pid;
                        const isUpd    = updating === itemId;
                        const price    = item.product?.discountPrice || item.product?.price || item.price || 0;
                        const subtotal = (price * item.quantity).toFixed(2);
                        const name     = item.name || item.product?.name || 'Item';
                        const imgSrc   = item.image || item.product?.images?.[0]?.url;

                        return (
                          <div key={itemId} style={{ display:'flex', alignItems:'center', gap:12, paddingBottom:10, borderBottom:'1px dashed #e2e8f0' }}>
                            {/* small thumb */}
                            <div style={{ width:40, height:40, borderRadius:8, overflow:'hidden', flexShrink:0, background:'#f8faff', border:'1px solid #e0eeff' }}>
                              <img src={imgSrc} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                            </div>
                            
                            <div style={{ flex:1, minWidth:0 }}>
                              <p style={{ fontSize:12, fontWeight:700, color:'#1e293b', margin:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{name}</p>
                              <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
                                <span style={{ fontSize:11, color:'#94a3b8' }}>৳{price} ×</span>
                                <div style={{ display:'flex', alignItems:'center', gap:4, background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:6, padding:'1px 4px' }}>
                                  <button onClick={()=>handleQuantityChange(itemId, item.quantity-1)} disabled={item.quantity<=1||isUpd} style={{ border:0, background:0, color:'#3b82f6', fontSize:14, fontWeight:'bold', cursor:'pointer', padding:'0 2px' }}>–</button>
                                  <span style={{ fontSize:11, fontWeight:800, color:'#1e293b', minWidth:14, textAlign:'center' }}>{item.quantity}</span>
                                  <button onClick={()=>handleQuantityChange(itemId, item.quantity+1)} disabled={isUpd} style={{ border:0, background:0, color:'#3b82f6', fontSize:14, fontWeight:'bold', cursor:'pointer', padding:'2px' }}>+</button>
                                </div>
                              </div>
                            </div>

                            <span style={{ fontWeight:800, fontSize:13, color:'#2563eb', flexShrink:0 }}>৳{subtotal}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* delivery note */}
                    <div style={{ background:'#f0f7ff',border:'1.5px solid #dbeafe',borderRadius:12,padding:'10px 14px',display:'flex',gap:8,alignItems:'center',marginBottom:16 }}>
                      <span style={{ fontSize:18 }}>🚚</span>
                      <div>
                        <p style={{ fontSize:12,color:'#1d4ed8',fontWeight:700,margin:'0 0 1px' }}>Delivery Charge</p>
                        <p style={{ fontSize:11,color:'#64748b',margin:0 }}>Calculated at checkout</p>
                      </div>
                    </div>

                    {/* total */}
                    <div style={{ background:'linear-gradient(135deg,#eff6ff,#dbeafe)',border:'1.5px solid #bfdbfe',borderRadius:16,padding:'14px 18px',marginBottom:20,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                      <div>
                        <p style={{ fontSize:11,fontWeight:700,color:'#3b82f6',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:3 }}>Total</p>
                        <p style={{ fontSize:11,color:'#94a3b8' }}>excl. delivery</p>
                      </div>
                      <span className="serif" style={{ fontSize:28,color:'#1d4ed8',fontWeight:700 }}>৳{computedTotalAmount.toFixed(2)}</span>
                    </div>

                    {/* checkout btn */}
                    <button className="checkout-btn" onClick={()=>navigate('/checkout')}>
                      Proceed to Checkout →
                    </button>

                    {/* trust badges */}
                    <div className="trust-row">
                      {[
                        { icon:'🔒', label:'Secure Payment' },
                        { icon:'↩️', label:'Easy Returns' },
                        { icon:'✓', label:'Verified Sellers' },
                      ].map(b=>(
                        <div key={b.label} className="trust-pill">
                          <div style={{ fontSize:16,marginBottom:3 }}>{b.icon}</div>
                          <div style={{ fontSize:10,fontWeight:700,color:'#3b5280',lineHeight:1.3 }}>{b.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </>
  );
}