import { useEffect, useState } from "react";
import { Bell, Search, Leaf, Languages } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

function getGreeting(language) {
  const hour = new Date().getHours();

  if (language === "hi") {
    if (hour < 12) return "सुप्रभात";
    if (hour < 17) return "नमस्कार";
    if (hour < 21) return "शुभ संध्या";
    return "शुभ रात्रि";
  }

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";

  return "Good night";
}

function TopBar() {
  const { language, setLanguage, t } = useLanguage();

  const [greeting, setGreeting] = useState(
    getGreeting(language)
  );

  useEffect(() => {
    const updateGreeting = () => {
      setGreeting(getGreeting(language));
    };

    updateGreeting();

    const interval = setInterval(
      updateGreeting,
      60 * 1000
    );

    return () => clearInterval(interval);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(language === "hi" ? "en" : "hi");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">

        <div className="flex items-center gap-3">

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 lg:hidden">
            <Leaf size={18} />
          </div>

          <div>
            <p className="text-[11px] font-medium text-slate-400">
              {language === "hi" ? "वापसी पर स्वागत है" : "Welcome back"}
            </p>

            <h2 className="text-sm font-bold text-slate-800">
              {greeting}, {language === "hi" ? "किसान" : "Farmer"} 👋
            </h2>
          </div>

        </div>

        <div className="flex items-center gap-2">

          {/* LANGUAGE SWITCH */}
          <button
            type="button"
            onClick={toggleLanguage}
            aria-label="Change language"
            title={
              language === "hi"
                ? "Switch to English"
                : "हिंदी में बदलें"
            }
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <Languages size={16} />

            <span>
              {language === "hi" ? "English" : "हिंदी"}
            </span>
          </button>

          {/* SEARCH */}
          <button
            type="button"
            aria-label="Search"
            className="hidden rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 sm:block"
          >
            <Search size={18} />
          </button>

          {/* NOTIFICATIONS */}
          <button
            type="button"
            aria-label={
              language === "hi"
                ? "सूचनाएं"
                : "Notifications"
            }
            className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
          >
            <Bell size={18} />

            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </button>

        </div>

      </div>
    </header>
  );
}

export default TopBar;