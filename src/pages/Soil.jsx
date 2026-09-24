import {
  Sprout,
  Droplets,
  FlaskConical,
  Leaf,
  Activity,
  ArrowUpRight,
  Info,
  Gauge,
  Beaker,
  Wheat,
  Save,
  X,
  Loader2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";

const API = "http://127.0.0.1:8000";

function Soil() {
  const { language } = useLanguage();
  const hi = language === "hi";

  const [farm, setFarm] = useState(null);
  const [soil, setSoil] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    ph: "",
    moisture: "",
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    organic_carbon: "",
  });

  const loadSoil = async () => {
    try {
      setLoading(true);
      setError("");

      const farmResponse = await fetch(`${API}/farms/`);
      if (!farmResponse.ok) throw new Error("farm");

      const farms = await farmResponse.json();

      if (!Array.isArray(farms) || farms.length === 0) {
        setFarm(null);
        setSoil(null);
        return;
      }

      const latestFarm = farms[0];
      setFarm(latestFarm);

      const soilResponse = await fetch(`${API}/soil/${latestFarm.id}`);

      if (soilResponse.status === 404) {
        setSoil(null);
        return;
      }

      if (!soilResponse.ok) throw new Error("soil");

      const data = await soilResponse.json();
      setSoil(data);

      setForm({
        ph: data.ph ?? "",
        moisture: data.moisture ?? "",
        nitrogen: data.nitrogen ?? "",
        phosphorus: data.phosphorus ?? "",
        potassium: data.potassium ?? "",
        organic_carbon: data.organic_carbon ?? "",
      });
    } catch {
      setError(
        hi
          ? "मिट्टी का डेटा लोड नहीं हो पाया।"
          : "Could not load soil data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSoil();
  }, []);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const saveSoil = async (event) => {
    event.preventDefault();

    if (!farm) return;

    const params = new URLSearchParams();
    params.set("farm_id", String(farm.id));

    Object.entries(form).forEach(([key, value]) => {
      if (value !== "" && value !== null) {
        params.set(key, String(value));
      }
    });

    try {
      setSaving(true);
      setError("");

      const response = await fetch(`${API}/soil/?${params.toString()}`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("save");
      }

      const data = await response.json();
      setSoil(data);
      setShowForm(false);
    } catch {
      setError(
        hi
          ? "मिट्टी का डेटा सेव नहीं हो पाया।"
          : "Could not save soil data."
      );
    } finally {
      setSaving(false);
    }
  };

  const nutrientCards = useMemo(
    () => [
      {
        name: hi ? "नाइट्रोजन" : "Nitrogen",
        short: "N",
        value: soil?.nitrogen,
        unit: "kg/ha",
        icon: Sprout,
        iconClass: "bg-emerald-50 text-emerald-600",
      },
      {
        name: hi ? "फॉस्फोरस" : "Phosphorus",
        short: "P",
        value: soil?.phosphorus,
        unit: "kg/ha",
        icon: FlaskConical,
        iconClass: "bg-violet-50 text-violet-600",
      },
      {
        name: hi ? "पोटैशियम" : "Potassium",
        short: "K",
        value: soil?.potassium,
        unit: "kg/ha",
        icon: Activity,
        iconClass: "bg-sky-50 text-sky-600",
      },
    ],
    [hi, soil]
  );

  const hasSoilData = Boolean(soil);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-slate-600 shadow-sm">
          <Loader2 className="animate-spin" size={18} />
          {hi ? "मिट्टी का डेटा लोड हो रहा है..." : "Loading soil data..."}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700">
            <Leaf size={13} />
            {hi ? "मिट्टी की जानकारी" : "Soil Intelligence"}
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {hi ? "मिट्टी की सेहत" : "Soil Health"}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {hi
              ? "अपने खेत की मिट्टी की जांच के वास्तविक आंकड़े यहां सेव करें और देखें।"
              : "Save and view real soil-test measurements for your farm."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(true)}
          disabled={!farm}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/15 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FlaskConical size={17} />
          {hi ? "मिट्टी की रिपोर्ट जोड़ें" : "Add Soil Report"}
        </button>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {!farm ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Leaf className="mx-auto text-emerald-500" size={30} />
          <h2 className="mt-3 text-lg font-bold text-slate-900">
            {hi ? "पहले अपना खेत जोड़ें" : "Add your farm first"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {hi
              ? "मिट्टी का डेटा किसी खेत से जुड़ा होना जरूरी है।"
              : "Soil data must be linked to a farm."}
          </p>
        </div>
      ) : !hasSoilData ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <FlaskConical size={25} />
          </div>

          <h2 className="mt-4 text-xl font-bold text-slate-900">
            {hi ? "मिट्टी का डेटा उपलब्ध नहीं है" : "No soil data available"}
          </h2>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
            {hi
              ? "आपके पास मिट्टी की जांच रिपोर्ट है तो उसके आंकड़े जोड़ें। हम बिना वास्तविक डेटा के कोई वैल्यू या स्कोर नहीं दिखाएंगे।"
              : "If you have a soil-test report, add its measurements. We will not show made-up values or scores without real data."}
          </p>

          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700"
          >
            <FlaskConical size={17} />
            {hi ? "मिट्टी का डेटा जोड़ें" : "Add soil data"}
          </button>
        </div>
      ) : (
        <>
          <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
            <div className="relative overflow-hidden rounded-3xl bg-emerald-700 p-6 text-white shadow-lg shadow-emerald-900/10 sm:p-7">
              <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/10" />
              <div className="absolute -bottom-24 -right-5 h-44 w-44 rounded-full bg-emerald-500/30" />

              <div className="relative">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-emerald-100">
                      {hi ? "मिट्टी का डेटा" : "Soil data"}
                    </p>

                    <div className="mt-3">
                      <span className="text-3xl font-bold">
                        {hi ? "उपलब्ध" : "Available"}
                      </span>
                    </div>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                    <Leaf size={25} />
                  </div>
                </div>

                <div className="mt-7 flex items-center gap-2">
                  <Gauge size={17} />
                  <span className="text-sm font-bold">
                    {hi
                      ? "वास्तविक मिट्टी डेटा सेव है"
                      : "Real soil data is saved"}
                  </span>
                </div>

                <p className="mt-3 text-xs leading-5 text-emerald-100">
                  {hi
                    ? "यह जानकारी आपके खेत की सेव की गई मिट्टी जांच से ली गई है।"
                    : "This information comes from the soil measurements saved for your farm."}
                </p>

                <div className="mt-6 border-t border-white/10 pt-4">
                  <span className="text-[11px] text-emerald-100">
                    {farm.name}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {hi ? "मिट्टी प्रोफ़ाइल" : "Soil profile"}
                  </p>

                  <h2 className="mt-1 text-lg font-bold text-slate-900">
                    {hi ? "मिट्टी के गुण" : "Soil properties"}
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    {hi ? "सेव किया गया नवीनतम डेटा" : "Latest saved data"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="rounded-xl bg-slate-50 p-2.5 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
                  aria-label={hi ? "मिट्टी अपडेट करें" : "Update soil data"}
                >
                  <Info size={18} />
                </button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <Property
                  icon={<Beaker size={18} />}
                  iconClass="bg-violet-50 text-violet-600"
                  label="pH"
                  value={soil.ph}
                  description={hi ? "रिपोर्ट से" : "From report"}
                />

                <Property
                  icon={<Leaf size={18} />}
                  iconClass="bg-emerald-50 text-emerald-600"
                  label={hi ? "जैविक कार्बन" : "Organic carbon"}
                  value={
                    soil.organic_carbon == null
                      ? "—"
                      : `${soil.organic_carbon}%`
                  }
                  description={hi ? "रिपोर्ट से" : "From report"}
                />

                <Property
                  icon={<Droplets size={18} />}
                  iconClass="bg-sky-50 text-sky-600"
                  label={hi ? "नमी" : "Moisture"}
                  value={soil.moisture == null ? "—" : `${soil.moisture}%`}
                  description={hi ? "रिपोर्ट से" : "From report"}
                />
              </div>

              <div className="mt-5 flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                  <Gauge size={17} />
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-700">
                    {hi ? "डेटा सफलतापूर्वक सेव है" : "Data saved successfully"}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-5 text-slate-400">
                    {hi
                      ? "आप बाद में रिपोर्ट के आंकड़े अपडेट कर सकते हैं।"
                      : "You can update the report measurements later."}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {hi ? "पोषक तत्व विश्लेषण" : "Nutrient analysis"}
              </p>

              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                {hi ? "NPK स्तर" : "NPK levels"}
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {nutrientCards.map((nutrient) => {
                const Icon = nutrient.icon;
                const available = nutrient.value !== null && nutrient.value !== undefined;

                return (
                  <div
                    key={nutrient.name}
                    className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${nutrient.iconClass}`}
                      >
                        <Icon size={21} />
                      </div>

                      <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                        {available
                          ? hi
                            ? "उपलब्ध"
                            : "Available"
                          : hi
                            ? "उपलब्ध नहीं"
                            : "Not available"}
                      </span>
                    </div>

                    <div className="mt-5">
                      <p className="text-xs font-medium text-slate-400">
                        {nutrient.name} ({nutrient.short})
                      </p>

                      <div className="mt-1 flex items-end gap-2">
                        <p className="text-2xl font-bold tracking-tight text-slate-900">
                          {available ? nutrient.value : "—"}
                        </p>

                        {available && (
                          <p className="mb-1 text-xs text-slate-400">
                            {nutrient.unit}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                <Info size={21} />
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-sky-600">
                  {hi ? "महत्वपूर्ण" : "Important"}
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  {hi
                    ? "फसल की सिफारिश अभी नहीं दिखाई जा रही"
                    : "Crop recommendations are not shown yet"}
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  {hi
                    ? "सही फसल उपयुक्तता और उर्वरक सलाह के लिए मिट्टी के वास्तविक डेटा के साथ फसल, क्षेत्र और कृषि मानकों को भी जोड़ना जरूरी है। हम बिना पर्याप्त डेटा के अनुमानित स्कोर नहीं दिखाएंगे।"
                    : "Accurate crop suitability and fertilizer advice require real soil data along with crop, location and agronomic standards. We will not show estimated scores without sufficient data."}
                </p>

                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                >
                  {hi ? "डेटा अपडेट करें" : "Update data"}
                  <ArrowUpRight size={15} />
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-sky-500 shadow-sm">
          <Droplets size={17} />
        </div>

        <div>
          <p className="text-xs font-bold text-slate-700">
            {hi ? "मिट्टी डेटा स्रोत" : "Soil data source"}
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {hi
              ? "अभी इस पेज पर वही आंकड़े दिखाए जाते हैं जो आप मिट्टी की जांच से दर्ज करके सेव करेंगे। कोई डेमो वैल्यू अपने आप नहीं जोड़ी जाती।"
              : "This page shows only measurements that you enter and save from a soil test. No demonstration values are added automatically."}
          </p>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  {hi ? "मिट्टी जांच" : "Soil test"}
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {hi ? "मिट्टी का डेटा दर्ज करें" : "Enter soil data"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {hi
                    ? "अपनी मिट्टी की जांच रिपोर्ट से मान भरें।"
                    : "Enter the values from your soil-test report."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveSoil} className="mt-6 grid gap-4 sm:grid-cols-2">
              <InputField
                label="pH"
                value={form.ph}
                onChange={(value) => updateField("ph", value)}
                placeholder="e.g. 6.7"
                min="0"
                max="14"
                step="0.1"
              />

              <InputField
                label={hi ? "नमी (%)" : "Moisture (%)"}
                value={form.moisture}
                onChange={(value) => updateField("moisture", value)}
                placeholder="e.g. 64"
                min="0"
                max="100"
                step="0.1"
              />

              <InputField
                label={hi ? "नाइट्रोजन (kg/ha)" : "Nitrogen (kg/ha)"}
                value={form.nitrogen}
                onChange={(value) => updateField("nitrogen", value)}
                placeholder="e.g. 248"
                min="0"
                step="0.1"
              />

              <InputField
                label={hi ? "फॉस्फोरस (kg/ha)" : "Phosphorus (kg/ha)"}
                value={form.phosphorus}
                onChange={(value) => updateField("phosphorus", value)}
                placeholder="e.g. 32"
                min="0"
                step="0.1"
              />

              <InputField
                label={hi ? "पोटैशियम (kg/ha)" : "Potassium (kg/ha)"}
                value={form.potassium}
                onChange={(value) => updateField("potassium", value)}
                placeholder="e.g. 186"
                min="0"
                step="0.1"
              />

              <InputField
                label={hi ? "जैविक कार्बन (%)" : "Organic carbon (%)"}
                value={form.organic_carbon}
                onChange={(value) => updateField("organic_carbon", value)}
                placeholder="e.g. 0.82"
                min="0"
                step="0.01"
              />

              <div className="sm:col-span-2 rounded-2xl bg-amber-50 p-4 text-xs leading-5 text-amber-800">
                {hi
                  ? "सिर्फ अपनी वास्तविक मिट्टी जांच रिपोर्ट के आंकड़े भरें। अनुमान लगाकर नंबर न डालें।"
                  : "Enter only values from a real soil-test report. Do not guess the numbers."}
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:col-span-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  {hi ? "रद्द करें" : "Cancel"}
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="animate-spin" size={17} />
                  ) : (
                    <Save size={17} />
                  )}
                  {saving
                    ? hi
                      ? "सेव हो रहा है..."
                      : "Saving..."
                    : hi
                      ? "मिट्टी डेटा सेव करें"
                      : "Save soil data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  min,
  max,
  step,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-slate-700">
        {label}
      </span>

      <input
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
      />
    </label>
  );
}

function Property({ icon, iconClass, label, value, description }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconClass}`}
      >
        {icon}
      </div>

      <p className="mt-4 text-xs font-medium text-slate-400">{label}</p>

      <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs font-semibold text-emerald-600">
        {description}
      </p>
    </div>
  );
}

export default Soil;
