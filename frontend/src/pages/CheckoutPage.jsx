import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import bangladeshLocations from '../data/bangladesh-locations.json';

const PAYMENT_METHODS = [
  { value: 'cod',    label: 'Cash on Delivery', icon: '💵', desc: 'Pay when your order arrives' },
  { value: 'bkash',  label: 'bKash',            icon: '📱', desc: 'Pay via bKash mobile banking' },
  { value: 'nagad',  label: 'Nagad',             icon: '📲', desc: 'Pay via Nagad mobile banking' },
  { value: 'rocket', label: 'Rocket',            icon: '🚀', desc: 'Pay via Rocket mobile banking' },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [cart, setCart]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [placing, setPlacing]     = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  // ── Combo monthly purchase check ─────────────────────────────────────────
  const [comboCheck, setComboCheck] = useState({ loading: true, hasPurchased: null });
  const [suggestedCombos, setSuggestedCombos] = useState([]);
  // true  = user bought a combo this month  → single product checkout ALLOWED
  // false = no combo this month             → checkout BLOCKED
  // null  = still loading
  // ─────────────────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    division: user?.address?.division || '',
    district: user?.address?.district || '',
    upazila: user?.address?.upazila || '',
    details: '',
  });
  const [errors, setErrors] = useState({});
  const [districts, setDistricts] = useState([]);
  const [thanas,    setThanas]    = useState([]);

  // Recovery logic for guest checkout
  useEffect(() => {
    const saved = sessionStorage.getItem('pendingCheckout');
    if (saved) {
      const data = JSON.parse(saved);
      setForm(prev => ({ ...prev, ...data.form }));
      setPaymentMethod(data.paymentMethod);
      sessionStorage.removeItem('pendingCheckout');
    }
  }, []);

  useEffect(() => {
    if (form.division) {
      const div = bangladeshLocations.find(d => d.division === form.division);
      setDistricts(div?.districts || []);
    } else { setDistricts([]); }
  }, [form.division]);

  useEffect(() => {
    if (form.district && districts.length > 0) {
      const dist = districts.find(d => d.name === form.district);
      setThanas(dist?.thanas || []);
    } else { setThanas([]); }
  }, [form.district, districts]);

  useEffect(() => { fetchCart(); }, [isAuthenticated]);

  // ── Monthly combo purchase check (only for authenticated users with non-combo cart) ──
  useEffect(() => {
    if (!isAuthenticated) {
      setComboCheck({ loading: false, hasPurchased: false });
      return;
    }
    api.get('/combos/user/monthly-check')
      .then(res => {
        setComboCheck({
          loading: false,
          hasPurchased: res.data.hasPurchasedComboThisMonth,
        });
      })
      .catch(() => {
        // If check fails, don't block checkout
        setComboCheck({ loading: false, hasPurchased: true });
      });
  }, [isAuthenticated]);

  // ── Fetch combo suggestions if user hasn't purchased one ──
  useEffect(() => {
    if (comboCheck.hasPurchased === false) {
      api.get('/combos').then(res => {
        if (res.data.success) {
          // just show 1 or 2 top combos
          setSuggestedCombos(res.data.data.slice(0, 2));
        }
      }).catch(console.error);
    }
  }, [comboCheck.hasPurchased]);

  const fetchCart = async () => {
    if (!isAuthenticated) {
      const guestCart = JSON.parse(localStorage.getItem('guestCart') || '{"items":[], "totalAmount":0}');
      if (!guestCart.items?.length) { navigate('/cart'); return; }
      setCart(guestCart);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/cart');
      if (!data.data?.items?.length) { navigate('/cart'); return; }
      setCart(data.data);
    } catch { navigate('/cart'); }
    finally { setLoading(false); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'division') {
      setForm(prev => ({ ...prev, division: value, district: '', upazila: '' }));
    } else if (name === 'district') {
      setForm(prev => ({ ...prev, district: value, upazila: '' }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())     e.name     = 'Name is required';
    if (!form.phone.trim())    e.phone    = 'Phone is required';
    if (!form.district.trim()) e.district = 'District is required';
    if (!form.details.trim())  e.details  = 'Address details required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Determine if cart has ONLY single products (no combos) ───────────────
  const cartHasCombos = cart?.items?.some(i => i.isCombo);
  const cartHasOnlySingleProducts = !cartHasCombos && cart?.items?.length > 0;
  // Block single-product-only checkout if user hasn't purchased a combo this month
  const isCheckoutBlocked = cartHasOnlySingleProducts
    && comboCheck.hasPurchased === false;

  const handlePlaceOrder = async () => {
    if (!validate()) return;

    // ── Business rule: block single-product checkout if no combo purchased this month
    if (isCheckoutBlocked) {
      return alert('You need to purchase a Combo Package this month before buying individual products.');
    }

    if (!isAuthenticated) {
      // Save data for after login
      sessionStorage.setItem('pendingCheckout', JSON.stringify({ form, paymentMethod }));
      // Redirect to login with current path as redirect
      navigate('/login?redirect=/checkout');
      return;
    }

    setPlacing(true);
    try {
      const { data } = await api.post('/orders', {
        deliveryAddress: { name: form.name, phone: form.phone, division: form.division, district: form.district, upazila: form.upazila, details: form.details },
        paymentMethod,
      });
      navigate('/order-success', { state: { orders: data.orders, paymentGatewayUrl: data.paymentGatewayUrl } });
    } catch (err) { alert(err.response?.data?.message || 'Failed to place order'); }
    finally { setPlacing(false); }
  };


  const handleQuickAddCombo = async (combo) => {
    setLoading(true); // show loader
    try {
      const price = combo.discountedPrice ?? combo.totalPrice;
      if (isAuthenticated) {
        await api.post('/cart/combo', {
          comboId: combo._id, name: combo.name, image: combo.image?.url, price, quantity: 1
        });
      } else {
        const stored = JSON.parse(localStorage.getItem('guestCart') || '{"items":[], "totalAmount":0}');
        if (!Array.isArray(stored)) {
          const existing = stored.items.find(i => i.comboId && (i.comboId._id === combo._id || i.comboId === combo._id));
          if (existing) {
            existing.quantity = (existing.quantity || 1) + 1;
          } else {
            stored.items.push({
              comboId: { _id: combo._id, items: combo.items, name: combo.name, image: combo.image },
              isCombo: true,
              name: combo.name,
              image: combo.image?.url || '',
              price: price,
              quantity: 1,
              unit: 'combo',
            });
          }
          stored.totalAmount = stored.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          localStorage.setItem('guestCart', JSON.stringify(stored));
          window.dispatchEvent(new Event('cart-updated'));
        }
      }
      // automatically refreshes cart because we will just call fetchCart
      await fetchCart();
    } catch (err) {
      alert('Failed to add combo. Please go back to Combo Shop.');
    } finally {
      setLoading(false);
    }
  };

  /* shared input style */
  const inp = (name) => ({
    width: '100%', padding: '11px 14px', borderRadius: 12,
    border: `1.5px solid ${errors[name] ? '#fca5a5' : '#dbeafe'}`,
    background: errors[name] ? '#fff5f5' : '#f8fbff',
    fontSize: 13, color: '#1e293b', fontFamily: "'DM Sans',sans-serif",
    outline: 'none', transition: 'border-color .2s, box-shadow .2s',
  });

  return (
    <>
      <Navbar />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
        .co * { box-sizing: border-box; margin: 0; padding: 0; }
        .co { font-family: 'DM Sans', sans-serif; background: #f2f7ff; min-height: 100vh; }
        .serif { font-family: 'DM Serif Display', serif; }

        .section-card {
          background: rgba(255,255,255,0.93);
          border: 1.5px solid #e0eeff;
          border-radius: 22px;
          overflow: hidden;
        }
        .card-header {
          padding: 18px 24px;
          background: linear-gradient(135deg, #f0f7ff, #e8f3ff);
          border-bottom: 1.5px solid #e0eeff;
          display: flex; align-items: center; gap: 12px;
        }
        .card-header-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; flex-shrink: 0;
        }
        .card-body { padding: 24px; }

        .field-label {
          display: block; font-size: 11px; font-weight: 700;
          color: #64748b; text-transform: uppercase;
          letter-spacing: .1em; margin-bottom: 7px;
        }
        .inp-focus:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59,130,246,.12) !important;
          background: #fff !important;
        }

        /* payment option */
        .pay-option {
          display: flex; align-items: center; gap: 14px;
          padding: 15px 18px; border-radius: 16px;
          border: 2px solid #e0eeff; cursor: pointer;
          transition: all .2s; background: #fff;
        }
        .pay-option:hover { border-color: #93c5fd; background: #f8fbff; }
        .pay-option.selected {
          border-color: #2563eb;
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
          box-shadow: 0 4px 14px rgba(37,99,235,.12);
        }
        .pay-radio {
          width: 20px; height: 20px; border-radius: 50%;
          border: 2px solid #cbd5e1; background: #fff;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: all .18s;
        }
        .pay-radio.checked { border-color: #2563eb; background: #2563eb; }
        .pay-radio.checked::after { content: ''; width: 8px; height: 8px; border-radius: 50%; background: #fff; display: block; }

        /* summary card */
        .summary-card {
          background: #fff; border: 1.5px solid #e0eeff;
          border-radius: 22px; overflow: hidden; position: sticky; top: 24px;
        }
        .summary-head { background: linear-gradient(135deg, #1d4ed8, #2563eb 60%, #0ea5e9); padding: 20px 22px; }
        .summary-body { padding: 20px 22px; }

        .place-btn {
          width: 100%; padding: 15px; border-radius: 14px; border: none;
          background: linear-gradient(135deg, #1d4ed8, #2563eb 60%, #0ea5e9);
          color: #fff; font-size: 15px; font-weight: 800;
          font-family: 'DM Sans', sans-serif; cursor: pointer;
          box-shadow: 0 6px 20px rgba(29,78,216,.35);
          transition: all .22s; letter-spacing: .02em;
        }
        .place-btn:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(29,78,216,.45); }
        .place-btn:disabled { opacity: .6; cursor: not-allowed; }

        .shimmer { background: linear-gradient(90deg,#e8f0fe 25%,#dbeafe 50%,#e8f0fe 75%); background-size:200% 100%; animation: sh 1.4s infinite linear; border-radius: 10px; }
        @keyframes sh { 0%{background-position:200% 0}100%{background-position:-200% 0} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp .4s ease both; }
      `}</style>

      <div className="co">

        {/* ── HERO ── */}
        <div style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e3a8a 50%,#1d4ed8 100%)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position:'absolute',top:-70,right:-70,width:320,height:320,borderRadius:'50%',background:'radial-gradient(circle,rgba(96,165,250,.18) 0%,transparent 70%)',pointerEvents:'none' }}/>
          <div style={{ position:'absolute',bottom:-50,left:'20%',width:200,height:200,borderRadius:'50%',background:'radial-gradient(circle,rgba(14,165,233,.12) 0%,transparent 70%)',pointerEvents:'none' }}/>
          <div style={{ position:'absolute',inset:0,backgroundImage:'repeating-linear-gradient(45deg,rgba(255,255,255,.025) 0px,rgba(255,255,255,.025) 1px,transparent 1px,transparent 14px)',pointerEvents:'none' }}/>
          <div style={{ maxWidth:960,margin:'0 auto',padding:'44px 24px 48px',position:'relative',zIndex:10 }}>
            <Link to="/cart" style={{ display:'inline-flex',alignItems:'center',gap:6,color:'#93c5fd',fontSize:13,fontWeight:600,textDecoration:'none',marginBottom:12,transition:'color .2s' }}
              onMouseEnter={e=>e.currentTarget.style.color='#bfdbfe'}
              onMouseLeave={e=>e.currentTarget.style.color='#93c5fd'}>
              ← Back to Cart
            </Link>
            <div style={{ display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:12 }}>
              <div>
                <p style={{ fontSize:11,fontWeight:700,letterSpacing:'.2em',color:'#93c5fd',marginBottom:8,textTransform:'uppercase' }}>Almost there</p>
                <h1 className="serif" style={{ fontSize:'clamp(1.8rem,4vw,2.8rem)',color:'#fff',lineHeight:1.1 }}>
                  Checkout
                </h1>
                <p style={{ color:'#94a3b8',marginTop:8,fontSize:14 }}>Review your order and complete your purchase</p>
              </div>
              {/* step indicator */}
              <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                {[{n:1,l:'Cart'},{n:2,l:'Checkout'},{n:3,l:'Done'}].map((s,i)=>(
                  <div key={s.n} style={{ display:'flex',alignItems:'center',gap:6 }}>
                    <div style={{ width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,
                      background: s.n===2?'#fff':s.n<2?'rgba(255,255,255,.3)':'rgba(255,255,255,.1)',
                      color: s.n===2?'#1d4ed8':s.n<2?'#fff':'rgba(255,255,255,.4)',
                    }}>{s.n}</div>
                    <span style={{ fontSize:11,fontWeight:600,color:s.n===2?'#fff':s.n<2?'rgba(255,255,255,.7)':'rgba(255,255,255,.3)' }}>{s.l}</span>
                    {i<2&&<div style={{ width:20,height:1.5,background:'rgba(255,255,255,.2)',margin:'0 2px' }}/>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth:960,margin:'0 auto',padding:'32px 24px 80px' }}>
          {loading ? (
            <div style={{ display:'flex',gap:24,flexWrap:'wrap' }}>
              <div style={{ flex:1,minWidth:0,display:'flex',flexDirection:'column',gap:20 }}>
                {[160,220].map(h=>(
                  <div key={h} style={{ background:'#fff',border:'1.5px solid #e0eeff',borderRadius:22,overflow:'hidden' }}>
                    <div className="shimmer" style={{ height:56,borderRadius:0 }}/>
                    <div style={{ padding:24,display:'flex',flexDirection:'column',gap:12 }}>
                      {[...Array(3)].map((_,i)=><div key={i} className="shimmer" style={{ height:14,width:`${80-i*15}%` }}/>)}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ width:300,flexShrink:0,background:'#fff',border:'1.5px solid #e0eeff',borderRadius:22,overflow:'hidden' }}>
                <div className="shimmer" style={{ height:80,borderRadius:0 }}/>
                <div style={{ padding:22,display:'flex',flexDirection:'column',gap:12 }}>
                  {[...Array(5)].map((_,i)=><div key={i} className="shimmer" style={{ height:13,width:`${70-i*8}%` }}/>)}
                  <div className="shimmer" style={{ height:50,borderRadius:14,marginTop:8 }}/>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display:'flex',gap:24,alignItems:'flex-start',flexWrap:'wrap' }}>

              {/* ══ LEFT ══ */}
              <div style={{ flex:1,minWidth:0,display:'flex',flexDirection:'column',gap:20 }}>

                {/* ── DELIVERY ADDRESS ── */}
                <div className="section-card fade-up" style={{ animationDelay:'0ms' }}>
                  <div className="card-header">
                    <div className="card-header-icon">📍</div>
                    <div>
                      <h3 style={{ fontSize:15,fontWeight:800,color:'#0f172a' }}>Delivery Address</h3>
                      <p style={{ fontSize:12,color:'#64748b',marginTop:2 }}>Where should we deliver your order?</p>
                    </div>
                  </div>
                  <div className="card-body" style={{ display:'flex',flexDirection:'column',gap:18 }}>

                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
                      {/* Name */}
                      <div>
                        <label className="field-label">Full Name <span style={{ color:'#f87171' }}>*</span></label>
                        <input name="name" value={form.name} onChange={handleChange} placeholder="Your full name"
                          className="inp-focus" style={inp('name')}/>
                        {errors.name && <p style={{ fontSize:11,color:'#ef4444',marginTop:5 }}>{errors.name}</p>}
                      </div>
                      {/* Phone */}
                      <div>
                        <label className="field-label">Phone <span style={{ color:'#f87171' }}>*</span></label>
                        <input name="phone" value={form.phone} onChange={handleChange} placeholder="01XXXXXXXXX"
                          className="inp-focus" style={inp('phone')}/>
                        {errors.phone && <p style={{ fontSize:11,color:'#ef4444',marginTop:5 }}>{errors.phone}</p>}
                      </div>
                    </div>

                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14 }}>
                      {/* Division */}
                      <div>
                        <label className="field-label">Division</label>
                        <select name="division" value={form.division} onChange={handleChange}
                          className="inp-focus" style={{ ...inp('division'), appearance:'none', cursor:'pointer' }}>
                          <option value="">Select Division</option>
                          {bangladeshLocations.map(d => <option key={d.division} value={d.division}>{d.division}</option>)}
                        </select>
                      </div>

                      {/* District */}
                      <div>
                        <label className="field-label">District <span style={{ color:'#f87171' }}>*</span></label>
                        <select name="district" value={form.district} onChange={handleChange}
                          disabled={!form.division}
                          className="inp-focus" style={{ ...inp('district'), appearance:'none', cursor:'pointer' }}>
                          <option value="">Select District</option>
                          {districts.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                        </select>
                        {errors.district && <p style={{ fontSize:11,color:'#ef4444',marginTop:5 }}>{errors.district}</p>}
                      </div>

                      {/* Upazila */}
                      <div>
                        <label className="field-label">Upazila</label>
                        <select name="upazila" value={form.upazila} onChange={handleChange}
                          disabled={!form.district}
                          className="inp-focus" style={{ ...inp('upazila'), appearance:'none', cursor:'pointer' }}>
                          <option value="">Select Upazila</option>
                          {thanas.map(th => <option key={th} value={th}>{th}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="field-label">Address Details <span style={{ color:'#f87171' }}>*</span></label>
                      <textarea name="details" value={form.details} onChange={handleChange}
                        placeholder="House no, road, area, landmark..." rows={3}
                        className="inp-focus"
                        style={{ ...inp('details'), resize:'none', lineHeight:1.6 }}/>
                      {errors.details && <p style={{ fontSize:11,color:'#ef4444',marginTop:5 }}>{errors.details}</p>}
                    </div>
                  </div>
                </div>

                {/* ── PAYMENT METHOD ── */}
                <div className="section-card fade-up" style={{ animationDelay:'80ms' }}>
                  <div className="card-header">
                    <div className="card-header-icon">💳</div>
                    <div>
                      <h3 style={{ fontSize:15,fontWeight:800,color:'#0f172a' }}>Payment Method</h3>
                      <p style={{ fontSize:12,color:'#64748b',marginTop:2 }}>Choose how you'd like to pay</p>
                    </div>
                  </div>
                  <div className="card-body" style={{ display:'flex',flexDirection:'column',gap:10 }}>
                    {PAYMENT_METHODS.map(m => (
                      <div key={m.value} className={`pay-option ${paymentMethod===m.value?'selected':''}`}
                           onClick={()=>setPaymentMethod(m.value)}>
                        <div className={`pay-radio ${paymentMethod===m.value?'checked':''}`}/>
                        <span style={{ fontSize:26 }}>{m.icon}</span>
                        <div style={{ flex:1 }}>
                          <p style={{ fontWeight:700,fontSize:14,color:'#0f172a' }}>{m.label}</p>
                          <p style={{ fontSize:12,color:'#94a3b8',marginTop:2 }}>{m.desc}</p>
                        </div>
                        {paymentMethod===m.value && (
                          <div style={{ width:22,height:22,borderRadius:'50%',background:'linear-gradient(135deg,#3b82f6,#1d4ed8)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                            <span style={{ color:'#fff',fontSize:11,fontWeight:800 }}>✓</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ══ RIGHT: ORDER SUMMARY ══ */}
              <div style={{ width:290,flexShrink:0 }}>
                <div className="summary-card fade-up" style={{ animationDelay:'40ms' }}>

                  <div className="summary-head">
                    <p style={{ fontSize:11,fontWeight:700,letterSpacing:'.16em',color:'rgba(191,219,254,.8)',textTransform:'uppercase',marginBottom:5 }}>Your Order</p>
                    <h3 className="serif" style={{ fontSize:21,color:'#fff',fontWeight:400 }}>Order Summary</h3>
                  </div>

                  <div className="summary-body">

                    {/* items */}
                    <div style={{ display:'flex',flexDirection:'column',gap:12,marginBottom:16,maxHeight:220,overflowY:'auto' }}>
                      {cart?.items.map(item => (
                        <div key={item._id} style={{ display:'flex',gap:10,alignItems:'center' }}>
                          <div style={{ width:46,height:46,borderRadius:12,overflow:'hidden',background:'#eef4ff',border:'1.5px solid #dbeafe',flexShrink:0 }}>
                            {item.image
                              ? <img src={item.image} alt={item.name} style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                              : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20 }}>🌿</div>
                            }
                          </div>
                          <div style={{ flex:1,minWidth:0 }}>
                            <p style={{ fontWeight:700,fontSize:13,color:'#0f172a',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{item.name}</p>
                            <p style={{ fontSize:11,color:'#94a3b8',marginTop:2 }}>{item.quantity} × ৳{item.price}</p>
                          </div>
                          <span style={{ fontWeight:800,fontSize:13,color:'#1d4ed8',flexShrink:0 }}>৳{(item.price*item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    {/* divider */}
                    <div style={{ height:1,background:'linear-gradient(90deg,#dbeafe,#bfdbfe 50%,transparent)',marginBottom:14 }}/>

                    {/* subtotal rows */}
                    <div style={{ display:'flex',flexDirection:'column',gap:9,marginBottom:14 }}>
                      <div style={{ display:'flex',justifyContent:'space-between',fontSize:13 }}>
                        <span style={{ color:'#64748b' }}>Subtotal</span>
                        <span style={{ fontWeight:700,color:'#334155' }}>৳{cart?.totalAmount?.toFixed(2)}</span>
                      </div>
                      <div style={{ display:'flex',justifyContent:'space-between',fontSize:13 }}>
                        <span style={{ color:'#64748b' }}>Delivery</span>
                        <span style={{ fontWeight:700,color:'#059669' }}>To be confirmed</span>
                      </div>
                    </div>

                    {/* total box */}
                    <div style={{ background:'linear-gradient(135deg,#eff6ff,#dbeafe)',border:'1.5px solid #bfdbfe',borderRadius:14,padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18 }}>
                      <span style={{ fontWeight:800,fontSize:14,color:'#1e293b' }}>Total</span>
                      <span className="serif" style={{ fontSize:24,color:'#1d4ed8' }}>৳{cart?.totalAmount?.toFixed(2)}</span>
                    </div>

                    {/* ── COMBO RESTRICTION BANNER ── */}
                    {isCheckoutBlocked && (
                      <div style={{
                        background: 'linear-gradient(135deg,#fff7ed,#ffedd5)',
                        border: '1.5px solid #fed7aa',
                        borderRadius: 14,
                        padding: '14px 16px',
                        marginBottom: 14,
                      }}>
                        <div style={{ display:'flex',gap:10,alignItems:'flex-start' }}>
                          <span style={{ fontSize:20,flexShrink:0,lineHeight:1 }}>🎁</span>
                          <div>
                            <p style={{ fontWeight:800,fontSize:13,color:'#c2410c',marginBottom:4 }}>
                              Combo Package Required This Month
                            </p>
                            <p style={{ fontSize:12,color:'#9a3412',lineHeight:1.5 }}>
                              Our policy requires you to purchase a <strong>Combo Package</strong> before
                              buying individual products in the same month.
                            </p>
                          </div>
                        </div>

                        {/* Combo Suggestions */}
                        {suggestedCombos.length > 0 && (
                          <div style={{ marginTop: 12 }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: '#c2410c', textTransform: 'uppercase', marginBottom: 6 }}>
                              Suggested Combos:
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {suggestedCombos.map(combo => {
                                const price = combo.discountedPrice ?? combo.totalPrice;
                                return (
                                  <div key={combo._id}
                                    onClick={() => navigate(`/combo/${combo._id}`)}
                                    style={{
                                    background: '#fff', borderRadius: 8, padding: 8,
                                    display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #fed7aa', cursor: 'pointer'
                                  }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 6, overflow: 'hidden', background: '#ffe4e6', flexShrink: 0 }}>
                                      {combo.image?.url ? <img src={combo.image.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}>📦</div>}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <p style={{ fontSize: 12, fontWeight: 700, color: '#9a3412', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{combo.name}</p>
                                      <p style={{ fontSize: 13, fontWeight: 800, color: '#ea580c' }}>৳{price}</p>
                                    </div>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleQuickAddCombo(combo); }}
                                      style={{
                                        background: '#ea580c', color: '#fff', fontSize: 11, fontWeight: 700,
                                        padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', flexShrink: 0
                                      }}>
                                      Add & Unlock
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                            <div style={{ textAlign: 'center', marginTop: 10 }}>
                              <a href="/combos"
                                style={{ display:'inline-block', fontSize:12, fontWeight:700, color:'#ea580c', textDecoration:'underline' }}>
                                View All Combo Packages
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* place order btn */}
                    <button className="place-btn" onClick={handlePlaceOrder}
                      disabled={placing || isCheckoutBlocked || comboCheck.loading}>
                      {placing
                        ? <span style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:10 }}>
                            <span style={{ width:16,height:16,border:'2.5px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite',display:'inline-block' }}/>
                            Placing Order…
                          </span>
                        : isCheckoutBlocked
                          ? '🔒 Buy a Combo First'
                          : '✓ Place Order'
                      }
                    </button>


                    {/* trust badges */}
                    <div style={{ display:'flex',gap:8,marginTop:14 }}>
                      {[{i:'🔒',l:'Secure'},{i:'↩️',l:'Returns'},{i:'✓',l:'Verified'}].map(b=>(
                        <div key={b.l} style={{ flex:1,background:'#f0f7ff',border:'1.5px solid #dbeafe',borderRadius:10,padding:'7px 4px',textAlign:'center' }}>
                          <div style={{ fontSize:14,marginBottom:2 }}>{b.i}</div>
                          <div style={{ fontSize:9,fontWeight:700,color:'#3b5280',letterSpacing:'.05em' }}>{b.l}</div>
                        </div>
                      ))}
                    </div>

                    <p style={{ fontSize:11,color:'#94a3b8',textAlign:'center',marginTop:14,lineHeight:1.5 }}>
                      By placing this order, you agree to our{' '}
                      <Link to="/terms" style={{ color:'#2563eb',textDecoration:'none',fontWeight:600 }}>Terms of Service</Link>
                    </p>
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