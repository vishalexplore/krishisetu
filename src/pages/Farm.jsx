import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";

import {
  MapPin,
  Ruler,
  Sprout,
  CalendarDays,
  Plus,
  Navigation,
  Save,
  Map,
  CheckCircle2,
  LocateFixed,
  Wheat,
  RotateCcw,
} from "lucide-react";

import { useLanguage } from "../i18n/LanguageContext";

const DEFAULT_POSITION = [28.6139, 77.209];

function Farm() {
  const { language, t } = useLanguage();

  const [farmName, setFarmName] = useState("My Wheat Farm");
  const [crop, setCrop] = useState("Wheat");
  const [area, setArea] = useState("2.4");
  const [sowingDate, setSowingDate] = useState("2026-08-26");

  const [position, setPosition] = useState(DEFAULT_POSITION);

  const [locationLoading, setLocationLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingFarm, setLoadingFarm] = useState(true);

  useEffect(() => {
    const loadFarm = async () => {
      try {
        const response = await fetch(
          "https://krishisetu-kb9p.onrender.com/farms/"
        );

        if (!response.ok) {
          throw new Error("Failed to load farms");
        }

        const farms = await response.json();

        if (farms.length > 0) {
          const farm = farms[0];

          setFarmName(farm.name);
          setCrop(farm.crop);
          setArea(String(farm.area_acres));
          setSowingDate(farm.sowing_date);

          setPosition([
            farm.latitude,
            farm.longitude,
          ]);
        }
      } catch (error) {
        console.error("Load farm error:", error);
      } finally {
        setLoadingFarm(false);
      }
    };

    loadFarm();
  }, []);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      alert(
        language === "hi"
          ? "इस ब्राउज़र में लोकेशन की सुविधा उपलब्ध नहीं है।"
          : "Location is not supported by this browser."
      );
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (location) => {
        setPosition([
          location.coords.latitude,
          location.coords.longitude,
        ]);

        setLocationLoading(false);
      },
      () => {
        alert(
          language === "hi"
            ? "आपकी लोकेशन प्राप्त नहीं हो सकी।"
            : "Unable to get your location."
        );

        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  const saveFarm = async () => {
    if (!farmName.trim()) {
      alert(
        language === "hi"
          ? "कृपया खेत का नाम दर्ज करें।"
          : "Please enter a farm name."
      );
      return;
    }

    if (!area || Number(area) <= 0) {
      alert(
        language === "hi"
          ? "कृपया खेत का सही क्षेत्रफल दर्ज करें।"
          : "Please enter a valid farm area."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        "https://krishisetu-kb9p.onrender.com/farms/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            name: farmName,
            crop: crop,
            area_acres: Number(area),
            latitude: position[0],
            longitude: position[1],
            sowing_date: sowingDate,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Backend error:", errorData);
        throw new Error("Failed to save farm");
      }

      const savedFarm = await response.json();

      setFarmName(savedFarm.name);
      setCrop(savedFarm.crop);
      setArea(String(savedFarm.area_acres));
      setSowingDate(savedFarm.sowing_date);

      setPosition([
        savedFarm.latitude,
        savedFarm.longitude,
      ]);

      alert(
        language === "hi"
          ? "खेत सफलतापूर्वक सेव हो गया! 🌱"
          : "Farm saved successfully! 🌱"
      );
    } catch (error) {
      console.error("Save farm error:", error);

      alert(
        language === "hi"
          ? "खेत सेव नहीं हो सका। कृपया जांचें कि backend चल रहा है।"
          : "Could not save farm. Make sure the backend is running."
      );
    } finally {
      setSaving(false);
    }
  };

  const resetFarm = () => {
    setFarmName("");
    setCrop("Wheat");
    setArea("");

    setSowingDate(
      new Date().toISOString().split("T")[0]
    );

    setPosition(DEFAULT_POSITION);
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">

      {/* HEADER */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Wheat size={16} />
            </div>

            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
              {t("farm", "management")}
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            {t("farm", "myFarm")}
          </h1>

          <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
            {language === "hi"
              ? "अपने खेत की जानकारी, फसल और स्थान को एक ही जगह से प्रबंधित करें।"
              : "Manage your farm details, crop information and location from one place."}
          </p>
        </div>

        <button
          type="button"
          onClick={resetFarm}
          className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700"
        >
          <Plus size={15} />
          {t("farm", "addFarm")}
        </button>
      </section>

      {/* LOADING */}
      {loadingFarm && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />

          {language === "hi"
            ? "आपके खेत की जानकारी लोड हो रही है..."
            : "Loading your farm data..."}
        </div>
      )}

      {/* SUMMARY */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

        <StatCard
          icon={<Sprout size={18} />}
          label={t("farm", "currentCrop")}
          value={crop || (language === "hi" ? "सेट नहीं है" : "Not set")}
          iconClass="bg-emerald-50 text-emerald-600"
        />

        <StatCard
          icon={<Ruler size={18} />}
          label={t("farm", "farmArea")}
          value={`${area || "0"} ${language === "hi" ? "एकड़" : "acres"}`}
          iconClass="bg-sky-50 text-sky-600"
        />

        <StatCard
          icon={<CalendarDays size={18} />}
          label={t("farm", "sowingDate")}
          value={formatDate(sowingDate, language)}
          iconClass="bg-amber-50 text-amber-600"
        />

        <StatCard
          icon={<MapPin size={18} />}
          label={
            language === "hi"
              ? "खेत के निर्देशांक"
              : "Farm coordinates"
          }
          value={`${position[0].toFixed(3)}, ${position[1].toFixed(3)}`}
          iconClass="bg-violet-50 text-violet-600"
        />

      </section>

      {/* MAIN CONTENT */}
      <section className="grid gap-5 xl:grid-cols-[410px_1fr]">

        {/* FARM DETAILS */}
        <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm">

          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Sprout size={19} />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                  {language === "hi"
                    ? "खेत प्रोफ़ाइल"
                    : "Farm profile"}
                </p>

                <h2 className="mt-0.5 text-lg font-bold text-slate-900">
                  {language === "hi"
                    ? "खेत की जानकारी"
                    : "Farm details"}
                </h2>
              </div>

            </div>
          </div>

          <div className="p-5 sm:p-6">

            <div className="space-y-5">

              {/* FARM NAME */}
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-700">
                  {language === "hi"
                    ? "खेत का नाम"
                    : "Farm name"}
                </label>

                <div className="relative">
                  <MapPin
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    placeholder={
                      language === "hi"
                        ? "जैसे मेरा गेहूं का खेत"
                        : "e.g. My Wheat Farm"
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-10 pr-4 text-sm font-medium text-slate-800 transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>
              </div>

              {/* CROP */}
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-700">
                  {t("farm", "currentCrop")}
                </label>

                <div className="relative">
                  <Sprout
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <select
                    value={crop}
                    onChange={(e) => setCrop(e.target.value)}
                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-10 pr-10 text-sm font-medium text-slate-800 transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  >
                    <option value="Wheat">
                      {language === "hi" ? "गेहूं" : "Wheat"}
                    </option>

                    <option value="Rice">
                      {language === "hi" ? "धान" : "Rice"}
                    </option>

                    <option value="Mustard">
                      {language === "hi" ? "सरसों" : "Mustard"}
                    </option>

                    <option value="Maize">
                      {language === "hi" ? "मक्का" : "Maize"}
                    </option>

                    <option value="Potato">
                      {language === "hi" ? "आलू" : "Potato"}
                    </option>

                    <option value="Sugarcane">
                      {language === "hi" ? "गन्ना" : "Sugarcane"}
                    </option>

                    <option value="Tomato">
                      {language === "hi" ? "टमाटर" : "Tomato"}
                    </option>

                    <option value="Cotton">
                      {language === "hi" ? "कपास" : "Cotton"}
                    </option>

                    <option value="Other">
                      {language === "hi" ? "अन्य" : "Other"}
                    </option>
                  </select>

                  <ChevronDown />
                </div>
              </div>

              {/* AREA */}
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-700">
                  {t("farm", "farmArea")}
                </label>

                <div className="relative">
                  <Ruler
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="2.4"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-10 pr-16 text-sm font-medium text-slate-800 transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                    {language === "hi" ? "एकड़" : "ACRES"}
                  </span>
                </div>
              </div>

              {/* DATE */}
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-700">
                  {t("farm", "sowingDate")}
                </label>

                <div className="relative">
                  <CalendarDays
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="date"
                    value={sowingDate}
                    onChange={(e) => setSowingDate(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-10 pr-4 text-sm font-medium text-slate-800 transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>
              </div>

              {/* SAVE */}
              <button
                type="button"
                onClick={saveFarm}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-600/15 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                    {language === "hi"
                      ? "खेत सेव हो रहा है..."
                      : "Saving farm..."}
                  </>
                ) : (
                  <>
                    <Save size={16} />

                    {language === "hi"
                      ? "खेत की जानकारी सेव करें"
                      : "Save farm details"}
                  </>
                )}
              </button>

            </div>

            {/* GPS */}
            <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">

              <div className="flex items-start gap-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                  <LocateFixed size={17} />
                </div>

                <div className="min-w-0 flex-1">

                  <p className="text-xs font-bold text-emerald-800">
                    {t("farm", "farmLocation")}
                  </p>

                  <p className="mt-1 text-[10px] leading-4 text-emerald-700/70">
                    {language === "hi"
                      ? "अपने वर्तमान GPS स्थान का उपयोग करके मानचित्र पर खेत की स्थिति अपडेट करें।"
                      : "Use your current GPS location to update the farm position on the map."}
                  </p>

                  <button
                    type="button"
                    onClick={useMyLocation}
                    disabled={locationLoading}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-[10px] font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <Navigation size={13} />

                    {locationLoading
                      ? language === "hi"
                        ? "लोकेशन खोजी जा रही है..."
                        : "Finding location..."
                      : t("farm", "locateMe")}
                  </button>

                </div>

              </div>

            </div>

            {/* RESET */}
            <button
              type="button"
              onClick={resetFarm}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-[10px] font-bold text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            >
              <RotateCcw size={13} />

              {language === "hi"
                ? "फॉर्म साफ करें"
                : "Clear form"}
            </button>

          </div>
        </div>

        {/* MAP */}
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">

          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <Map size={19} />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                  {language === "hi"
                    ? "स्थान"
                    : "Location"}
                </p>

                <h2 className="mt-0.5 text-lg font-bold text-slate-900">
                  {t("farm", "farmLocation")}
                </h2>

                <p className="mt-0.5 text-[10px] text-slate-400">
                  {language === "hi"
                    ? "अपने खेत की स्थिति देखें।"
                    : "Select and view your farm position."}
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={useMyLocation}
              disabled={locationLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-2.5 text-[10px] font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
            >
              <Navigation size={14} />

              {locationLoading
                ? language === "hi"
                  ? "लोकेशन खोज रहे हैं..."
                  : "Locating..."
                : t("farm", "locateMe")}
            </button>

          </div>

          {/* MAP */}
          <div className="h-[400px] w-full sm:h-[500px]">

            <MapContainer
              center={position}
              zoom={13}
              scrollWheelZoom={true}
              className="h-full w-full"
            >

              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <Marker position={position}>
                <Popup>

                  <strong>
                    {farmName ||
                      (language === "hi"
                        ? "मेरा खेत"
                        : "My Farm")}
                  </strong>

                  <br />

                  {language === "hi"
                    ? `${getCropHindi(crop)} का खेत`
                    : `${crop} farm`}

                  <br />

                  {area || "0"}{" "}
                  {language === "hi"
                    ? "एकड़"
                    : "acres"}

                </Popup>
              </Marker>

            </MapContainer>

          </div>

          {/* MAP FOOTER */}
          <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                {language === "hi"
                  ? "चयनित निर्देशांक"
                  : "Selected coordinates"}
              </p>

              <p className="mt-1 font-mono text-xs font-semibold text-slate-700">
                {position[0].toFixed(6)},{" "}
                {position[1].toFixed(6)}
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-600">
              <CheckCircle2 size={13} />

              {language === "hi"
                ? "लोकेशन तैयार है"
                : "Location ready"}
            </div>

          </div>

        </div>

      </section>

    </div>
  );
}

/* DATE FORMAT */
function formatDate(date, language) {
  if (!date) {
    return language === "hi"
      ? "सेट नहीं है"
      : "Not set";
  }

  const parts = date.split("-");

  if (parts.length !== 3) {
    return date;
  }

  const [year, month, day] = parts;

  const dateObject = new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  );

  return dateObject.toLocaleDateString(
    language === "hi" ? "hi-IN" : "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

/* CROP HINDI */
function getCropHindi(crop) {
  const crops = {
    Wheat: "गेहूं",
    Rice: "धान",
    Mustard: "सरसों",
    Maize: "मक्का",
    Potato: "आलू",
    Sugarcane: "गन्ना",
    Tomato: "टमाटर",
    Cotton: "कपास",
    Other: "अन्य",
  };

  return crops[crop] || crop;
}

/* STAT CARD */
function StatCard({
  icon,
  label,
  value,
  iconClass,
}) {
  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

      <div className="flex items-center justify-between">

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>

        <CheckCircle2
          size={15}
          className="text-emerald-400"
        />

      </div>

      <p className="mt-3 text-[10px] font-semibold text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-base font-bold text-slate-900">
        {value}
      </p>

    </div>
  );
}

/* SELECT ARROW */
function ChevronDown() {
  return (
    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </span>
  );
}

export default Farm;