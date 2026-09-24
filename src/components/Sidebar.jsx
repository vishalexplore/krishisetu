import {
  LayoutDashboard,
  Map,
  CloudSun,
  Sprout,
  Satellite,
  Stethoscope,
  Bot,
  UserRound,
  Leaf,
  ChevronRight,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";

const navigation = [
  { key: "dashboard", path: "/", icon: LayoutDashboard },
  { key: "farm", path: "/farm", icon: Map },
  { key: "weather", path: "/weather", icon: CloudSun },
  { key: "soil", path: "/soil", icon: Sprout },
  { key: "satellite", path: "/satellite", icon: Satellite },
  { key: "cropDoctor", path: "/crop-doctor", icon: Stethoscope },
  { key: "advisor", path: "/advisor", icon: Bot },
];

function Sidebar() {
  const { language, t } = useLanguage();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200/80 bg-white lg:block">
      <div className="flex h-full min-h-0 flex-col">

        {/* Logo */}
        <div className="shrink-0 px-5 pb-5 pt-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <Leaf size={21} strokeWidth={2.2} />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-[18px] font-bold tracking-tight text-slate-900">
                KrishiSetu
              </h1>

              <p className="truncate text-[10px] font-medium text-slate-400">
                {language === "hi"
                  ? "स्मार्ट खेती प्लेटफॉर्म"
                  : "Smart farming platform"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            {language === "hi" ? "कार्य क्षेत्र" : "Workspace"}
          </p>

          <nav className="space-y-0.5">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12px] font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                          isActive
                            ? "bg-white text-emerald-600 shadow-sm"
                            : "bg-slate-50 text-slate-400 group-hover:text-slate-700"
                        }`}
                      >
                        <Icon size={16} strokeWidth={2} />
                      </span>

                      <span className="min-w-0 flex-1 truncate">
                        {t("nav", item.key)}
                      </span>

                      {isActive && (
                        <ChevronRight
                          size={13}
                          className="shrink-0 text-emerald-500"
                        />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom section */}
        <div className="shrink-0 border-t border-slate-100 bg-white p-3">

          {/* AI Advisor */}
          <NavLink
            to="/advisor"
            className="group mb-2 block overflow-hidden rounded-xl bg-emerald-700 p-3 text-white shadow-md shadow-emerald-700/10 transition hover:bg-emerald-800"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                <Bot size={16} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold">
                  {language === "hi"
                    ? "कृषि AI सलाहकार"
                    : "AI Farm Advisor"}
                </p>

                <p className="mt-0.5 truncate text-[9px] text-emerald-100">
                  {language === "hi"
                    ? "स्मार्ट फसल सुझाव"
                    : "Smart crop recommendations"}
                </p>
              </div>

              <ChevronRight
                size={14}
                className="shrink-0 opacity-60 transition group-hover:translate-x-0.5 group-hover:opacity-100"
              />
            </div>
          </NavLink>

          {/* Profile */}
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-xl border p-2.5 transition ${
                isActive
                  ? "border-emerald-100 bg-emerald-50"
                  : "border-slate-100 bg-slate-50/70 hover:bg-slate-50"
              }`
            }
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <UserRound size={16} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-800">
                {language === "hi" ? "किसान" : "Farmer"}
              </p>

              <p className="truncate text-[10px] text-slate-400">
                {language === "hi" ? "मेरी प्रोफ़ाइल" : "My Profile"}
              </p>
            </div>

            <ChevronRight
              size={14}
              className="shrink-0 text-slate-300"
            />
          </NavLink>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;