import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  FaSeedling, FaUserCircle, FaBars, FaTimes, FaRocket,
  FaGlobe, FaSignOutAlt, FaChevronDown,
  FaStore, FaFileContract, FaShieldAlt, FaShoppingBag,
  FaShoppingCart, FaTachometerAlt
} from 'react-icons/fa';
import { useState, useEffect, useRef } from 'react';

const Navbar = () => {
  const { isAuthenticated, user, logout, hasRole } = useAuth();
  const { currentLanguage, setLanguage, t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen]     = useState(false);
  const [isScrolled, setIsScrolled]             = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();
  const dropdownRef = useRef(null);

  // ── Role shortcuts ────────────────────────────────────────────────────────
  const isAdmin         = hasRole('admin');

  // ── Scroll shadow ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Close dropdown on outside click ──────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setIsDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Close menus on route change ───────────────────────────────────────────
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;
  const toggleLanguage = () => setLanguage(currentLanguage === 'en' ? 'bn' : 'en');

  const handleLogout = () => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    logout();
    navigate('/');
  };

  const navLinkClasses = (path) => `
    relative font-medium text-sm tracking-wide transition-all duration-300 group py-2 px-1
    ${isActive(path)
      ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#2563eb] to-[#5BA4CF] font-bold'
      : 'text-[#1B2B4B] hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-[#2563eb] hover:to-[#5BA4CF]'
    }
  `;

  const profilePicUrl =
    user?.profilePictures?.length > 0
      ? user.profilePictures[user.profilePictures.length - 1].url
      : null;

  // ── Dashboard link based on role ──────────────────────────────────────────
  const myDashboardPath = isAdmin
    ? '/manager/analytics'
    : '/orders';

  return (
    <>
      <nav
        className={`fixed w-full z-[100] transition-all duration-300
          ${isScrolled
            ? 'bg-gradient-to-r from-[#e8f0fe]/95 via-[#f0f7ff]/95 to-[#dbeafe]/95 backdrop-blur-md shadow-lg py-2'
            : 'bg-gradient-to-r from-[#eef4ff] via-[#f5f9ff] to-[#dbeafe] py-3 md:py-4 shadow-sm'
          }
        `}
      >
        <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-[#1B2B4B] via-[#2563eb] to-[#5BA4CF] opacity-50" />

        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center">

            {/* ── LOGO ── */}
            <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
              <div className="relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-[#1B2B4B] via-[#2563eb] to-[#5BA4CF] rounded-lg shadow-lg transform group-hover:scale-105 transition-all duration-300">
                <FaSeedling className="text-white text-sm md:text-lg relative z-10" />
                <div className="absolute inset-0 bg-sky-400/50 rounded-lg animate-blue-glow"></div>
                <style>{`
                  @keyframes blue-glow {
                    0%, 100% { opacity: 0.1; box-shadow: 0 0 4px rgba(56, 189, 248, 0.1); }
                    50% { opacity: 0.9; box-shadow: 0 0 30px rgba(56, 189, 248, 0.9); }
                  }
                  .animate-blue-glow {
                    animation: blue-glow 2s ease-in-out infinite;
                  }
                `}</style>
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-lg md:text-2xl font-extrabold tracking-tight leading-none">
                  <span className="text-[#1B2B4B]">SRI</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563eb] to-[#5BA4CF]">JON</span>
                </span>
                <span className="hidden md:block text-[9px] font-bold tracking-[0.2em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#2563eb] to-[#5BA4CF]">
                  Growth Platform
                </span>
              </div>
            </Link>

            {/* ── DESKTOP CENTER LINKS ── */}
            <div className="hidden md:flex items-center space-x-6 absolute left-1/2 transform -translate-x-1/2">
              <Link to="/" className={navLinkClasses('/')}>
                {t('nav.home')}
                <span className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#2563eb] to-[#5BA4CF] transition-all duration-300 ${isActive('/') ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
              </Link>

              <Link to="/about" className={navLinkClasses('/about')}>
                {t('nav.about')}
                <span className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#2563eb] to-[#5BA4CF] transition-all duration-300 ${isActive('/about') ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
              </Link>

              <Link to="/shop" className={navLinkClasses('/shop')}>
                {t('nav.shop') || 'Shop'}
                <span className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#2563eb] to-[#5BA4CF] transition-all duration-300 ${isActive('/shop') ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
              </Link>

              <Link to="/combos" className={navLinkClasses('/combos')}>
                🎁 Combos
                <span className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#7c3aed] to-[#a855f7] transition-all duration-300 ${isActive('/combos') ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
              </Link>

              <Link to="/terms" className={navLinkClasses('/terms')}>
                {t('nav.terms') || 'Terms'}
                <span className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#2563eb] to-[#5BA4CF] transition-all duration-300 ${isActive('/terms') ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
              </Link>

              <Link to="/privacy" className={navLinkClasses('/privacy')}>
                {t('nav.privacy') || 'Privacy'}
                <span className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#2563eb] to-[#5BA4CF] transition-all duration-300 ${isActive('/privacy') ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
              </Link>

              {/* ── Role-specific action pill ── */}
              {isAuthenticated && isAdmin && (
                <Link to="/manager/analytics"
                  className="flex items-center gap-1.5 text-white font-bold px-3 py-1.5 rounded-lg hover:-translate-y-0.5 transition-all text-xs whitespace-nowrap"
                  style={{ background: 'linear-gradient(135deg, #9333ea 0%, #a855f7 55%, #c084fc 100%)', boxShadow: '0 4px 14px rgba(168,85,247,0.35)' }}>
                  🛡️ Admin Dashboard
                </Link>
              )}

            </div>

            {/* ── RIGHT ACTIONS ── */}
            <div className="flex items-center gap-2 md:gap-3">

              {/* Cart icon */}
              <Link to="/cart"
                className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full bg-blue-50 text-[#2563eb] hover:bg-blue-100 transition-colors shadow-sm border border-blue-100 relative"
                title="View Cart">
                <FaShoppingCart className="text-[14px] md:text-base relative left-[1px]" />
              </Link>

              {/* Language Switcher */}
              <button onClick={toggleLanguage}
                className="flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-[#dbeafe] transition-colors text-xs md:text-sm font-bold uppercase"
                style={{ background: 'linear-gradient(white, white) padding-box, linear-gradient(to right, #2563eb, #5BA4CF) border-box', border: '1.5px solid transparent' }}>
                <FaGlobe className="text-[#2563eb]" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563eb] to-[#5BA4CF]">
                  {currentLanguage === 'en' ? 'BN' : 'EN'}
                </span>
              </button>

              {/* ── Profile Dropdown or Login/Sign In ── */}
              {isAuthenticated ? (
                <div className="relative" ref={dropdownRef}>
                  <button onClick={() => setIsDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none"
                    style={{ background: 'linear-gradient(white, white) padding-box, linear-gradient(to right, #2563eb, #5BA4CF) border-box', border: '1.5px solid transparent' }}>
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-[#dbeafe] to-[#bfdbfe]"
                         style={{ boxShadow: '0 0 0 2px #5BA4CF' }}>
                      {profilePicUrl
                        ? <img src={profilePicUrl} alt={user?.name} className="w-full h-full object-cover" />
                        : <FaUserCircle className="text-[#2563eb] text-2xl" />
                      }
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-[#1B2B4B] truncate max-w-[80px] sm:max-w-[120px] hidden sm:block">
                      {user?.name}
                    </span>
                    <FaChevronDown className={`text-[#2563eb] text-[10px] flex-shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl overflow-hidden z-50"
                         style={{ border: '1.5px solid transparent', background: 'linear-gradient(white, white) padding-box, linear-gradient(to bottom right, #2563eb, #5BA4CF) border-box' }}>

                      {/* Header */}
                      <div className="px-4 py-3 bg-gradient-to-r from-[#dbeafe] to-[#bfdbfe] border-b border-[#93c5fd]/40">
                        <p className="text-xs text-[#5BA4CF] font-semibold uppercase tracking-wider">
                          {isAdmin ? '🛡️ Admin' : '👤 Customer'}
                        </p>
                        <p className="text-sm font-bold text-[#1B2B4B] truncate">{user?.name}</p>
                      </div>

                      {/* My Dashboard — single smart link */}
                      <Link to={myDashboardPath}
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-[#1B2B4B] hover:bg-[#eff6ff] hover:text-[#2563eb] transition-colors font-medium">
                        <FaTachometerAlt className="text-[#2563eb] flex-shrink-0" />
                        My Dashboard
                      </Link>
                      <div className="h-px bg-gradient-to-r from-[#dbeafe] to-[#bfdbfe]" />

                      {/* My Orders — customers & sellers */}
                      {!isAdmin && (
                        <>
                          <Link to="/my-orders"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm text-[#1B2B4B] hover:bg-[#eff6ff] hover:text-[#2563eb] transition-colors font-medium">
                            <FaShoppingBag className="text-[#2563eb] flex-shrink-0" />
                            My Orders
                          </Link>
                          <div className="h-px bg-gradient-to-r from-[#dbeafe] to-[#bfdbfe]" />
                        </>
                      )}

                      {/* Logout */}
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors font-medium">
                        <FaSignOutAlt className="flex-shrink-0" />
                        {t('nav.logout')}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="text-xs md:text-sm font-bold text-[#1B2B4B] hover:text-[#2563eb] transition-colors px-1 md:px-2">
                    {t('nav.login')}
                  </Link>
                  <Link to="/register"
                    className="flex items-center gap-1.5 text-white font-bold px-3 py-1.5 md:px-5 md:py-2 rounded-lg hover:-translate-y-0.5 transition-all text-xs md:text-sm whitespace-nowrap"
                    style={{ background: 'linear-gradient(135deg, #1B2B4B 0%, #2563eb 55%, #5BA4CF 100%)', boxShadow: '0 4px 14px rgba(37,99,235,0.35)' }}>
                    <span>Sign In</span>
                    <FaRocket className="text-white text-[10px] md:text-xs" />
                  </Link>
                </div>
              )}

              {/* Mobile Hamburger */}
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 focus:outline-none transition-colors rounded-lg hover:bg-[#dbeafe] ml-1"
                aria-label="Toggle menu">
                {isMobileMenuOpen
                  ? <FaTimes size={20} className="text-[#2563eb]" />
                  : <FaBars size={20} className="text-[#1B2B4B]" />
                }
              </button>
            </div>
          </div>
        </div>

        {/* ── MOBILE MENU ── */}
        <div className={`md:hidden absolute top-full left-0 w-full bg-gradient-to-b from-[#f0f7ff] to-[#e8f0fe] border-t border-[#bfdbfe] shadow-xl transition-all duration-300 ease-in-out overflow-hidden origin-top ${
          isMobileMenuOpen ? 'max-h-[700px] opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="flex flex-col p-4 space-y-1">
            <MobileLink to="/" active={isActive('/')}>{t('nav.home')}</MobileLink>
            <MobileLink to="/about" active={isActive('/about')}>{t('nav.about')}</MobileLink>

            <div className="h-px bg-gradient-to-r from-[#dbeafe] to-[#bfdbfe] my-1" />
            <MobileLink to="/shop" active={isActive('/shop')}>
              <FaStore className="inline mr-2 text-[#2563eb]" />{t('nav.shop') || 'Shop'}
            </MobileLink>
            <MobileLink to="/combos" active={isActive('/combos')}>
              🎁 Combo Packages
            </MobileLink>
            <MobileLink to="/cart" active={isActive('/cart')}>
              <FaShoppingCart className="inline mr-2 text-[#2563eb]" /> My Cart
            </MobileLink>
            <MobileLink to="/terms" active={isActive('/terms')}>
              <FaFileContract className="inline mr-2 text-[#2563eb]" />{t('nav.terms') || 'Terms & Conditions'}
            </MobileLink>
            <MobileLink to="/privacy" active={isActive('/privacy')}>
              <FaShieldAlt className="inline mr-2 text-[#2563eb]" />{t('nav.privacy') || 'Privacy Policy'}
            </MobileLink>

            {/* ── Authenticated mobile section ── */}
            {isAuthenticated && (
              <>
                <div className="h-px bg-gradient-to-r from-[#dbeafe] to-[#bfdbfe] my-1" />

                <div className="h-px bg-gradient-to-r from-[#dbeafe] to-[#bfdbfe] mt-2" />
                <button onClick={handleLogout}
                  className="flex items-center gap-2 w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                  <FaSignOutAlt />{t('nav.logout')}
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className={`${isScrolled ? 'h-14' : 'h-16'} md:h-20 transition-all duration-300`}></div>
    </>
  );
};

const MobileLink = ({ to, children, active }) => (
  <Link to={to}
    className={`block px-4 py-3 rounded-xl font-medium text-sm transition-all ${
      active ? 'text-[#1B2B4B] shadow-sm' : 'text-[#1B2B4B] hover:bg-[#dbeafe] hover:text-[#2563eb]'
    }`}
    style={active ? {
      background: 'linear-gradient(white, white) padding-box, linear-gradient(to right, #2563eb, #5BA4CF) border-box',
      border: '1.5px solid transparent',
    } : {}}>
    {children}
  </Link>
);

export default Navbar;