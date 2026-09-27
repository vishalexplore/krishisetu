import { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import {
  MapPin,
  Ruler,
  Sprout,
  CalendarDays,
  Plus,
  Navigation,
  Save,
  Wheat,
  LocateFixed,
  CheckCircle2,
  RefreshCw,
  MapPinned,
} from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useAuth } from "../auth/AuthContext";

const API_BASE = "https://krishisetu-kb9p.onrender.com";

const DEFAULT_POSITION = [28.6139, 77.209];
const DEFAULT_DATE = new Date().toISOString().split("T")[0];

const AREA_UNITS = {
  acre: {
    label: "Acre",
    short: "acre",
    toAcres: 1,
  },
  hectare: {
    label: "Hectare",
    short: "ha",
    toAcres: 2.47105381,
  },
  decimal: {
    label: "Decimal",
    short: "decimal",
    toAcres: 0.01,
  },
  bigha: {
    label: "Bigha",
    short: "bigha",
    // Common UP estimate; local definitions can vary.
    toAcres: 0.625,
  },
  khata: {
    label: "Khata / Katha",
    short: "khata",
    // Common UP estimate; local definitions can vary.
    toAcres: 0.03125,
  },
};

function MapCenter({ position }) {
  const map = useMap();

  useEffect(() => {
    if (
      Array.isArray(position) &&
      position.length === 2 &&
      Number.isFinite(position[0]) &&
      Number.isFinite(position[1])
    ) {
      map.flyTo(position, 17, { duration: 0.8 });
    }
  }, [map, position]);

  return null;
}

function Farm() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const hi = language === "hi";

  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState(null);

  const [farmName, setFarmName] = useState("");
  const [crop, setCrop] = useState("Wheat");
  const [area, setArea] = useState("");
  const [areaUnit, setAreaUnit] = useState("acre");
  const [sowingDate, setSowingDate] = useState(DEFAULT_DATE);
  const [position, setPosition] = useState(DEFAULT_POSITION);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [locationCaptured, setLocationCaptured] = useState(false);

  const [locationLoading, setLocationLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingFarms, setLoadingFarms] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const bestAccuracyRef = useRef(Infinity);

  const authHeaders = async (json = false) => {
    if (!user) {
      throw new Error("You are not logged in.");
    }

    const token = await user.getIdToken();

    return {
      ...(json ? { "Content-Type": "application/json" } : {}),
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const loadFarms = async () => {
    if (!user) return;

    try {
      setLoadingFarms(true);
      setError("");

      const response = await fetch(`${API_BASE}/farms/`, {
        headers: await authHeaders(),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.detail || "Could not load farms.");
      }

      const data = await response.json();
      setFarms(Array.isArray(data) ? data : []);

      if (Array.isArray(data) && data.length > 0) {
        const savedId = Number(
          localStorage.getItem(`krishisetu-selected-farm-${user.uid}`)
        );

        const selected =
          data.find((farm) => farm.id === savedId) || data[0];

        setSelectedFarmId(selected.id);
        fillFormFromFarm(selected);
      } else {
        setSelectedFarmId(null);
        setFormOpen(false);
        resetForm();
      }
    } catch (err) {
      console.error("Load farms error:", err);
      setError(
        hi
          ? "आपके खेत लोड नहीं हो सके।"
          : "Your farms could not be loaded."
      );
    } finally {
      setLoadingFarms(false);
    }
  };

  useEffect(() => {
    loadFarms();

  }, [user]);

  const fillFormFromFarm = (farm) => {
    if (!farm) return;

    setFarmName(farm.name || "");
    setCrop(farm.crop || "Wheat");
    setArea(String(farm.area_acres ?? ""));
    setAreaUnit("acre");
    setSowingDate(farm.sowing_date || DEFAULT_DATE);
    setPosition([
      Number(farm.latitude),
      Number(farm.longitude),
    ]);
    setGpsAccuracy(null);
    setLocationCaptured(true);
    setFormOpen(false);
  };

  const resetForm = () => {
    setFarmName("");
    setCrop("Wheat");
    setArea("");
    setAreaUnit("acre");
    setSowingDate(DEFAULT_DATE);
    setPosition(DEFAULT_POSITION);
    setGpsAccuracy(null);
    setLocationCaptured(false);
    setMessage("");
    setError("");
  };

  const startNewFarm = () => {
    resetForm();
    setSelectedFarmId(null);
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectFarm = (farm) => {
    setSelectedFarmId(farm.id);
    localStorage.setItem(
      `krishisetu-selected-farm-${user.uid}`,
      String(farm.id)
    );
    fillFormFromFarm(farm);
    setMessage("");
    setError("");
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      alert(
        hi
          ? "इस ब्राउज़र में GPS उपलब्ध नहीं है।"
          : "GPS is not supported by this browser."
      );
      return;
    }

    setLocationLoading(true);
    setGpsAccuracy(null);

    navigator.geolocation.getCurrentPosition(
      (location) => {
        const { latitude, longitude, accuracy } = location.coords;
        const nextPosition = [Number(latitude), Number(longitude)];

        setPosition(nextPosition);
        setGpsAccuracy(Math.round(accuracy || 0));
        setLocationCaptured(true);

        // Keep the captured coordinates in the current user's draft too.
        if (user) {
          localStorage.setItem(
            `krishisetu-gps-draft-${user.uid}`,
            JSON.stringify({
              latitude: nextPosition[0],
              longitude: nextPosition[1],
              accuracy: Math.round(accuracy || 0),
            })
          );
        }

        setLocationLoading(false);
      },
      (geoError) => {
        console.error("GPS error:", geoError);
        setLocationLoading(false);

        alert(
          hi
            ? "GPS location नहीं मिल सकी। Browser location permission Allow करें और GPS ON रखें।"
            : "Could not get GPS location. Allow browser location permission and keep GPS on."
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 20000,
      }
    );
  };

  const areaToAcres = () => {
    const value = Number(area);
    if (!Number.isFinite(value) || value <= 0) return 0;

    return value * AREA_UNITS[areaUnit].toAcres;
  };

  const displayArea = (acres) => {
    const value = Number(acres);
    if (!Number.isFinite(value)) return "0";

    const converted = value / AREA_UNITS[areaUnit].toAcres;

    return converted >= 100
      ? converted.toFixed(0)
      : converted >= 10
        ? converted.toFixed(1)
        : converted.toFixed(2);
  };

  const saveFarm = async () => {
    if (!user) {
      alert(hi ? "पहले login करें।" : "Please login first.");
      return;
    }

    if (!farmName.trim()) {
      alert(
        hi
          ? "कृपया खेत का नाम दर्ज करें।"
          : "Please enter a farm name."
      );
      return;
    }

    const acres = areaToAcres();

    if (!acres || acres <= 0) {
      alert(
        hi
          ? "कृपया सही खेत का area दर्ज करें।"
          : "Please enter a valid farm area."
      );
      return;
    }

    if (
      !locationCaptured ||
      !Number.isFinite(position[0]) ||
      !Number.isFinite(position[1])
    ) {
      alert(
        hi
          ? "पहले खेत की location चुनें।"
          : "Please set the farm location first."
      );
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const response = await fetch(`${API_BASE}/farms/`, {
        method: "POST",
        headers: await authHeaders(true),
        body: JSON.stringify({
          name: farmName.trim(),
          crop: crop.trim() || "Wheat",
          area_acres: Number(acres.toFixed(6)),
          latitude: Number(position[0]),
          longitude: Number(position[1]),
          sowing_date: sowingDate || null,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.detail || "Failed to save farm.");
      }

      const savedFarm = data;

      setFarms((prev) => [
        savedFarm,
        ...prev.filter((farm) => farm.id !== savedFarm.id),
      ]);

      setSelectedFarmId(savedFarm.id);
      localStorage.setItem(
        `krishisetu-selected-farm-${user.uid}`,
        String(savedFarm.id)
      );

      fillFormFromFarm(savedFarm);

      localStorage.removeItem(`krishisetu-gps-draft-${user.uid}`);

      setMessage(
        hi
          ? "खेत सफलतापूर्वक सेव हो गया। 🌱"
          : "Farm saved successfully. 🌱"
      );
      setFormOpen(false);
    } catch (err) {
      console.error("Save farm error:", err);
      setError(
        hi
          ? `खेत सेव नहीं हो सका: ${err.message}`
          : `Could not save farm: ${err.message}`
      );
    } finally {
      setSaving(false);
    }
  };

  const selectedFarm =
    farms.find((farm) => farm.id === selectedFarmId) || null;

  const areaInAcres = selectedFarm?.area_acres ?? areaToAcres();

  return (
    <div className="relative z-0 mx-auto max-w-[1400px] space-y-6">
      {/* HEADER */}
      <section className="relative z-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Wheat size={16} />
            </div>

            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
              {hi ? "खेत प्रबंधन" : "Farm Management"}
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            {hi ? "मेरे खेत" : "My Farms"}
          </h1>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            {hi
              ? "एक से ज्यादा खेत जोड़ें और हर खेत की location, crop और area अलग रखें।"
              : "Add multiple farms and keep each farm's location, crop and area separate."}
          </p>
        </div>

        <button
          type="button"
          onClick={startNewFarm}
          className="relative z-20 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/15 transition hover:bg-emerald-700"
        >
          <Plus size={17} />
          {hi ? "नया खेत जोड़ें" : "Add Farm"}
        </button>
      </section>

      {/* STATUS */}
      {message && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <CheckCircle2 size={17} />
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* FARM LIST */}
      <section className="relative z-10 min-w-0 overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              {hi ? "आपके खेत" : "Your farms"}
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              {hi
                ? `${farms.length} खेत सेव हैं`
                : `${farms.length} farm${farms.length === 1 ? "" : "s"} saved`}
            </h2>
          </div>

          <button
            type="button"
            onClick={loadFarms}
            disabled={loadingFarms}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={loadingFarms ? "animate-spin" : ""}
            />
            {hi ? "Refresh" : "Refresh"}
          </button>
        </div>

        {loadingFarms ? (
          <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">
            {hi ? "खेत लोड हो रहे हैं..." : "Loading your farms..."}
          </div>
        ) : farms.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 p-6 text-center">
            <Sprout
              size={30}
              className="mx-auto text-emerald-500"
            />
            <p className="mt-3 text-sm font-bold text-slate-800">
              {hi ? "अभी कोई खेत नहीं है" : "No farm added yet"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {hi
                ? "अपने खेत में खड़े होकर GPS location सेव करें।"
                : "Stand in your field and save its GPS location."}
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {farms.map((farm) => {
              const active = farm.id === selectedFarmId;

              return (
                <button
                  key={farm.id}
                  type="button"
                  onClick={() => selectFarm(farm)}
                  className={`text-left rounded-2xl border p-4 transition ${
                    active
                      ? "border-emerald-400 bg-emerald-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                        <Sprout size={19} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {farm.name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {farm.crop}
                        </p>
                      </div>
                    </div>

                    {active && (
                      <CheckCircle2
                        size={18}
                        className="shrink-0 text-emerald-600"
                      />
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-xl bg-white/80 p-2">
                      <p className="text-slate-400">
                        {hi ? "Area" : "Area"}
                      </p>
                      <p className="mt-0.5 font-bold text-slate-700">
                        {farm.area_acres} acre
                      </p>
                    </div>

                    <div className="rounded-xl bg-white/80 p-2">
                      <p className="text-slate-400">
                        {hi ? "GPS" : "GPS"}
                      </p>
                      <p className="mt-0.5 font-bold text-slate-700">
                        {Number(farm.latitude).toFixed(4)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* FORM */}
      {formOpen && (
        <section className="relative z-10 min-w-0 overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">
                {hi ? "नया खेत" : "New farm"}
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">
                {hi ? "खेत की जानकारी भरें" : "Add farm details"}
              </h2>
            </div>

            {farms.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setFormOpen(false);
                  if (selectedFarm) fillFormFromFarm(selectedFarm);
                }}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                {hi ? "Cancel" : "Cancel"}
              </button>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* BASIC DETAILS */}
            <div className="space-y-4">
              <Field
                icon={<MapPin size={16} />}
                label={hi ? "खेत का नाम" : "Farm name"}
              >
                <input
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  placeholder={
                    hi ? "जैसे मेरा खेत" : "e.g. My Main Farm"
                  }
                  className="input"
                />
              </Field>

              <Field
                icon={<Sprout size={16} />}
                label={hi ? "फसल" : "Crop"}
              >
                <select
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  className="input"
                >
                  <option>Wheat</option>
                  <option>Rice</option>
                  <option>Sugarcane</option>
                  <option>Potato</option>
                  <option>Maize</option>
                  <option>Mustard</option>
                  <option>Vegetables</option>
                  <option>Other</option>
                </select>
              </Field>

              <Field
                icon={<Ruler size={16} />}
                label={hi ? "खेत का area" : "Farm area"}
              >
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_150px]">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="2.5"
                    className="input"
                  />

                  <select
                    value={areaUnit}
                    onChange={(e) => setAreaUnit(e.target.value)}
                    className="input"
                  >
                    {Object.entries(AREA_UNITS).map(
                      ([key, unit]) => (
                        <option key={key} value={key}>
                          {unit.label}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {area && Number(area) > 0 && (
                  <p className="mt-2 text-[11px] font-medium text-slate-500">
                    ≈ {areaToAcres().toFixed(3)} acre
                  </p>
                )}

                <p className="mt-1 text-[10px] text-slate-400">
                  {hi
                    ? "Bigha/Khata का स्थानीय माप जगह के अनुसार बदल सकता है।"
                    : "Bigha/Khata measurements can vary locally."}
                </p>
              </Field>

              <Field
                icon={<CalendarDays size={16} />}
                label={hi ? "बुवाई की तारीख" : "Sowing date"}
              >
                <input
                  type="date"
                  value={sowingDate}
                  onChange={(e) => setSowingDate(e.target.value)}
                  className="input"
                />
              </Field>

              <button
                type="button"
                onClick={saveFarm}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/15 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <RefreshCw size={17} className="animate-spin" />
                    {hi ? "सेव हो रहा है..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <Save size={17} />
                    {hi ? "खेत सेव करें" : "Save Farm"}
                  </>
                )}
              </button>
            </div>

            {/* LOCATION */}
            <div className="relative z-0 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
              <div className="relative z-[1000] flex min-w-0 flex-col items-stretch gap-3 border-b border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {hi ? "खेत की GPS location" : "Farm GPS location"}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    {hi
                      ? "खेत में खड़े होकर location लें"
                      : "Stand in your field and capture location"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={useMyLocation}
                  disabled={locationLoading}
                  className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-60 sm:w-auto"
                >
                  {locationLoading ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <LocateFixed size={14} />
                  )}
                  {locationLoading
                    ? hi
                      ? "GPS..."
                      : "Finding..."
                    : hi
                      ? "मेरी location"
                      : "Use my location"}
                </button>
              </div>

              <div className="relative z-0 h-[260px] w-full min-w-0 sm:h-[360px] md:h-[420px] lg:h-[450px]">
                <MapContainer
                  center={position}
                  zoom={16}
                  scrollWheelZoom
                  className="z-0 h-full w-full min-w-0"
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <MapCenter position={position} />

                  <Marker position={position}>
                    <Popup>
                      <div className="min-w-[170px]">
                        <p className="font-bold">
                          {farmName || (hi ? "मेरा खेत" : "My Farm")}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {position[0].toFixed(6)},{" "}
                          {position[1].toFixed(6)}
                        </p>

                        {gpsAccuracy != null && (
                          <p className="mt-1 text-xs text-emerald-600">
                            GPS ±{gpsAccuracy} m
                          </p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>

              <div className="relative z-[1000] grid gap-2 border-t border-slate-200 bg-white p-4 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    <MapPinned size={13} />
                    Latitude
                  </div>
                  <p className="mt-1 min-w-0 break-all font-mono text-xs font-bold text-slate-700">
                    {position[0].toFixed(6)}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    <MapPinned size={13} />
                    Longitude
                  </div>
                  <p className="mt-1 min-w-0 break-all font-mono text-xs font-bold text-slate-700">
                    {position[1].toFixed(6)}
                  </p>
                </div>

                <div className="sm:col-span-2 flex items-center gap-2 text-[10px] font-medium text-slate-500">
                  <Navigation size={13} className="text-emerald-600" />
                  {gpsAccuracy != null
                    ? hi
                      ? `GPS accuracy लगभग ±${gpsAccuracy} meter`
                      : `GPS accuracy approximately ±${gpsAccuracy} meters`
                    : hi
                      ? "पहले ‘मेरी location’ दबाकर GPS location लें।"
                      : "Press ‘Use my location’ to capture GPS."}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SELECTED FARM SUMMARY */}
      {!formOpen && selectedFarm && (
        <section className="relative z-10 min-w-0 overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                {hi ? "Selected farm" : "Selected farm"}
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                {selectedFarm.name}
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {selectedFarm.crop} ·{" "}
                {displayArea(selectedFarm.area_acres)}{" "}
                {AREA_UNITS[areaUnit].short} ·{" "}
                {selectedFarm.latitude.toFixed(6)},{" "}
                {selectedFarm.longitude.toFixed(6)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                fillFormFromFarm(selectedFarm);
                setFormOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <MapPin size={14} />
              {hi ? "Location देखें" : "View location"}
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <InfoCard
              icon={<Sprout size={17} />}
              label={hi ? "फसल" : "Crop"}
              value={selectedFarm.crop}
            />

            <InfoCard
              icon={<Ruler size={17} />}
              label={hi ? "Area" : "Area"}
              value={`${selectedFarm.area_acres} acre`}
            />

            <InfoCard
              icon={<Navigation size={17} />}
              label="GPS"
              value={`${selectedFarm.latitude.toFixed(4)}, ${selectedFarm.longitude.toFixed(4)}`}
            />
          </div>
        </section>
      )}
    </div>
  );
}

function Field({ icon, label, children }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-700">
        <span className="text-emerald-600">{icon}</span>
        {label}
      </span>
      {children}
    </label>
  );
}

function StatCard({ icon, label, value, iconClass }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
      >
        {icon}
      </div>
      <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-emerald-600">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
          {label}
        </span>
      </div>
      <p className="mt-2 truncate text-sm font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}

export default Farm;
