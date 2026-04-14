import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  FaEnvelope, FaLock, FaUserShield, FaPhone, FaGoogle, FaArrowLeft, FaExclamationTriangle,
} from 'react-icons/fa';
import { GoogleLogin } from '@react-oauth/google';
import { isFirebaseConfigured, firebaseConfig } from '../config/firebase';

/* ─── Shared style helper ────────────────────────────────── */
const inputCls = (ring = 'focus:ring-blue-500') =>
  `w-full py-3.5 px-4 pl-11 rounded-xl border border-slate-200 bg-slate-50 text-slate-900
   focus:bg-white focus:ring-2 ${ring} focus:border-transparent outline-none transition-all duration-200`;

const isGoogleConfigured = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

/* ─── Method option cards definition ────────────────────── */
const METHOD_CARDS = [
  {
    id: 'email',
    label: 'Email & Password',
    sub: 'Login with your email address',
    icon: <FaEnvelope className="text-xl" />,
    color: { outer: 'hover:border-blue-500 hover:bg-blue-50', icon: 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' },
    available: true,
  },
  {
    id: 'google',
    label: 'Gmail / Google Account',
    sub: isGoogleConfigured ? 'Login securely with Google OAuth' : 'Requires VITE_GOOGLE_CLIENT_ID in .env',
    icon: <FaGoogle className="text-xl" />,
    color: { outer: 'hover:border-red-400 hover:bg-red-50', icon: 'bg-red-100 text-red-500 group-hover:bg-red-500 group-hover:text-white' },
    available: isGoogleConfigured,
  },
  {
    id: 'phone',
    label: 'Mobile Number (OTP)',
    sub: isFirebaseConfigured ? 'Login via SMS verification code' : 'Requires Firebase config in .env',
    icon: <FaPhone className="text-xl" />,
    color: { outer: 'hover:border-green-500 hover:bg-green-50', icon: 'bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white' },
    available: isFirebaseConfigured,
  },
];

/* ─── Left decorative panel (shared) ─────────────────────── */
function LeftPanel({ children }) {
  return (
    <div className="md:w-1/2 bg-slate-900 relative p-12 flex flex-col justify-between overflow-hidden text-white">
      <div className="absolute inset-0 opacity-[0.06]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: '200px 200px',
      }} />
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-overlay blur-3xl opacity-20" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-overlay blur-3xl opacity-20" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/* ─── 3-option Method Picker ─────────────────────────────── */
function MethodPicker({ onSelect }) {
  return (
    <div className="space-y-3">
      {METHOD_CARDS.map((m) => (
        <button
          key={m.id}
          id={`btn-auth-${m.id}`}
          onClick={() => m.available && onSelect(m.id)}
          disabled={!m.available}
          title={!m.available ? `Add credentials to your .env to enable this` : ''}
          className={`w-full flex items-center gap-4 px-5 py-4 border-2 rounded-2xl group transition-all duration-200
            ${m.available
              ? `border-slate-200 cursor-pointer ${m.color.outer}`
              : 'border-slate-100 bg-slate-50 cursor-not-allowed opacity-60'
            }`}
        >
          <span className={`p-3 rounded-xl transition-all flex-shrink-0 ${m.available ? m.color.icon : 'bg-slate-200 text-slate-400'}`}>
            {m.icon}
          </span>
          <div className="text-left flex-1">
            <p className="font-bold text-slate-800 text-sm flex items-center gap-2">
              {m.label}
              {!m.available && <span className="text-xs font-normal bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Setup Required</span>}
            </p>
            <p className="text-slate-500 text-xs mt-0.5">{m.sub}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

/* ─── "Not Configured" info box ──────────────────────────── */
function NotConfiguredBox({ type }) {
  const info = type === 'google'
    ? { color: 'red', key: 'VITE_GOOGLE_CLIENT_ID', link: 'https://console.cloud.google.com', label: 'Google Cloud Console' }
    : { color: 'green', key: 'VITE_FIREBASE_*', link: 'https://console.firebase.google.com', label: 'Firebase Console' };

  return (
    <div className={`rounded-2xl border-2 border-${info.color}-100 bg-${info.color}-50 p-6 space-y-4`}>
      <div className="flex items-center gap-3">
        <div className={`bg-${info.color}-100 p-3 rounded-xl`}>
          <FaExclamationTriangle className={`text-${info.color}-500 text-xl`} />
        </div>
        <div>
          <p className="font-bold text-slate-800 text-sm">Setup Required</p>
          <p className="text-slate-500 text-xs">This login method needs configuration</p>
        </div>
      </div>
      <div className="bg-white rounded-xl p-4 border border-slate-200 text-xs font-mono text-slate-600 space-y-1">
        <p className="text-slate-400 font-sans font-semibold mb-2">Add to your <code className="bg-slate-100 px-1 rounded">frontend/.env</code> file:</p>
        <p className="text-blue-600">{info.key}=your_value_here</p>
      </div>
      <a href={info.link} target="_blank" rel="noreferrer"
        className={`block text-center py-2.5 rounded-xl bg-${info.color}-600 text-white font-semibold text-sm hover:bg-${info.color}-500 transition-all`}>
        Get credentials from {info.label} →
      </a>
    </div>
  );
}

/* ─── Reusable Phone OTP form ────────────────────────────── */
function PhoneForm({ containerId, onSuccess }) {
  const [phone, setPhone]  = useState('');
  const [otp, setOtp]      = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]  = useState('');

  const initFirebase = async () => {
    const { initializeApp, getApps } = await import('firebase/app');
    const { getAuth, RecaptchaVerifier } = await import('firebase/auth');
    if (!getApps().length) initializeApp(firebaseConfig);
    const auth = getAuth();
    
    // Clear existing reCAPTCHA instance to prevent reuse on different DOM elements
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) { }
      window.recaptchaVerifier = null;
    }
    
    // Hard reset the container DOM content to remove any hidden iframe injections
    const containerNode = document.getElementById(containerId);
    if (containerNode) {
       containerNode.innerHTML = '';
    }

    // Remove lingering reCAPTCHA DOM elements generated by previous instances
    document.querySelectorAll('.grecaptcha-badge').forEach(el => el.remove());

    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, { size: 'invisible' });
    return auth;
  };

  const handleSend = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    let formattedPhone = phone;
    if (!formattedPhone.startsWith('+')) {
      // Assuming Bangladesh or user just missed the '+'
      formattedPhone = formattedPhone.startsWith('880') ? '+' + formattedPhone : '+88' + formattedPhone;
      setPhone(formattedPhone); // Update visual representation
    }

    try {
      const auth = await initFirebase();
      const { signInWithPhoneNumber } = await import('firebase/auth');
      const res = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      setConfirmation(res); setShowOtp(true);
    } catch (err) {
      console.error("Firebase Phone Auth Error:", err);
      // Give a more descriptive error based on the thrown standard errors
      if (err.code === 'auth/invalid-phone-number') {
         setError('Invalid phone number format. Check number and country code.');
      } else if (err.code === 'auth/billing-not-enabled') {
         setError('Firebase SMS is currently unavailable (Billing not enabled).');
      } else {
         setError(err.message || 'OTP send failed. Please try again.');
      }
      
      // Reset so it can be completely recreated on next try
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch(e) {}
        window.recaptchaVerifier = null;
      }
    }
    setLoading(false);
  };

  const handleVerify = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await confirmation.confirm(otp);
      const idToken = await res.user.getIdToken();
      await onSuccess(idToken);
    } catch { setError('Invalid OTP. Please try again.'); }
    setLoading(false);
  };

  return (
    <form onSubmit={showOtp ? handleVerify : handleSend} className="space-y-4">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {!showOtp ? (
        <>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mobile Number</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FaPhone className="text-slate-400 group-focus-within:text-green-600 transition-colors" />
              </div>
              <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+8801XXXXXXXXX" className={inputCls('focus:ring-green-500')} />
            </div>
            <p className="text-xs text-slate-400 mt-1.5">Include country code (e.g. +880 for Bangladesh)</p>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-xl bg-green-600 text-white font-bold text-base hover:bg-green-500 transition-all transform hover:-translate-y-0.5 shadow-lg shadow-green-500/30 disabled:opacity-60">
            {loading ? 'Sending OTP…' : 'Send OTP'}
          </button>
        </>
      ) : (
        <>
          <div className="text-center text-sm text-slate-600 bg-green-50 border border-green-200 rounded-xl p-3">
            OTP sent to <span className="font-bold text-green-700">{phone}</span>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Enter 6-digit OTP</label>
            <input type="text" required value={otp} maxLength="6" onChange={e => setOtp(e.target.value)}
              placeholder="0  0  0  0  0  0"
              className="w-full px-4 py-4 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-900 text-center tracking-widest text-2xl font-bold focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-xl bg-green-600 text-white font-bold text-base hover:bg-green-500 transition-all transform hover:-translate-y-0.5 shadow-lg shadow-green-500/30 disabled:opacity-60">
            {loading ? 'Verifying…' : 'Verify & Sign In'}
          </button>
        </>
      )}
      <div id={containerId} />
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════
   LOGIN PAGE
═══════════════════════════════════════════════════════════ */
export function LoginPage() {
  const [params] = useSearchParams();
  const redirect = params.get('redirect');
  const [method, setMethod] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const { login, loginWithGoogle, loginWithPhone } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const go = (role) => {
    if (redirect) { navigate(redirect); return; }
    navigate(role === 'admin' ? '/manager/analytics' : '/');
  };
  const back = () => { setMethod(''); setError(''); };

  const handleEmail = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    const r = await login(formData.email, formData.password);
    if (r.success) go(r.user?.role); else setError(r.message);
    setLoading(false);
  };

  const handleGoogle = async (cred) => {
    setError(''); setLoading(true);
    const r = await loginWithGoogle(cred.credential);
    if (r.success) go(r.user?.role); else setError(r.message);
    setLoading(false);
  };

  const handlePhone = async (idToken) => {
    const r = await loginWithPhone(idToken);
    if (r.success) go(r.user?.role); else setError(r.message);
  };

  return (
    <>
      <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-slate-900 -z-10" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] -z-10" />

          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[620px] border border-slate-100">
            <LeftPanel>
              <div className="flex items-center gap-2 text-amber-500 mb-8">
                <FaUserShield className="text-2xl" />
                <span className="font-bold tracking-wider uppercase text-xs">Secure Portal Access</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Welcome back to <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">SRIJON.</span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed">
                {t('auth.login.missionStatement') || 'Sign in with any method you prefer.'}
              </p>
            </LeftPanel>

            <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
              <div className="max-w-sm mx-auto w-full">
                <h3 className="text-3xl font-bold text-slate-900 mb-1">Sign In</h3>
                <p className="text-slate-500 text-sm mb-8">Choose how you want to sign in.</p>

                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                    <span className="font-bold mr-1">Error:</span>{error}
                  </div>
                )}

                {method === '' && <MethodPicker onSelect={(m) => { setMethod(m); setError(''); }} />}

                {method !== '' && (
                  <div>
                    <button onClick={back} className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline mb-6">
                      <FaArrowLeft className="text-xs" /> Back to options
                    </button>

                    {/* ── Email ── */}
                    {method === 'email' && (
                      <form onSubmit={handleEmail} className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <FaEnvelope className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input name="email" type="email" required value={formData.email}
                              onChange={e => setFormData({...formData, email: e.target.value})}
                              placeholder="name@example.com" className={inputCls()} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1.5">
                            <label className="block text-sm font-semibold text-slate-700">Password</label>
                            <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline">Forgot password?</Link>
                          </div>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <FaLock className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input name="password" type="password" required value={formData.password}
                              onChange={e => setFormData({...formData, password: e.target.value})}
                              placeholder="••••••••" className={inputCls()} />
                          </div>
                        </div>
                        <button type="submit" disabled={loading}
                          className="w-full py-4 rounded-xl bg-amber-500 text-slate-900 font-bold text-base hover:bg-amber-400 transition-all transform hover:-translate-y-0.5 shadow-lg shadow-amber-500/30 disabled:opacity-60">
                          {loading ? 'Signing in…' : 'Sign In with Email'}
                        </button>
                      </form>
                    )}

                    {/* ── Google ── */}
                    {method === 'google' && (
                      isGoogleConfigured ? (
                        <div className="flex flex-col items-center py-8 px-4 bg-red-50 rounded-2xl border-2 border-red-100 space-y-5">
                          <div className="bg-white p-4 rounded-full shadow-md"><FaGoogle className="text-red-500 text-4xl" /></div>
                          <div className="text-center">
                            <p className="font-bold text-slate-800">Sign in with Google</p>
                            <p className="text-slate-500 text-sm mt-1">Click below to authenticate with your Gmail or Google account.</p>
                          </div>
                          {loading ? <p className="text-slate-500 text-sm">Authenticating…</p> : (
                            <GoogleLogin onSuccess={handleGoogle} onError={() => setError('Google login failed. Try again.')} useOneTap={false} />
                          )}
                        </div>
                      ) : <NotConfiguredBox type="google" />
                    )}

                    {/* ── Phone ── */}
                    {method === 'phone' && (
                      isFirebaseConfigured
                        ? <PhoneForm containerId="recaptcha-login" onSuccess={handlePhone} />
                        : <NotConfiguredBox type="phone" />
                    )}
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                  <p className="text-slate-500 text-sm">
                    {t('auth.login.noAccount') || "Don't have an account?"}{' '}
                    <Link to="/register" className="font-bold text-blue-600 hover:underline">Create an account</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   REGISTER PAGE
═══════════════════════════════════════════════════════════ */
export function RegisterPage() {
  const [params] = useSearchParams();
  const redirect = params.get('redirect');
  const [method, setMethod] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const { register, loginWithGoogle, loginWithPhone } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const back = () => { setMethod(''); setError(''); };

  const handleEmail = async (e) => {
    e.preventDefault(); setError('');
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match');
    if (formData.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    const r = await register(formData.name, formData.email, formData.password);
    if (r.success) navigate('/verify-otp', { state: { email: formData.email, redirect } });
    else setError(r.message);
    setLoading(false);
  };

  const handleGoogle = async (cred) => {
    setError(''); setLoading(true);
    const r = await loginWithGoogle(cred.credential);
    if (r.success) navigate(redirect || '/');
    else setError(r.message);
    setLoading(false);
  };

  const handlePhone = async (idToken) => {
    const r = await loginWithPhone(idToken);
    if (r.success) navigate(redirect || '/');
    else setError(r.message);
  };

  return (
    <>
      <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-slate-900 -z-10" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] -z-10" />

          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[640px] border border-slate-100">
            <LeftPanel>
              <div className="flex items-center gap-2 text-amber-400 mb-8">
                <span className="text-2xl">🚀</span>
                <span className="font-bold tracking-wider uppercase text-xs">Join the Network</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Accelerate your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Agri-Business Growth.</span>
              </h2>
              <div className="space-y-5 mt-4">
                {[
                  { emoji: '🌐', title: 'Global Market Access', desc: 'Connect directly with buyers worldwide.' },
                  { emoji: '🛡️', title: 'Secure & Verified', desc: 'Industry-standard data protection.' },
                  { emoji: '📊', title: 'Smart Analytics', desc: 'Data-driven insights for your yield.' },
                ].map(f => (
                  <div key={f.title} className="flex items-start gap-3">
                    <span className="text-2xl">{f.emoji}</span>
                    <div>
                      <p className="font-bold text-white text-sm">{f.title}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </LeftPanel>

            <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
              <div className="max-w-sm mx-auto w-full">
                <h3 className="text-3xl font-bold text-slate-900 mb-1">Create Account</h3>
                <p className="text-slate-500 text-sm mb-8">Join SRIJON — choose your sign-up method.</p>

                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                    <span className="font-bold mr-1">Error:</span>{error}
                  </div>
                )}

                {method === '' && <MethodPicker onSelect={(m) => { setMethod(m); setError(''); }} />}

                {method !== '' && (
                  <div>
                    <button onClick={back} className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline mb-6">
                      <FaArrowLeft className="text-xs" /> Back to options
                    </button>

                    {/* ── Email ── */}
                    {method === 'email' && (
                      <form onSubmit={handleEmail} className="space-y-4">
                        {[
                          { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Your Name' },
                          { name: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com' },
                        ].map(f => (
                          <div key={f.name}>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">{f.label}</label>
                            <div className="relative group">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                {f.name === 'name'
                                  ? <span className="text-slate-400">👤</span>
                                  : <FaEnvelope className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />}
                              </div>
                              <input name={f.name} type={f.type} required value={formData[f.name]}
                                onChange={e => setFormData({...formData, [f.name]: e.target.value})}
                                placeholder={f.placeholder} className={inputCls()} />
                            </div>
                          </div>
                        ))}
                        {[
                          { name: 'password', label: 'Password', placeholder: 'Min. 6 characters' },
                          { name: 'confirmPassword', label: 'Confirm Password', placeholder: 'Re-enter password' },
                        ].map(f => (
                          <div key={f.name}>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">{f.label}</label>
                            <div className="relative group">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <FaLock className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                              </div>
                              <input name={f.name} type="password" required value={formData[f.name]}
                                onChange={e => setFormData({...formData, [f.name]: e.target.value})}
                                placeholder={f.placeholder} className={inputCls()} />
                            </div>
                          </div>
                        ))}
                        <button type="submit" disabled={loading}
                          className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-base hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:-translate-y-0.5 shadow-lg shadow-blue-500/30 disabled:opacity-60 mt-2">
                          {loading ? 'Creating account…' : 'Create Account →'}
                        </button>
                      </form>
                    )}

                    {/* ── Google ── */}
                    {method === 'google' && (
                      isGoogleConfigured ? (
                        <div className="flex flex-col items-center py-8 px-4 bg-red-50 rounded-2xl border-2 border-red-100 space-y-5">
                          <div className="bg-white p-4 rounded-full shadow-md"><FaGoogle className="text-red-500 text-4xl" /></div>
                          <div className="text-center">
                            <p className="font-bold text-slate-800">Sign up with Google</p>
                            <p className="text-slate-500 text-sm mt-1">Your Google account will create a SRIJON account instantly.</p>
                          </div>
                          {loading ? <p className="text-slate-500 text-sm">Creating account…</p> : (
                            <GoogleLogin onSuccess={handleGoogle} onError={() => setError('Google sign-up failed. Try again.')} useOneTap={false} />
                          )}
                        </div>
                      ) : <NotConfiguredBox type="google" />
                    )}

                    {/* ── Phone ── */}
                    {method === 'phone' && (
                      isFirebaseConfigured
                        ? <PhoneForm containerId="recaptcha-register" onSuccess={handlePhone} />
                        : <NotConfiguredBox type="phone" />
                    )}
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                  <p className="text-slate-500 text-sm">
                    {t('auth.register.hasAccount') || 'Already have an account?'}{' '}
                    <Link to="/login" className="font-bold text-blue-600 hover:underline">Sign In</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}

export default LoginPage;
