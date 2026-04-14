import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaShieldAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const SECTION_KEYS = ['s1','s2','s3','s4','s5','s6','s7','s8'];

const AccordionItem = ({ title, content, isOpen, onToggle }) => (
  <div
    className="rounded-xl overflow-hidden mb-3 transition-all duration-300"
    style={{
      border: '1.5px solid transparent',
      background: isOpen
        ? 'linear-gradient(white, white) padding-box, linear-gradient(to right, #2563eb, #5BA4CF) border-box'
        : 'linear-gradient(white, white) padding-box, linear-gradient(to right, #bfdbfe, #dbeafe) border-box',
    }}
  >
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[#eff6ff] transition-colors"
    >
      <span className={`font-bold text-sm md:text-base ${isOpen ? 'text-[#2563eb]' : 'text-[#1B2B4B]'}`}>
        {title}
      </span>
      {isOpen
        ? <FaChevronUp className="text-[#2563eb] flex-shrink-0" />
        : <FaChevronDown className="text-[#5BA4CF] flex-shrink-0" />
      }
    </button>
    {isOpen && (
      <div className="px-6 pb-5 bg-gradient-to-b from-[#f8fbff] to-white">
        <div className="h-px bg-gradient-to-r from-[#dbeafe] to-[#bfdbfe] mb-4" />
        <p className="text-sm text-[#3b5a8a] leading-relaxed whitespace-pre-line">{content}</p>
      </div>
    )}
  </div>
);

const PrivacyPage = () => {
  const [openSection, setOpenSection] = useState('s1');
  const { t } = useLanguage();

  return (
    <div
      className="min-h-screen flex flex-col font-sans"
      style={{ background: 'linear-gradient(160deg, #eef4ff 0%, #f5f9ff 40%, #dbeafe 100%)' }}
    >
      <Navbar />

      {/* Hero */}
      <section
        className="py-16 px-4 text-center text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1B2B4B 0%, #2563eb 55%, #5BA4CF 100%)' }}
      >
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full blur-3xl opacity-20 bg-[#5BA4CF]" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
            <FaShieldAlt className="text-white text-2xl" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3">{t('nav.privacy')}</h1>
          <p className="text-blue-100 text-sm md:text-base">{t('pages.privacy.subtitle')}</p>
          
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-4 flex-1">
        <div className="container mx-auto max-w-3xl">

          {/* Intro box */}
          <div
            className="rounded-2xl p-6 mb-6"
            style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1.5px solid #bfdbfe' }}
          >
            <p className="text-sm text-[#1B2B4B] font-medium leading-relaxed">
              {t('pages.privacy.intro')}
            </p>
          </div>

          {/* Accordion — all content from t() */}
          {SECTION_KEYS.map((key) => (
            <AccordionItem
              key={key}
              title={t(`pages.privacy.sections.${key}_title`)}
              content={t(`pages.privacy.sections.${key}_content`)}
              isOpen={openSection === key}
              onToggle={() => setOpenSection(openSection === key ? null : key)}
            />
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PrivacyPage;
