import React, { useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const OrderSuccess = () => {
  const location = useLocation();
  const { state } = location;
  const canvasRef = useRef(null);

  /* ── confetti animation ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#3b82f6','#0ea5e9','#60a5fa','#93c5fd','#38bdf8','#1d4ed8','#bfdbfe','#7dd3fc'];
    const pieces = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      w: Math.random() * 10 + 4,
      h: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: Math.random() * 3 + 1.5,
      angle: Math.random() * 360,
      spin: (Math.random() - 0.5) * 4,
      opacity: Math.random() * 0.6 + 0.4,
    }));

    let frame;
    let elapsed = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      elapsed++;
      pieces.forEach(p => {
        p.y    += p.speed;
        p.angle += p.spin;
        p.x    += Math.sin(p.angle * 0.02) * 0.8;
        if (p.y > canvas.height) { p.y = -20; p.x = Math.random() * canvas.width; }
        ctx.save();
        ctx.globalAlpha = elapsed > 160 ? Math.max(0, p.opacity - (elapsed - 160) / 80) : p.opacity;
        ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
        ctx.rotate(p.angle * Math.PI / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (elapsed < 240) frame = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, []);

  const totalAmount = state?.orders?.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const isPending = state?.paymentGatewayUrl;

  return (
    <>
      <Navbar />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
        .os * { box-sizing: border-box; margin: 0; padding: 0; }
        .os { font-family: 'DM Sans', sans-serif; background: #f2f7ff; min-height: 100vh; }
        .serif { font-family: 'DM Serif Display', serif; }

        @keyframes popIn {
          0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
          70%  { transform: scale(1.15) rotate(3deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: .6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .check-icon {
          width: 96px; height: 96px; border-radius: 50%;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto; position: relative;
          box-shadow: 0 12px 32px rgba(34,197,94,.35);
          animation: popIn .6s cubic-bezier(.22,.68,0,1.2) both;
        }
        .check-icon::before {
          content: ''; position: absolute; inset: -8px; border-radius: 50%;
          border: 3px solid rgba(34,197,94,.4);
          animation: pulse-ring 1.4s ease-out .6s infinite;
        }

        .main-card {
          background: rgba(255,255,255,0.95);
          border: 1.5px solid #e0eeff;
          border-radius: 28px;
          max-width: 500px;
          margin: 0 auto;
          overflow: hidden;
          box-shadow: 0 24px 64px rgba(29,78,216,.12), 0 4px 16px rgba(29,78,216,.06);
          animation: fadeUp .5s ease .2s both;
        }

        .order-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 11px 0;
          border-bottom: 1px dashed #e0eeff;
          font-size: 13px;
        }
        .order-row:last-child { border-bottom: none; }

        .action-btn {
          width: 100%; padding: 14px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          font-size: 14px; font-weight: 700; font-family: 'DM Sans', sans-serif;
          cursor: pointer; border: none; text-decoration: none;
          transition: all .22s;
        }
        .btn-primary {
          background: linear-gradient(135deg, #1d4ed8, #2563eb 60%, #0ea5e9);
          color: #fff;
          box-shadow: 0 6px 20px rgba(29,78,216,.3);
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(29,78,216,.42); }
        .btn-secondary {
          background: #f0f7ff; border: 1.5px solid #dbeafe; color: #1d4ed8;
        }
        .btn-secondary:hover { background: #dbeafe; }
        .btn-ghost { background: #f8fffe; border: 1.5px solid #a7f3d0; color: #059669; }
        .btn-ghost:hover { background: #ecfdf5; }

        .step-done   { background: linear-gradient(135deg,#22c55e,#16a34a); color:#fff; }
        .step-active { background: linear-gradient(135deg,#3b82f6,#1d4ed8); color:#fff; }
        .step-idle   { background: #e0eeff; color:#93c5fd; }
      `}</style>

      {/* confetti canvas */}
      <canvas ref={canvasRef} style={{ position:'fixed',top:0,left:0,pointerEvents:'none',zIndex:999 }}/>

      <div className="os">

        {/* ── background blobs ── */}
        <div style={{ position:'fixed',top:'10%',left:'5%',width:300,height:300,borderRadius:'50%',background:'radial-gradient(circle,rgba(59,130,246,.07) 0%,transparent 70%)',pointerEvents:'none',zIndex:0 }}/>
        <div style={{ position:'fixed',bottom:'15%',right:'8%',width:240,height:240,borderRadius:'50%',background:'radial-gradient(circle,rgba(14,165,233,.06) 0%,transparent 70%)',pointerEvents:'none',zIndex:0 }}/>

        <div style={{ minHeight:'calc(100vh - 80px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'40px 20px',position:'relative',zIndex:1 }}>
          <div style={{ width:'100%',maxWidth:500 }}>

            {/* ── step tracker ── */}
            <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:0,marginBottom:28,animation:'fadeUp .4s ease both' }}>
              {[{n:1,l:'Cart'},{n:2,l:'Checkout'},{n:3,l:'Done'}].map((s,i)=>(
                <React.Fragment key={s.n}>
                  <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:5 }}>
                    <div className={s.n<3?'step-done':s.n===3?'step-active':'step-idle'}
                         style={{ width:32,height:32,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800 }}>
                      {s.n<3?'✓':s.n}
                    </div>
                    <span style={{ fontSize:11,fontWeight:700,color:s.n===3?'#2563eb':s.n<3?'#16a34a':'#94a3b8' }}>{s.l}</span>
                  </div>
                  {i<2 && <div style={{ width:48,height:2,background:s.n<3?'linear-gradient(90deg,#22c55e,#3b82f6)':'#e0eeff',margin:'0 8px',marginBottom:20,flexShrink:0 }}/>}
                </React.Fragment>
              ))}
            </div>

            {/* ── main card ── */}
            <div className="main-card">

              {/* top gradient band */}
              <div style={{ height:6,background:'linear-gradient(90deg,#22c55e,#3b82f6,#0ea5e9)' }}/>

              <div style={{ padding:'36px 32px 32px',textAlign:'center' }}>

                {/* check icon */}
                <div style={{ marginBottom:24 }}>
                  <div className="check-icon">
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                </div>

                {/* heading */}
                <h2 className="serif" style={{ fontSize:32,color:'#0f172a',marginBottom:10,animation:'fadeUp .4s ease .3s both',opacity:0,animationFillMode:'forwards' }}>
                  {isPending ? 'Order Placed!' : 'Order Confirmed!'}
                </h2>
                <p style={{ fontSize:14,color:'#64748b',lineHeight:1.7,marginBottom:28,animation:'fadeUp .4s ease .4s both',opacity:0,animationFillMode:'forwards' }}>
                  {isPending
                    ? 'Your items are ready. Please complete your payment to finalize the order.'
                    : "Thank you for your purchase! We've received your order and it's currently being processed."}
                </p>

                {/* order summary box */}
                {state?.orders && (
                  <div style={{ background:'linear-gradient(135deg,#f8fbff,#eff6ff)',border:'1.5px solid #dbeafe',borderRadius:16,padding:'16px 20px',marginBottom:24,textAlign:'left',animation:'fadeUp .4s ease .5s both',opacity:0,animationFillMode:'forwards' }}>
                    <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:12 }}>
                      <div style={{ width:28,height:28,borderRadius:8,background:'linear-gradient(135deg,#3b82f6,#1d4ed8)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13 }}>📦</div>
                      <span style={{ fontWeight:800,fontSize:13,color:'#0f172a' }}>Order Summary</span>
                    </div>
                    <div style={{ height:1,background:'linear-gradient(90deg,#dbeafe,transparent)',marginBottom:12 }}/>
                    {state.orders.map((order,idx)=>(
                      <div key={idx} className="order-row">
                        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                          <span style={{ fontSize:11,fontWeight:700,color:'#93c5fd',background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:6,padding:'2px 7px' }}>
                            #{order._id.substring(order._id.length - 6).toUpperCase()}
                          </span>
                        </div>
                        <span style={{ fontWeight:800,color:'#1d4ed8',fontSize:14 }}>৳{order.totalAmount}</span>
                      </div>
                    ))}
                    {totalAmount > 0 && (
                      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:10,paddingTop:10,borderTop:'1.5px solid #dbeafe' }}>
                        <span style={{ fontWeight:700,fontSize:13,color:'#334155' }}>Total Paid</span>
                        <span className="serif" style={{ fontSize:22,color:'#1d4ed8' }}>৳{totalAmount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* delivery info pills */}
                <div style={{ display:'flex',gap:8,marginBottom:24,animation:'fadeUp .4s ease .55s both',opacity:0,animationFillMode:'forwards' }}>
                  {[{i:'🚚',l:'Processing'},{i:'📍',l:'On the way'},{i:'✅',l:'Delivered'}].map((s,idx)=>(
                    <div key={s.l} style={{ flex:1,background:idx===0?'linear-gradient(135deg,#eff6ff,#dbeafe)':'#f8fafc',border:`1.5px solid ${idx===0?'#bfdbfe':'#e2e8f0'}`,borderRadius:12,padding:'10px 6px',textAlign:'center' }}>
                      <div style={{ fontSize:18,marginBottom:3 }}>{s.i}</div>
                      <div style={{ fontSize:10,fontWeight:700,color:idx===0?'#2563eb':'#94a3b8',letterSpacing:'.05em' }}>{s.l}</div>
                      {idx===0 && <div style={{ width:6,height:6,borderRadius:'50%',background:'#3b82f6',margin:'4px auto 0',animation:'spin 1.5s linear infinite',boxShadow:'0 0 0 2px #bfdbfe' }}/>}
                    </div>
                  ))}
                </div>

                {/* action buttons */}
                <div style={{ display:'flex',flexDirection:'column',gap:10,animation:'fadeUp .4s ease .6s both',opacity:0,animationFillMode:'forwards' }}>
                  {isPending && (
                    <a href={state.paymentGatewayUrl} className="action-btn btn-primary">
                      💳 Complete Payment Now
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </a>
                  )}
                  <Link to="/my-orders" className="action-btn btn-secondary">
                    🚚 Track My Orders
                  </Link>
                  <Link to="/shop" className="action-btn btn-ghost">
                    🛍️ Continue Shopping
                  </Link>
                </div>
              </div>
            </div>

            {/* bottom note */}
            <p style={{ textAlign:'center',fontSize:12,color:'#94a3b8',marginTop:20,animation:'fadeUp .4s ease .7s both',opacity:0,animationFillMode:'forwards' }}>
              A confirmation has been sent to your account. Questions? <Link to="/about" style={{ color:'#2563eb',fontWeight:600,textDecoration:'none' }}>Contact us</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderSuccess;