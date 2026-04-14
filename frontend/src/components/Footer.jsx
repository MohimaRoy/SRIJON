import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaLinkedin, FaEnvelope, FaSeedling, FaMapMarkerAlt, FaPhone } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="text-[#1B2B4B] mt-24 relative overflow-hidden font-sans"
      style={{ background: 'linear-gradient(135deg, #1B2B4B 0%, #1e3a6e 40%, #2563eb 80%, #5BA4CF 100%)' }}
    >

      {/* Top Gradient Line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#5BA4CF] via-[#93c5fd] to-[#bfdbfe]"></div>

      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#5BA4CF]/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#2563eb]/10 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* 1. Brand Section */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 group w-fit">
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-[#5BA4CF] to-[#93c5fd] rounded-lg shadow-lg">
                <FaSeedling className="text-white text-sm" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                SRI<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#93c5fd] to-[#bfdbfe]">JON</span>
              </span>
            </Link>
            <p className="text-blue-200 text-sm leading-relaxed max-w-xs">
              {t('footer.description') || "Where Bangladesh Creates. The World Appreciates."}
            </p>
          </div>

          {/* 2. Quick Links */}
          <div>
            <h3 className="text-[#93c5fd] font-bold mb-5 text-sm uppercase tracking-wider">{t('footer.quickLinks') || "Platform"}</h3>
            <ul className="space-y-3">
              <li><FooterLink to="/">{t('nav.home')}</FooterLink></li>
              <li><FooterLink to="/about">{t('nav.about')}</FooterLink></li>
              <li><FooterLink to="/register">{t('nav.register')}</FooterLink></li>
              <li><FooterLink to="/login">{t('nav.login')}</FooterLink></li>
            </ul>
          </div>

          {/* 3. Contact Info */}
          <div>
            <h3 className="text-[#93c5fd] font-bold mb-5 text-sm uppercase tracking-wider">{t('footer.contact.title') || "Contact"}</h3>
            <ul className="space-y-4 text-sm text-blue-100">
              <li className="flex items-start gap-3">
                <FaMapMarkerAlt className="text-[#5BA4CF] mt-1 flex-shrink-0" />
                <span>{t('footer.contact.address') || "Dhaka, Bangladesh"}</span>
              </li>
              <li className="flex items-center gap-3">
                <FaPhone className="text-[#5BA4CF] flex-shrink-0" />
                <span>{t('footer.contact.phone') || "+880 1611652888"}</span>
              </li>
              <li className="flex items-center gap-3">
                <FaEnvelope className="text-[#5BA4CF] flex-shrink-0" />
                <span>{t('footer.contact.email') || "support@srijon.com"}</span>
              </li>
            </ul>
          </div>

          {/* 4. Socials */}
          <div>
            <h3 className="text-[#93c5fd] font-bold mb-5 text-sm uppercase tracking-wider">{t('footer.connectWithUs') || "Follow Us"}</h3>
            <div className="flex gap-3">
              <SocialButton href="#" icon={<FaFacebook />} />
              <SocialButton href="#" icon={<FaTwitter />} />
              <SocialButton href="#" icon={<FaLinkedin />} />
              <SocialButton href="#" icon={<FaEnvelope />} />
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#2563eb]/40 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-blue-200">
          <p>&copy; {currentYear} SRIJON. {t('footer.allRightsReserved') || "All Rights Reserved."}</p>
          <div className="flex gap-6">
            <Link to="#" className="hover:text-[#93c5fd] transition-colors">Privacy Policy</Link>
            <Link to="#" className="hover:text-[#93c5fd] transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

// --- Helper Components ---
const FooterLink = ({ to, children }) => (
  <Link
    to={to}
    className="text-blue-200 hover:text-white hover:translate-x-1 transition-all duration-200 inline-block text-sm"
  >
    {children}
  </Link>
);

const SocialButton = ({ href, icon }) => (
  <a
    href={href}
    className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all duration-300 shadow-md transform hover:-translate-y-1"
    style={{
      background: 'linear-gradient(135deg, #2563eb40, #5BA4CF40)',
      border: '1px solid #5BA4CF50',
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb, #5BA4CF)'}
    onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb40, #5BA4CF40)'}
  >
    {icon}
  </a>
);

export default Footer;
