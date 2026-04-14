import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaEnvelopeOpenText, FaArrowLeft, FaRedo, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const VerifyOTPPage = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const { login, checkAuth } = useAuth();

  // Get email and redirect from location state
  const email = location.state?.email;
  const redirect = location.state?.redirect;

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      const target = redirect ? `/register?redirect=${encodeURIComponent(redirect)}` : '/register';
      navigate(target);
    }
  }, [email, navigate, redirect]);

  // Cooldown timer for resend button
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleOTPChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only numbers
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      const data = response.data;

      if (data.success) {
        setSuccess('Email verified successfully! Redirecting...');

        // Store token and user data
        if (data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          // Refresh auth state in context
          await checkAuth();
        }

        // Redirect to target or homepage after 1.5 seconds
        setTimeout(() => {
          navigate(redirect || '/');
        }, 1500);
      } else {
        setError(data.message || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setSuccess('');
    setResendLoading(true);

    try {
      const response = await api.post('/auth/resend-otp', { email });
      const data = response.data;

      if (data.success) {
        setSuccess('New verification code sent to your email!');
        setCooldown(60); // 60 second cooldown
        setOtp(''); // Clear current OTP
      } else {
        setError(data.message || 'Failed to resend OTP. Please try again.');
      }
    } catch (err) {
      console.error('Resend error:', err);
      setError('Server error. Please try again later.');
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-12 relative overflow-hidden">

        {/* Background Decor */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">

            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner border border-blue-100">
                <FaEnvelopeOpenText className="text-3xl text-blue-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Check your Email
              </h2>
              <p className="text-slate-500 text-sm">
                We've sent a 6-digit verification code to
              </p>
              <p className="text-slate-800 font-bold mt-1 bg-slate-100 py-1 px-3 rounded-full inline-block text-sm">
                {email}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2 animate-fade-in">
                <FaExclamationCircle /> {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2 animate-fade-in">
                <FaCheckCircle /> {success}
              </div>
            )}

            {/* OTP Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="otp" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">
                  Enter Verification Code
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  value={otp}
                  onChange={handleOTPChange}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-4 text-center text-3xl font-mono font-bold tracking-[0.5em] rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-slate-700 placeholder-slate-200 bg-slate-50 focus:bg-white"
                />
                <p className="text-xs text-slate-400 mt-3 text-center">
                  Code expires in <span className="font-medium text-slate-600">10 minutes</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !!success}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg shadow-blue-500/30 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? 'Verifying...' : success ? 'Verified' : 'Verify Email'}
              </button>
            </form>

            {/* Resend OTP */}
            <div className="mt-8 text-center pt-6 border-t border-slate-100">
              <p className="text-sm text-slate-500 mb-3">
                Didn't receive the code?
              </p>
              <button
                onClick={handleResendOTP}
                disabled={resendLoading || cooldown > 0}
                className="flex items-center justify-center gap-2 mx-auto text-blue-600 hover:text-blue-800 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {resendLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <FaRedo className={`text-xs ${cooldown > 0 ? '' : 'group-hover:rotate-180 transition-transform'}`} />
                )}

                {resendLoading
                  ? 'Sending...'
                  : cooldown > 0
                    ? `Resend available in ${cooldown}s`
                    : 'Resend Code'}
              </button>
            </div>

            {/* Back to Register */}
            <div className="mt-6 text-center">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 font-medium text-xs transition-colors"
              >
                <FaArrowLeft /> Wrong email? Register again
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default VerifyOTPPage;