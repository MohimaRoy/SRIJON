import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const STATUS_CONFIG = {
  pending:   { icon:'⏳', label:'Pending',   bg:'#fff7ed', color:'#c2410c', border:'#fed7aa', dot:'#f97316' },
  confirmed: { icon:'📦', label:'Confirmed', bg:'#eff6ff', color:'#1d4ed8', border:'#bfdbfe', dot:'#3b82f6' },
  shipped:   { icon:'🚚', label:'Shipped',   bg:'#f5f3ff', color:'#6d28d9', border:'#ddd6fe', dot:'#8b5cf6' },
  delivered: { icon:'✅', label:'Delivered', bg:'#f0fdf4', color:'#15803d', border:'#bbf7d0', dot:'#22c55e' },
  cancelled: { icon:'❌', label:'Cancelled', bg:'#fff1f2', color:'#be123c', border:'#fecdd3', dot:'#f43f5e' },
};

const STEPS = ['pending','confirmed','shipped','delivered'];

export default function OrderTracking() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    axios.get('/api/orders/my-orders', { withCredentials: true })
      .then(res => setOrders(res.data.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <>
      <Navbar />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
        .mo * { box-sizing: border-box; margin: 0; padding: 0; }
        .mo { font-family: 'DM Sans', sans-serif; background: #f2f7ff; min-height: 100vh; }
        .serif { font-family: 'DM Serif Display', serif; }

        .shimmer { background: linear-gradient(90deg,#e8f0fe 25%,#dbeafe 50%,#e8f0fe 75%); background-size:200% 100%; animation: sh 1.4s infinite linear; border-radius:10px; }
        @keyframes sh { 0%{background-position:200% 0}100%{background-position:-200% 0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }

        .order-card {
          background: #fff;
          border: 1.5px solid #e0eeff;
          border-radius: 22px;
          overflow: hidden;
          transition: box-shadow .25s, transform .25s;
          animation: fadeUp .4s ease both;
        }
        .order-card:hover { box-shadow: 0 12px 36px rgba(29,78,216,.1); transform: translateY(-2px); }

        .card-header {
          background: linear-gradient(135deg, #f0f7ff, #e8f3ff);
          border-bottom: 1.5px solid #e0eeff;
          padding: 16px 22px;
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
          cursor: pointer; user-select: none;
        }
        .card-header:hover { background: linear-gradient(135deg,#e8f3ff,#dbeafe); }

        .status-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 14px; border-radius: 999px; font-size: 12px; font-weight: 700;
          border: 1.5px solid;
        }

        .item-row {
          display: flex; align-items: center; gap: 14px;
          padding: 12px 0; border-bottom: 1px dashed #e0eeff;
        }
        .item-row:last-child { border-bottom: none; }

        .progress-step { display: flex; flex-direction: column; align-items: center; gap: 5px; flex: 1; }
        .progress-dot {
          width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 800; border: 2px solid transparent;
          transition: all .3s;
        }
        .progress-line { height: 3px; flex: 1; border-radius: 999px; margin-bottom: 18px; transition: background .3s; }
      `}</style>

      <div className="mo">

        {/* ── HERO ── */}
        <div style={{ background:'linear-gradient(135deg,#0f172a 0%,#1e3a8a 50%,#1d4ed8 100%)', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute',top:-70,right:-70,width:320,height:320,borderRadius:'50%',background:'radial-gradient(circle,rgba(96,165,250,.18) 0%,transparent 70%)',pointerEvents:'none' }}/>
          <div style={{ position:'absolute',inset:0,backgroundImage:'repeating-linear-gradient(45deg,rgba(255,255,255,.025) 0px,rgba(255,255,255,.025) 1px,transparent 1px,transparent 14px)',pointerEvents:'none' }}/>
          <div style={{ maxWidth:960,margin:'0 auto',padding:'44px 24px 48px',position:'relative',zIndex:10,display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:14 }}>
            <div>
              <p style={{ fontSize:11,fontWeight:700,letterSpacing:'.2em',color:'#93c5fd',marginBottom:8,textTransform:'uppercase' }}>Account</p>
              <h1 className="serif" style={{ fontSize:'clamp(1.8rem,4vw,2.8rem)',color:'#fff',lineHeight:1.1 }}>
                My Orders
              </h1>
              <p style={{ color:'#94a3b8',marginTop:8,fontSize:14 }}>Track and manage all your purchases</p>
            </div>
            {!loading && (
              <div style={{ background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.15)',borderRadius:16,padding:'12px 22px',textAlign:'center',backdropFilter:'blur(8px)' }}>
                <div className="serif" style={{ fontSize:26,color:'#fff',lineHeight:1 }}>{orders.length}</div>
                <div style={{ fontSize:10,color:'#93c5fd',fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',marginTop:4 }}>Total Orders</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ maxWidth:960,margin:'0 auto',padding:'32px 24px 80px' }}>

          {/* loading */}
          {loading ? (
            <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
              {[...Array(3)].map((_,i)=>(
                <div key={i} style={{ background:'#fff',border:'1.5px solid #e0eeff',borderRadius:22,overflow:'hidden' }}>
                  <div className="shimmer" style={{ height:64,borderRadius:0 }}/>
                  <div style={{ padding:22,display:'flex',gap:16 }}>
                    <div style={{ flex:2,display:'flex',flexDirection:'column',gap:12 }}>
                      <div className="shimmer" style={{ height:13,width:'40%' }}/>
                      {[...Array(2)].map((_,j)=>(
                        <div key={j} style={{ display:'flex',gap:12,alignItems:'center' }}>
                          <div className="shimmer" style={{ width:52,height:52,borderRadius:12,flexShrink:0 }}/>
                          <div style={{ flex:1,display:'flex',flexDirection:'column',gap:8 }}>
                            <div className="shimmer" style={{ height:13,width:'60%' }}/>
                            <div className="shimmer" style={{ height:11,width:'35%' }}/>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ flex:1,display:'flex',flexDirection:'column',gap:10 }}>
                      {[...Array(3)].map((_,j)=><div key={j} className="shimmer" style={{ height:13,width:`${65-j*12}%` }}/>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          ) : orders.length === 0 ? (
            /* empty */
            <div style={{ textAlign:'center',padding:'64px 24px',background:'#fff',borderRadius:28,border:'1.5px solid #e0eeff',boxShadow:'0 4px 24px rgba(29,78,216,.07)' }}>
              <div style={{ width:96,height:96,borderRadius:28,margin:'0 auto 22px',background:'linear-gradient(135deg,#dbeafe,#bfdbfe)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:44 }}>📦</div>
              <h3 className="serif" style={{ fontSize:26,color:'#0f172a',marginBottom:10 }}>No orders yet</h3>
              <p style={{ color:'#94a3b8',fontSize:14,marginBottom:24 }}>You haven't placed any orders. Start shopping!</p>
              <Link to="/shop" style={{ display:'inline-block',padding:'13px 36px',borderRadius:14,background:'linear-gradient(135deg,#1d4ed8,#2563eb)',color:'#fff',fontWeight:800,fontSize:14,textDecoration:'none',boxShadow:'0 6px 20px rgba(37,99,235,.35)' }}>
                Browse Products →
              </Link>
            </div>

          ) : (
            <div style={{ display:'flex',flexDirection:'column',gap:16 }}>

              {/* section label */}
              <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:4 }}>
                <div style={{ height:2,flex:1,background:'linear-gradient(90deg,#3b82f6,transparent)' }}/>
                <span style={{ fontSize:11,fontWeight:800,letterSpacing:'.16em',color:'#3b82f6',textTransform:'uppercase' }}>Order History</span>
                <div style={{ height:2,flex:1,background:'linear-gradient(90deg,transparent,#3b82f6)' }}/>
              </div>

              {orders.map((order, oidx) => {
                const sc      = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.pending;
                const isOpen  = expanded[order._id] !== false; // default open
                const stepIdx = STEPS.indexOf(order.orderStatus);
                const isCancelled = order.orderStatus === 'cancelled';

                return (
                  <div key={order._id} className="order-card" style={{ animationDelay:`${oidx*60}ms` }}>

                    {/* ── CARD HEADER ── */}
                    <div className="card-header" onClick={() => toggle(order._id)}>
                      <div style={{ display:'flex',alignItems:'center',gap:14 }}>
                        {/* status icon circle */}
                        <div style={{ width:44,height:44,borderRadius:14,background:sc.bg,border:`1.5px solid ${sc.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0 }}>
                          {sc.icon}
                        </div>
                        <div>
                          <p style={{ fontSize:10,fontWeight:700,letterSpacing:'.14em',color:'#93c5fd',textTransform:'uppercase',marginBottom:3 }}>Order ID</p>
                          <p style={{ fontWeight:800,fontSize:15,color:'#0f172a',letterSpacing:'.02em' }}>
                            #{order._id.substring(order._id.length - 8).toUpperCase()}
                          </p>
                          <p style={{ fontSize:11,color:'#94a3b8',marginTop:1 }}>
                            {order.products?.length} item{order.products?.length !== 1 ? 's' : ''} · {new Date(order.createdAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
                          </p>
                        </div>
                      </div>

                      <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                        <span className="status-badge" style={{ background:sc.bg,color:sc.color,borderColor:sc.border }}>
                          <span style={{ width:7,height:7,borderRadius:'50%',background:sc.dot,display:'inline-block',animation:order.orderStatus==='pending'?'pulse 1.5s infinite':undefined }}/>
                          {sc.label}
                        </span>
                        <div style={{ color:'#93c5fd',fontSize:18,transition:'transform .2s',transform:isOpen?'rotate(180deg)':'rotate(0)' }}>⌄</div>
                      </div>
                    </div>

                    {/* ── EXPANDABLE BODY ── */}
                    {isOpen && (
                      <div>
                        {/* progress bar */}
                        {!isCancelled && (
                          <div style={{ padding:'18px 22px 0',background:'#f8fbff',borderBottom:'1.5px solid #e0eeff' }}>
                            <div style={{ display:'flex',alignItems:'center' }}>
                              {STEPS.map((step, si) => {
                                const done   = si <= stepIdx;
                                const active = si === stepIdx;
                                const sc2    = STATUS_CONFIG[step];
                                return (
                                  <React.Fragment key={step}>
                                    <div className="progress-step">
                                      <div className="progress-dot" style={{
                                        background: done ? `linear-gradient(135deg,#3b82f6,#1d4ed8)` : '#e0eeff',
                                        color: done ? '#fff' : '#94a3b8',
                                        boxShadow: active ? '0 0 0 4px rgba(59,130,246,.2)' : 'none',
                                        fontSize: 13,
                                      }}>
                                        {done ? '✓' : si + 1}
                                      </div>
                                      <span style={{ fontSize:10,fontWeight:700,color:done?'#1d4ed8':'#94a3b8',textTransform:'uppercase',letterSpacing:'.08em' }}>
                                        {sc2.label}
                                      </span>
                                    </div>
                                    {si < STEPS.length - 1 && (
                                      <div className="progress-line" style={{ background: si < stepIdx ? 'linear-gradient(90deg,#3b82f6,#0ea5e9)' : '#e0eeff' }}/>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div style={{ padding:'22px',display:'flex',gap:24,flexWrap:'wrap' }}>

                          {/* ── ITEMS ── */}
                          <div style={{ flex:2,minWidth:220 }}>
                            <p style={{ fontSize:11,fontWeight:800,letterSpacing:'.14em',color:'#3b82f6',textTransform:'uppercase',marginBottom:14 }}>Items Ordered</p>
                            {order.products.map((item, idx) => (
                              <div key={idx} className="item-row">
                                <div style={{ width:54,height:54,borderRadius:14,overflow:'hidden',background:'#eef4ff',border:'1.5px solid #dbeafe',flexShrink:0 }}>
                                  {item.image
                                    ? <img src={item.image} alt={item.name} style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                                    : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22 }}>📦</div>
                                  }
                                </div>
                                <div style={{ flex:1,minWidth:0 }}>
                                  <p style={{ fontWeight:700,fontSize:14,color:'#0f172a',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{item.name}</p>
                                  <p style={{ fontSize:12,color:'#94a3b8',marginTop:3 }}>Qty: {item.quantity} {item.unit}</p>
                                </div>
                                <span style={{ fontWeight:800,fontSize:15,color:'#1d4ed8',flexShrink:0 }}>৳{item.price * item.quantity}</span>
                              </div>
                            ))}
                          </div>

                          {/* ── PAYMENT INFO ── */}
                          <div style={{ flex:1,minWidth:160 }}>
                            <p style={{ fontSize:11,fontWeight:800,letterSpacing:'.14em',color:'#3b82f6',textTransform:'uppercase',marginBottom:14 }}>Payment Info</p>

                            <div style={{ display:'flex',flexDirection:'column',gap:10,marginBottom:16 }}>
                              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:13 }}>
                                <span style={{ color:'#64748b' }}>Method</span>
                                <span style={{ fontWeight:700,color:'#0f172a',textTransform:'uppercase',fontSize:12,background:'#f0f7ff',border:'1px solid #dbeafe',borderRadius:6,padding:'2px 8px' }}>{order.paymentMethod}</span>
                              </div>
                              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:13 }}>
                                <span style={{ color:'#64748b' }}>Status</span>
                                <span style={{ fontWeight:700,fontSize:12,
                                  color: order.paymentStatus==='completed'?'#15803d':'#c2410c',
                                  background: order.paymentStatus==='completed'?'#f0fdf4':'#fff7ed',
                                  border: `1px solid ${order.paymentStatus==='completed'?'#bbf7d0':'#fed7aa'}`,
                                  borderRadius:6,padding:'2px 8px',textTransform:'capitalize',
                                }}>
                                  {order.paymentStatus}
                                </span>
                              </div>
                            </div>

                            {/* total box */}
                            <div style={{ background:'linear-gradient(135deg,#eff6ff,#dbeafe)',border:'1.5px solid #bfdbfe',borderRadius:14,padding:'12px 16px',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                              <span style={{ fontWeight:800,fontSize:13,color:'#1e293b' }}>Total</span>
                              <span className="serif" style={{ fontSize:22,color:'#1d4ed8' }}>৳{order.totalAmount}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}