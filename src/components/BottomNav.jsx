import {
  LayoutDashboard,
  Map,
  CloudSun,
  Sprout,
  Satellite,
  Bot,
  Stethoscope,
  UserRound,
  MoreHorizontal,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";

const mainItems = [
  {
    key: "dashboard",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    key: "farm",
    path: "/farm",
    icon: Map,
  },
  {
    key: "weather",
    path: "/weather",
    icon: CloudSun,
  },
  {
    key: "soil",
    path: "/soil",
    icon: Sprout,
  },
];

const moreItems = [
  {
    key: "satellite",
    path: "/satellite",
    icon: Satellite,
  },
  {
    key: "advisor",
    path: "/advisor",
    icon: Bot,
  },
  {
    key: "cropDoctor",
    path: "/crop-doctor",
    icon: Stethoscope,
  },
  {
    key: "profile",
    path: "/profile",
    icon: UserRound,
  },
];

export default function BottomNav() {
  const { t, language } = useLanguage();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      {/* MORE MENU */}
      {moreOpen && (
        <>
          <div
            className="fixed inset-0 z-[55] bg-black/30 lg:hidden"
            onClick={() => setMoreOpen(false)}
          />

          <div className="fixed bottom-[72px] left-3 right-3 z-[60] rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl lg:hidden">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {language === "hi" ? "और सुविधाएँ" : "More features"}
              </h3>

              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="rounded-full bg-slate-100 p-2 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {moreItems.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMoreOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-2xl border p-4 transition ${
                        isActive
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      }`
                    }
                  >
                    <Icon size={21} />

                    <span className="text-xs font-bold">
                      {t("nav", item.key)}
                    </span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-lg lg:hidden">
        <div className="grid grid-cols-5 px-1 py-1.5">
          {mainItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold transition ${
                    isActive
                      ? "bg-emerald-50 text-emerald-600"
                      : "text-slate-500"
                  }`
                }
              >
                <Icon size={20} strokeWidth={2.2} />

                <span className="truncate">
                  {t("nav", item.key)}
                </span>
              </NavLink>
            );
          })}

          {/* MORE */}
          <button
            type="button"
            onClick={() => setMoreOpen((value) => !value)}
            className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold transition ${
              moreOpen
                ? "bg-emerald-50 text-emerald-600"
                : "text-slate-500"
            }`}
          >
            <MoreHorizontal size={21} strokeWidth={2.2} />

            <span>{language === "hi" ? "और" : "More"}</span>
          </button>
        </div>
      </nav>
    </>
  );
}