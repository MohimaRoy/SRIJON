import { useLanguage } from '../context/LanguageContext';
import { FaGlobe } from 'react-icons/fa';

const LanguageSwitcher = () => {
  const { currentLanguage, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(currentLanguage === 'en' ? 'bn' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="
        group flex items-center gap-2 px-4 py-2 rounded-full
        bg-white border border-slate-200
        text-sm font-bold text-slate-600
        hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50
        transition-all duration-300 shadow-sm hover:shadow-md
      "
      aria-label="Switch Language"
      title={currentLanguage === 'en' ? 'Switch to Bangla' : 'Switch to English'}
    >
      <FaGlobe className="text-slate-400 group-hover:text-blue-500 transition-colors text-xs" />
      <span className="leading-none pt-0.5">
        {currentLanguage === 'en' ? 'বাংলা' : 'English'}
      </span>
    </button>
  );
};

export default LanguageSwitcher;