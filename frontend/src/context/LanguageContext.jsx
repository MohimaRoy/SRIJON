import { createContext, useState, useContext, useEffect } from 'react';
import enTranslations from '../i18n/en.json';
import bnTranslations from '../i18n/bn.json';

const translations = {
  en: enTranslations,
  bn: bnTranslations
};

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    try {
      return localStorage.getItem('language') ||'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('language', currentLanguage);
    } catch {
      // Silently fail if localStorage is not available
    }
  }, [currentLanguage]);

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[currentLanguage];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };

  const value = {
    currentLanguage,
    setLanguage: setCurrentLanguage,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
