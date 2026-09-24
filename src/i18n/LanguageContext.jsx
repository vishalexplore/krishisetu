import { createContext, useContext, useEffect, useState } from "react";
import { translations } from "./translations";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("krishisetu-language") || "hi";
  });

  useEffect(() => {
    localStorage.setItem("krishisetu-language", language);
  }, [language]);

  const changeLanguage = (newLanguage) => {
    if (newLanguage === "hi" || newLanguage === "en") {
      setLanguage(newLanguage);
    }
  };

  const t = (section, key) => {
    return translations[language]?.[section]?.[key] ?? key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: changeLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider"
    );
  }

  return context;
}