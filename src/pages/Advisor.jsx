import { useEffect, useState } from "react";
import {
  Bot,
  Sprout,
  MapPin,
  Send,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  Leaf,
  Satellite,
  FlaskConical,
} from "lucide-react";

import { useLanguage } from "../i18n/LanguageContext";

const API_BASE_URL = "https://krishisetu-kb9p.onrender.com";

function Advisor() {
  const { language } = useLanguage();
  const hi = language === "hi";

  const [farms, setFarms] = useState([]);
  const [farmId, setFarmId] = useState("");
  const [problem, setProblem] = useState("");

  const [advice, setAdvice] = useState("");
  const [advisorData, setAdvisorData] = useState(null);

  const [loadingFarms, setLoadingFarms] = useState(true);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  // --------------------------------------------------
  // LOAD FARMS
  // --------------------------------------------------

  useEffect(() => {
    const loadFarms = async () => {
      try {
        setLoadingFarms(true);
        setError("");

        const response = await fetch(`${API_BASE_URL}/farms/`);

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.detail ||
              (hi
                ? "फार्म की जानकारी प्राप्त नहीं हो सकी।"
                : "Unable to load farms.")
          );
        }

        const farmList = Array.isArray(data)
          ? data
          : data?.farms || [];

        setFarms(farmList);

        if (farmList.length > 0) {
          setFarmId(String(farmList[0].id));
        }
      } catch (err) {
        setError(
          err.message ||
            (hi
              ? "फार्म लोड नहीं हो सके।"
              : "Unable to load farms.")
        );
      } finally {
        setLoadingFarms(false);
      }
    };

    loadFarms();
  }, [hi]);

  // --------------------------------------------------
  // SELECTED FARM
  // --------------------------------------------------

  const selectedFarm = farms.find(
    (farm) => String(farm.id) === String(farmId)
  );

  // --------------------------------------------------
  // ASK AI ADVISOR
  // --------------------------------------------------

  const askAdvisor = async (e) => {
    e.preventDefault();

    if (!farmId) {
      setError(
        hi
          ? "कृपया पहले अपना फार्म चुनें।"
          : "Please select a farm first."
      );
      return;
    }

    if (!problem.trim()) {
      setError(
        hi
          ? "कृपया अपनी समस्या बताएं।"
          : "Please describe your problem."
      );
      return;
    }

    setLoading(true);
    setAdvice("");
    setAdvisorData(null);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/advisor/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          farm_id: Number(farmId),
          problem: problem.trim(),
          language: language,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            (hi
              ? "अभी सलाह प्राप्त नहीं हो सकी।"
              : "Unable to get advice right now.")
        );
      }

      setAdvisorData(data);
      setAdvice(data.advice || "");
    } catch (err) {
      setError(
        err.message ||
          (hi
            ? "कुछ गलत हो गया। कृपया AI सेवा जांचें।"
            : "Something went wrong. Please check the AI service.")
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // RESET
  // --------------------------------------------------

  const resetAdvisor = () => {
    setProblem("");
    setAdvice("");
    setAdvisorData(null);
    setError("");

    if (farms.length > 0) {
      setFarmId(String(farms[0].id));
    }
  };

  return (
    <div className="mx-auto max-w-[1250px] space-y-6">

      {/* HEADER */}
      <div>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Bot size={17} />
          </div>

          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
            KrishiSetu AI
          </p>
        </div>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          {hi ? "कृषि AI सलाहकार" : "AI Farm Advisor"}
        </h1>

        <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
          {hi
            ? "अपने फार्म की वास्तविक जानकारी के आधार पर AI से खेती की सलाह पाएं।"
            : "Get AI-powered farming advice based on your real farm data."}
        </p>
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-sm sm:p-7">
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-emerald-500/10" />
        <div className="absolute -bottom-28 right-1/3 h-60 w-60 rounded-full bg-emerald-400/5" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
              <Sparkles size={21} />
            </div>

            <h2 className="mt-4 text-xl font-bold sm:text-2xl">
              {hi ? (
                <>
                  खेती के सवाल,
                  <span className="text-emerald-400">
                    {" "}आसान जवाब।
                  </span>
                </>
              ) : (
                <>
                  Your farming questions,
                  <span className="text-emerald-400">
                    {" "}answered intelligently.
                  </span>
                </>
              )}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              {hi
                ? "KrishiSetu आपके फार्म, मिट्टी और satellite NDVI data को Gemini AI के साथ इस्तेमाल करता है।"
                : "KrishiSetu uses your farm, soil and satellite NDVI data with Gemini AI."}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <AdvisorFeature
              icon={Lightbulb}
              text={hi ? "व्यावहारिक" : "Practical"}
            />

            <AdvisorFeature
              icon={Satellite}
              text={hi ? "Satellite" : "Satellite"}
            />

            <AdvisorFeature
              icon={ShieldCheck}
              text={hi ? "सुरक्षित" : "Safety first"}
            />
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">

        {/* FORM */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">

          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                {hi ? "अपना सवाल पूछें" : "Ask your question"}
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-900">
                {hi
                  ? "अपने फार्म के बारे में बताएं"
                  : "Tell us about your farm"}
              </h2>
            </div>

            {(problem || advice || error) && (
              <button
                type="button"
                onClick={resetAdvisor}
                className="flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[10px] font-semibold text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
              >
                <RotateCcw size={13} />
                {hi ? "रीसेट" : "Reset"}
              </button>
            )}
          </div>

          <form onSubmit={askAdvisor} className="mt-6 space-y-4">

            {/* FARM */}
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-700">
                {hi ? "फार्म चुनें" : "Select farm"}
              </label>

              <div className="relative">
                <Sprout
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  value={farmId}
                  onChange={(e) => {
                    setFarmId(e.target.value);
                    setAdvice("");
                    setAdvisorData(null);
                  }}
                  disabled={loadingFarms || farms.length === 0}
                  className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-slate-800 transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-50 disabled:opacity-60"
                >
                  {loadingFarms ? (
                    <option value="">
                      {hi
                        ? "फार्म लोड हो रहे हैं..."
                        : "Loading farms..."}
                    </option>
                  ) : farms.length === 0 ? (
                    <option value="">
                      {hi
                        ? "कोई फार्म नहीं मिला"
                        : "No farms found"}
                    </option>
                  ) : (
                    farms.map((farm) => (
                      <option key={farm.id} value={farm.id}>
                        {farm.name} — {farm.crop}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* FARM INFO */}
              {selectedFarm && (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <InfoMini
                    icon={Sprout}
                    label={hi ? "फसल" : "Crop"}
                    value={selectedFarm.crop || "—"}
                  />

                  <InfoMini
                    icon={Leaf}
                    label={hi ? "क्षेत्र" : "Area"}
                    value={`${selectedFarm.area_acres ?? "—"} ${
                      hi ? "एकड़" : "acres"
                    }`}
                  />

                  <InfoMini
                    icon={MapPin}
                    label={hi ? "Latitude" : "Latitude"}
                    value={selectedFarm.latitude ?? "—"}
                  />

                  <InfoMini
                    icon={MapPin}
                    label={hi ? "Longitude" : "Longitude"}
                    value={selectedFarm.longitude ?? "—"}
                  />
                </div>
              )}
            </div>

            {/* PROBLEM */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  {hi ? "क्या समस्या है?" : "What's the problem?"}
                </label>

                <span className="text-[10px] text-slate-400">
                  {hi
                    ? "जितना संभव हो विस्तार से बताएं"
                    : "Be as descriptive as possible"}
                </span>
              </div>

              <textarea
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                rows={7}
                placeholder={
                  hi
                    ? "उदाहरण: गेहूं की पत्तियां पीली हो रही हैं और छोटे भूरे धब्बे दिखाई दे रहे हैं..."
                    : "Example: Wheat leaves are turning yellow and small brown spots are appearing..."
                }
                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm leading-6 text-slate-800 transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-50"
              />
            </div>

            {/* CONTEXT PREVIEW */}
            {selectedFarm && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={15} className="text-emerald-600" />

                  <p className="text-xs font-bold text-emerald-800">
                    {hi
                      ? "AI को ये फार्म context मिलेगा"
                      : "AI will use this farm context"}
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                  <ContextBadge
                    icon={Sprout}
                    text={hi ? "Farm & Crop" : "Farm & Crop"}
                  />

                  <ContextBadge
                    icon={FlaskConical}
                    text={hi ? "Soil Test" : "Soil Test"}
                  />

                  <ContextBadge
                    icon={Satellite}
                    text="Sentinel-2 NDVI"
                  />

                  <ContextBadge
                    icon={Bot}
                    text="Google Gemini"
                  />
                </div>
              </div>
            )}

            {/* ERROR */}
            {error && (
              <div className="flex items-start gap-2.5 rounded-2xl border border-red-100 bg-red-50 p-3.5 text-xs text-red-700">
                <AlertCircle
                  size={16}
                  className="mt-0.5 shrink-0"
                />
                <span>{error}</span>
              </div>
            )}

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading || loadingFarms || !farmId}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-600/15 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                  {hi
                    ? "सलाह तैयार हो रही है..."
                    : "Getting AI advice..."}
                </>
              ) : (
                <>
                  <Send size={16} />

                  {hi
                    ? "AI से सलाह लें"
                    : "Ask AI Advisor"}
                </>
              )}
            </button>
          </form>

          {/* SAFETY NOTE */}
          <div className="mt-4 flex items-start gap-2 rounded-2xl bg-slate-50 p-3.5">
            <ShieldCheck
              size={15}
              className="mt-0.5 shrink-0 text-emerald-600"
            />

            <p className="text-[10px] leading-4 text-slate-400">
              {hi
                ? "AI की सलाह सामान्य कृषि जानकारी के लिए है। खाद या कीटनाशक इस्तेमाल करने से पहले उत्पाद का लेबल पढ़ें और स्थानीय कृषि विशेषज्ञ से सलाह लें।"
                : "AI guidance is for agricultural information. Follow product labels and consult a local agriculture expert before applying fertilizers or pesticides."}
            </p>
          </div>
        </section>

        {/* ANSWER */}
        <section className="rounded-3xl border border-slate-200/80 bg-white shadow-sm">

          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Bot size={19} />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  {hi ? "AI का जवाब" : "AI Response"}
                </p>

                <h2 className="mt-0.5 text-lg font-bold text-slate-900">
                  {hi ? "कृषि सलाहकार" : "Farm Advisor"}
                </h2>
              </div>
            </div>
          </div>

          <div className="min-h-[420px] p-5 sm:p-6">

            {/* EMPTY */}
            {!advice && !loading && (
              <div className="flex min-h-[360px] flex-col items-center justify-center text-center">

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
                  <Bot size={30} strokeWidth={1.6} />
                </div>

                <h3 className="mt-5 text-sm font-bold text-slate-800">
                  {hi
                    ? "आपकी सलाह यहां दिखाई देगी"
                    : "Your advice will appear here"}
                </h3>

                <p className="mt-1.5 max-w-sm text-xs leading-5 text-slate-400">
                  {hi
                    ? "अपना फार्म चुनें और समस्या बताएं। Gemini AI आपके फार्म के data के आधार पर सलाह देगा।"
                    : "Select your farm and describe the problem. Gemini AI will provide advice using your farm data."}
                </p>

                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <Suggestion
                    text={hi ? "पत्तियां पीली हैं" : "Yellow leaves"}
                  />

                  <Suggestion
                    text={hi ? "कीट की समस्या" : "Pest problem"}
                  />

                  <Suggestion
                    text={hi ? "फसल की वृद्धि कम है" : "Poor growth"}
                  />
                </div>
              </div>
            )}

            {/* LOADING */}
            {loading && (
              <div className="flex min-h-[360px] flex-col items-center justify-center text-center">

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
                  <span className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
                </div>

                <h3 className="mt-5 text-sm font-bold text-slate-800">
                  {hi
                    ? "आपके फार्म का विश्लेषण हो रहा है..."
                    : "Analyzing your farm..."}
                </h3>

                <p className="mt-1.5 text-xs text-slate-400">
                  {hi
                    ? "Farm + Soil + Satellite + Gemini"
                    : "Farm + Soil + Satellite + Gemini"}
                </p>
              </div>
            )}

            {/* ANSWER */}
            {advice && !loading && (
              <div>

                {/* SUCCESS */}
                <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
                  <CheckCircle2
                    size={16}
                    className="shrink-0 text-emerald-600"
                  />

                  <p className="text-xs font-semibold text-emerald-700">
                    {hi
                      ? "आपके फार्म के लिए AI सलाह तैयार है"
                      : "AI advice generated for your farm"}
                  </p>
                </div>

                {/* DATA SUMMARY */}
                {advisorData && (
                  <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3">

                    <DataCard
                      icon={Sprout}
                      label={hi ? "फसल" : "Crop"}
                      value={advisorData.crop || "—"}
                    />

                    <DataCard
                      icon={Satellite}
                      label="NDVI"
                      value={
                        advisorData.ndvi !== null &&
                        advisorData.ndvi !== undefined
                          ? advisorData.ndvi
                          : "—"
                      }
                    />

                    <DataCard
                      icon={Leaf}
                      label={hi ? "Satellite health" : "Satellite health"}
                      value={
                        advisorData.satellite_health || "—"
                      }
                    />

                    <DataCard
                      icon={FlaskConical}
                      label={hi ? "Soil" : "Soil"}
                      value={
                        advisorData.soil_available
                          ? hi
                            ? "Available"
                            : "Available"
                          : hi
                          ? "नहीं"
                          : "Unavailable"
                      }
                    />

                    <DataCard
                      icon={Bot}
                      label={hi ? "AI" : "AI"}
                      value="Gemini"
                    />

                    <DataCard
                      icon={ShieldCheck}
                      label={hi ? "Provider" : "Provider"}
                      value="Google"
                    />
                  </div>
                )}

                {/* ADVICE */}
                <div className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                  {advice}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

// --------------------------------------------------
// SMALL COMPONENTS
// --------------------------------------------------

function AdvisorFeature({ icon: Icon, text }) {
  return (
    <div className="flex min-w-[78px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
      <Icon size={17} className="text-emerald-400" />

      <span className="mt-2 text-[9px] font-semibold text-slate-300">
        {text}
      </span>
    </div>
  );
}

function InfoMini({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
      <div className="flex items-center gap-1.5">
        <Icon size={11} className="text-emerald-600" />
        <span className="text-[9px] text-slate-400">
          {label}
        </span>
      </div>

      <p className="mt-1 truncate text-[10px] font-bold text-slate-700">
        {value}
      </p>
    </div>
  );
}

function ContextBadge({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-1.5 rounded-xl bg-white px-2.5 py-2 text-emerald-700 shadow-sm">
      <Icon size={12} />
      <span className="font-semibold">{text}</span>
    </div>
  );
}

function DataCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-center gap-1.5">
        <Icon size={12} className="text-emerald-600" />

        <span className="text-[9px] font-medium text-slate-400">
          {label}
        </span>
      </div>

      <p className="mt-1.5 truncate text-[11px] font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function Suggestion({ text }) {
  return (
    <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-400">
      {text}
    </span>
  );
}

export default Advisor;