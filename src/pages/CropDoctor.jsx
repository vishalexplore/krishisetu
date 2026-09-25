import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Upload,
  ScanSearch,
  Leaf,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  ImagePlus,
  Sparkles,
  ShieldAlert,
  Sun,
  CircleCheck,
  Stethoscope,
  Bug,
  Activity,
  History,
  RefreshCw,
} from "lucide-react";

import { useLanguage } from "../i18n/LanguageContext";

const API_BASE ="https://krishisetu-kb9p.onrender.com";

function CropDoctor() {
  const { language } = useLanguage();
  const hi = language === "hi";

  const fileInputRef = useRef(null);

  const [image, setImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // HISTORY
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");

  // ---------------------------------------------------------
  // LOAD HISTORY
  // ---------------------------------------------------------

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      setHistoryError("");

      const response = await fetch(
        `${API_BASE}/crop-doctor/history?limit=10`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : hi
              ? "इतिहास लोड नहीं हो सका।"
              : "Could not load scan history."
        );
      }

      setHistory(
        Array.isArray(data.history)
          ? data.history
          : []
      );
    } catch (err) {
      console.error(
        "Crop Doctor history error:",
        err
      );

      setHistoryError(
        err.message ||
          (hi
            ? "इतिहास लोड नहीं हो सका।"
            : "Could not load scan history.")
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  // Load history when page opens
  useEffect(() => {
    loadHistory();
  }, []);

  // ---------------------------------------------------------
  // IMAGE HANDLING
  // ---------------------------------------------------------

  const handleImage = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(
        hi
          ? "कृपया सही इमेज चुनें।"
          : "Please select a valid image."
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(
        hi
          ? "इमेज का आकार 10 MB से कम होना चाहिए।"
          : "Image size must be less than 10 MB."
      );
      return;
    }

    if (image) {
      URL.revokeObjectURL(image);
    }

    const imageUrl = URL.createObjectURL(file);

    setImage(imageUrl);
    setSelectedFile(file);
    setResult(null);
    setError("");
  };

  const handleFileChange = (event) => {
    handleImage(event.target.files?.[0]);
  };

  // ---------------------------------------------------------
  // ANALYZE CROP
  // ---------------------------------------------------------

  const analyzeCrop = async () => {
    if (!selectedFile) {
      setError(
        hi
          ? "कृपया पहले फसल की फोटो अपलोड करें।"
          : "Please upload a crop image first."
      );
      return;
    }

    try {
      setAnalyzing(true);
      setResult(null);
      setError("");

      const formData = new FormData();

      formData.append(
        "image",
        selectedFile
      );

      const response = await fetch(
        `${API_BASE}/crop-doctor/analyze?language=${language}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : hi
              ? "AI जांच विफल हो गई।"
              : "AI analysis failed."
        );
      }

      setResult(data);

      // Refresh history after successful analysis
      await loadHistory();
    } catch (err) {
      console.error(
        "Crop Doctor error:",
        err
      );

      setError(
        typeof err.message === "string"
          ? err.message
          : hi
            ? "सर्वर से कनेक्ट नहीं हो पाया।"
            : "Could not connect to the AI server."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  // ---------------------------------------------------------
  // RESET
  // ---------------------------------------------------------

  const resetDiagnosis = () => {
    if (image) {
      URL.revokeObjectURL(image);
    }

    setImage(null);
    setSelectedFile(null);
    setResult(null);
    setError("");
    setAnalyzing(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ---------------------------------------------------------
  // RESULT HELPERS
  // ---------------------------------------------------------

  const confidence = Number(
    result?.confidence ?? 0
  );

  const diseaseText = stringifyValue(
    result?.disease
  );

  const isHealthy =
    diseaseText
      .toLowerCase()
      .includes("healthy") ||
    diseaseText
      .toLowerCase()
      .includes("no disease") ||
    diseaseText.includes("स्वस्थ") ||
    diseaseText.includes("कोई रोग");

  const symptoms = normalizeList(
    result?.symptoms
  );

  const actionText = stringifyValue(
    result?.action
  );

  const preventionText = stringifyValue(
    result?.prevention
  );

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 overflow-x-hidden">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>

          <div className="mb-2 flex items-center gap-2">

            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <ScanSearch size={16} />
            </span>

            <span className="text-xs font-bold uppercase tracking-[0.16em] text-red-600">
              {hi
                ? "AI फसल डॉक्टर"
                : "AI Crop Doctor"}
            </span>

          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {hi
              ? "फसल रोग की जांच"
              : "Crop Disease Diagnosis"}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {hi
              ? "फसल की साफ फोटो अपलोड करें और Google Gemini AI से प्रारंभिक रोग आकलन प्राप्त करें।"
              : "Upload a clear crop photo and get a preliminary disease assessment using Google Gemini AI."}
          </p>

        </div>

        {image && (
          <button
            type="button"
            onClick={resetDiagnosis}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 sm:w-auto"
          >
            <RotateCcw size={16} />

            {hi
              ? "फिर से शुरू करें"
              : "Start over"}
          </button>
        )}

      </section>

      {/* =====================================================
          FEATURES
      ====================================================== */}

      <section className="grid gap-3 sm:grid-cols-3">

        <Feature
          icon={Camera}
          title={hi ? "साफ फोटो" : "Clear photo"}
          text={
            hi
              ? "प्रभावित पत्ती की साफ फोटो लें"
              : "Capture the affected leaf clearly"
          }
        />

        <Feature
          icon={Sparkles}
          title="Gemini Vision AI"
          text={
            hi
              ? "Google Gemini फोटो का विश्लेषण करता है"
              : "Google Gemini analyzes the image"
          }
        />

        <Feature
          icon={ShieldCheck}
          title={hi ? "कार्रवाई की सलाह" : "Action guidance"}
          text={
            hi
              ? "बचाव और अगला कदम जानें"
              : "Get prevention and next steps"
          }
        />

      </section>

      {/* =====================================================
          WORKSPACE
      ====================================================== */}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.7fr)]">

        {/* UPLOAD */}

        <div className="min-w-0 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">

          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

            <div>

              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                {hi
                  ? "जांच कार्यक्षेत्र"
                  : "Diagnosis workspace"}
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-900">
                {hi
                  ? "फसल की फोटो अपलोड करें"
                  : "Upload crop image"}
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                {hi
                  ? "प्रभावित पत्ती की साफ और अच्छी रोशनी वाली फोटो लें।"
                  : "Use a clear photo of the affected leaf in good light."}
              </p>

            </div>

            {image && (
              <span className="flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700">
                <CircleCheck size={13} />
                {hi
                  ? "फोटो तैयार है"
                  : "Image ready"}
              </span>
            )}

          </div>

          <div className="mt-6">

            {!image ? (

              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="group relative flex min-h-[320px] w-full flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 text-center transition hover:border-emerald-300 hover:bg-emerald-50/30"
              >

                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                  <ImagePlus size={30} />
                </div>

                <h3 className="relative mt-5 text-base font-bold text-slate-800">
                  {hi
                    ? "फसल की फोटो अपलोड करें"
                    : "Upload a crop photo"}
                </h3>

                <p className="relative mt-2 max-w-md text-xs leading-5 text-slate-400">
                  {hi
                    ? "कैमरे से फोटो लें या अपने डिवाइस से फोटो चुनें।"
                    : "Take a photo or select an existing image from your device."}
                </p>

                <span className="relative mt-5 flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-sm">
                  <Upload size={15} />
                  {hi
                    ? "फोटो चुनें"
                    : "Choose image"}
                </span>

                <p className="relative mt-3 text-[10px] text-slate-400">
                  {hi
                    ? "अधिकतम 10 MB"
                    : "Maximum 10 MB"}
                </p>

              </button>

            ) : (

              <div className="group relative overflow-hidden rounded-3xl bg-slate-950">

                <img
                  src={image}
                  alt={
                    hi
                      ? "अपलोड की गई फसल की फोटो"
                      : "Uploaded crop"
                  }
                  className="h-[360px] w-full object-contain sm:h-[390px]"
                />

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5">

                  <div className="flex items-center justify-between gap-3">

                    <div className="min-w-0">

                      <p className="text-xs font-bold text-white">
                        {hi
                          ? "फसल की फोटो"
                          : "Crop image"}
                      </p>

                      <p className="mt-0.5 truncate text-[10px] text-white/70">
                        {selectedFile?.name}
                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      className="flex shrink-0 items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-[10px] font-bold text-slate-700 backdrop-blur transition hover:bg-white"
                    >
                      <Camera size={14} />

                      {hi
                        ? "बदलें"
                        : "Change"}
                    </button>

                  </div>

                </div>

              </div>

            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">

            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
            >

              <Camera size={17} />

              {image
                ? hi
                  ? "फोटो बदलें"
                  : "Change image"
                : hi
                  ? "फोटो लें / अपलोड करें"
                  : "Take / upload photo"}

            </button>

            <button
              type="button"
              onClick={analyzeCrop}
              disabled={!selectedFile || analyzing}
              className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {analyzing ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                  {hi
                    ? "AI जांच हो रही है..."
                    : "Analyzing with Gemini..."}
                </>
              ) : (
                <>
                  <ScanSearch size={17} />

                  {hi
                    ? "फसल की जांच करें"
                    : "Analyze crop"}
                </>
              )}

            </button>

          </div>

          {error && (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-red-700">

              <AlertTriangle
                size={18}
                className="mt-0.5 shrink-0"
              />

              <p className="text-xs leading-5">
                {error}
              </p>

            </div>
          )}

        </div>

        {/* HOW IT WORKS */}

        <section className="relative overflow-hidden rounded-3xl bg-emerald-700 p-6 text-white shadow-lg shadow-emerald-700/10">

          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-200">
            {hi
              ? "यह कैसे काम करता है"
              : "How it works"}
          </p>

          <h2 className="mt-2 text-xl font-bold">
            {hi
              ? "Google Gemini AI जांच"
              : "Google Gemini AI diagnosis"}
          </h2>

          <div className="mt-8 space-y-6">

            <Step
              number="01"
              icon={<Camera size={18} />}
              title={hi ? "फोटो लें" : "Capture"}
              text={
                hi
                  ? "प्रभावित पौधे की साफ फोटो लें।"
                  : "Take a clear photo of the affected plant."
              }
            />

            <Step
              number="02"
              icon={<ScanSearch size={18} />}
              title={hi ? "AI जांच" : "AI analysis"}
              text={
                hi
                  ? "Gemini Vision फोटो के लक्षणों का विश्लेषण करता है।"
                  : "Gemini Vision analyzes visual symptoms."
              }
            />

            <Step
              number="03"
              icon={<Bug size={18} />}
              title={
                hi
                  ? "रोग आकलन"
                  : "Disease assessment"
              }
              text={
                hi
                  ? "संभावित रोग और confidence score मिलता है।"
                  : "Get the possible disease and confidence score."
              }
            />

            <Step
              number="04"
              icon={<ShieldCheck size={18} />}
              title={hi ? "कार्रवाई करें" : "Act"}
              text={
                hi
                  ? "बचाव और अगले कदम की सलाह मिलती है।"
                  : "Get prevention and next-step guidance."
              }
            />

          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/10 p-4">

            <div className="flex gap-3">

              <ShieldAlert
                size={18}
                className="mt-0.5 shrink-0"
              />

              <p className="text-xs leading-5 text-emerald-100">
                {hi
                  ? "AI की जांच प्रारंभिक है। गंभीर या अनिश्चित मामलों में योग्य कृषि विशेषज्ञ से पुष्टि करवाएं।"
                  : "AI diagnosis is preliminary. Confirm serious or uncertain cases with a qualified agricultural expert."}
              </p>

            </div>

          </div>

        </section>

      </section>

      {/* =====================================================
          RESULT
      ====================================================== */}

      {result && (
        <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">

          <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50/80 to-white p-5 sm:p-6">

            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">

              <div className="flex items-start gap-4">

                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                    isHealthy
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-amber-100 text-amber-600"
                  }`}
                >

                  {isHealthy ? (
                    <CheckCircle2 size={24} />
                  ) : (
                    <AlertTriangle size={23} />
                  )}

                </div>

                <div className="min-w-0">

                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-600">
                    {hi
                      ? "AI जांच पूरी हुई"
                      : "AI analysis complete"}
                  </p>

                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                    {diseaseText || "—"}
                  </h2>

                  {result.crop && (
                    <p className="mt-1 text-xs text-slate-500">
                      {hi ? "फसल" : "Crop"}:{" "}
                      {stringifyValue(result.crop)}
                    </p>
                  )}

                </div>

              </div>

              <div className="flex flex-wrap items-center gap-2">

                <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-[10px] font-bold text-emerald-700">
                  {confidence}%
                  {" "}
                  {hi
                    ? "भरोसा"
                    : "confidence"}
                </span>

                {result.expert_required && (
                  <span className="rounded-full bg-amber-100 px-3 py-1.5 text-[10px] font-bold text-amber-700">
                    {hi
                      ? "विशेषज्ञ से पुष्टि करें"
                      : "Expert confirmation advised"}
                  </span>
                )}

              </div>

            </div>

          </div>

          <div className="p-5 sm:p-6">

            <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">

              {/* CONFIDENCE */}

              <div className="rounded-3xl bg-slate-50 p-5">

                <div className="flex items-center gap-2">

                  <Activity
                    size={17}
                    className="text-emerald-600"
                  />

                  <p className="text-xs font-semibold text-slate-500">
                    {hi
                      ? "AI भरोसा"
                      : "AI confidence"}
                  </p>

                </div>

                <p className="mt-3 text-4xl font-bold text-emerald-600">
                  {confidence}%
                </p>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-200">

                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{
                      width: `${Math.min(
                        Math.max(
                          confidence,
                          0
                        ),
                        100
                      )}%`,
                    }}
                  />

                </div>

                <p className="mt-3 text-[11px] leading-5 text-slate-400">
                  {hi
                    ? "यह score AI के visual analysis के confidence को दर्शाता है।"
                    : "This score represents the AI's confidence in its visual analysis."}
                </p>

                <div className="mt-5 rounded-2xl bg-white p-4">

                  <p className="text-[10px] font-semibold text-slate-400">
                    AI Provider
                  </p>

                  <p className="mt-1 text-xs font-bold text-slate-700">
                    {stringifyValue(
                      result.provider
                    ) ||
                      "Google Gemini"}
                  </p>

                  {result.model && (
                    <p className="mt-1 text-[9px] text-slate-400">
                      {stringifyValue(
                        result.model
                      )}
                    </p>
                  )}

                </div>

              </div>

              {/* SYMPTOMS */}

              <div className="rounded-3xl border border-slate-100 bg-white p-5">

                <div className="flex items-center gap-2">

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
                    <Stethoscope size={17} />
                  </div>

                  <div>

                    <h3 className="text-sm font-bold text-slate-900">
                      {hi
                        ? "देखे गए लक्षण"
                        : "Observed symptoms"}
                    </h3>

                    <p className="text-[10px] text-slate-400">
                      {hi
                        ? "Gemini Vision द्वारा पहचाने गए संकेत"
                        : "Signs identified by Gemini Vision"}
                    </p>

                  </div>

                </div>

                <div className="mt-5">

                  {symptoms.length > 0 ? (

                    <div className="space-y-2">

                      {symptoms.map(
                        (symptom, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 rounded-xl bg-slate-50 p-3"
                          >

                            <CheckCircle2
                              size={15}
                              className="mt-0.5 shrink-0 text-emerald-600"
                            />

                            <p className="text-xs leading-5 text-slate-600">
                              {stringifyValue(
                                symptom
                              )}
                            </p>

                          </div>
                        )
                      )}

                    </div>

                  ) : (

                    <p className="text-xs leading-5 text-slate-500">
                      {hi
                        ? "लक्षणों की विस्तृत जानकारी उपलब्ध नहीं है।"
                        : "Detailed symptom information is not available."}
                    </p>

                  )}

                </div>

              </div>

            </div>

            {/* ACTION */}

            <div className="mt-5">

              <AdviceCard
                title={
                  hi
                    ? "अनुशंसित कार्रवाई"
                    : "Recommended action"
                }
                text={
                  actionText ||
                  (hi
                    ? "स्थानीय कृषि विशेषज्ञ से सलाह लें।"
                    : "Consult a local agricultural expert.")
                }
                icon={<Leaf size={20} />}
                className="bg-emerald-50 text-emerald-700"
              />

            </div>

            {/* PREVENTION */}

            <div className="mt-4 rounded-3xl bg-sky-50 p-5 text-sky-700">

              <div className="flex items-center gap-2">

                <ShieldCheck size={20} />

                <h3 className="text-sm font-bold">
                  {hi
                    ? "बचाव"
                    : "Prevention"}
                </h3>

              </div>

              <p className="mt-3 text-xs leading-6">
                {preventionText ||
                  (hi
                    ? "फसल की नियमित निगरानी करें और प्रभावित पौधों को अलग रखें।"
                    : "Monitor the crop regularly and isolate clearly affected plants where practical.")}
              </p>

            </div>

            {/* EXPERT WARNING */}

            {result.expert_required && (
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4">

                <ShieldAlert
                  size={18}
                  className="mt-0.5 shrink-0 text-amber-600"
                />

                <div>

                  <p className="text-xs font-bold text-amber-800">
                    {hi
                      ? "कृषि विशेषज्ञ से पुष्टि जरूरी"
                      : "Expert confirmation recommended"}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-amber-800/80">
                    {hi
                      ? "AI का परिणाम प्रारंभिक है। गंभीर या अनिश्चित मामले में स्थानीय कृषि विशेषज्ञ या कृषि अधिकारी से पुष्टि करवाएं।"
                      : "The AI result is preliminary. For serious or uncertain cases, confirm with a local agricultural expert or agriculture officer."}
                  </p>

                </div>

              </div>
            )}

            {/* DISCLAIMER */}

            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">

              <ShieldAlert
                size={18}
                className="mt-0.5 shrink-0 text-slate-500"
              />

              <p className="text-xs leading-5 text-slate-500">
                {hi
                  ? "यह Google Gemini आधारित AI प्रारंभिक आकलन है। यह निश्चित प्रयोगशाला निदान नहीं है।"
                  : "This is a Google Gemini AI-assisted preliminary assessment, not a definitive laboratory diagnosis."}
              </p>

            </div>

          </div>

        </section>
      )}

      {/* =====================================================
          HISTORY
      ====================================================== */}

      <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div className="flex items-start gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <History size={20} />
            </div>

            <div>

              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                {hi
                  ? "पिछली जांच"
                  : "Previous scans"}
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-900">
                {hi
                  ? "Crop Doctor History"
                  : "Crop Doctor History"}
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                {hi
                  ? "आपकी पिछली फसल जांच यहां दिखाई जाएगी।"
                  : "Your previous crop diagnoses appear here."}
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={loadHistory}
            disabled={historyLoading}
            className="flex w-fit items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >

            <RefreshCw
              size={14}
              className={
                historyLoading
                  ? "animate-spin"
                  : ""
              }
            />

            {hi
              ? "Refresh"
              : "Refresh"}

          </button>

        </div>

        <div className="mt-5">

          {/* LOADING */}

          {historyLoading ? (

            <div className="flex items-center justify-center rounded-2xl bg-slate-50 p-10">

              <div className="flex items-center gap-2 text-xs text-slate-400">

                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" />

                {hi
                  ? "इतिहास लोड हो रहा है..."
                  : "Loading history..."}

              </div>

            </div>

          ) : historyError ? (

            <div className="rounded-2xl border border-red-100 bg-red-50 p-5">

              <div className="flex items-start gap-3 text-red-700">

                <AlertTriangle
                  size={18}
                  className="mt-0.5 shrink-0"
                />

                <div>

                  <p className="text-xs font-semibold">
                    {historyError}
                  </p>

                  <button
                    type="button"
                    onClick={loadHistory}
                    className="mt-2 text-[11px] font-bold underline"
                  >
                    {hi
                      ? "फिर कोशिश करें"
                      : "Try again"}
                  </button>

                </div>

              </div>

            </div>

          ) : history.length === 0 ? (

            <div className="rounded-2xl bg-slate-50 p-10 text-center">

              <Leaf
                size={30}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 text-sm font-semibold text-slate-600">
                {hi
                  ? "अभी कोई पुरानी जांच नहीं है"
                  : "No previous scans yet"}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {hi
                  ? "अपनी पहली फसल की जांच करें।"
                  : "Analyze your first crop image to create history."}
              </p>

            </div>

          ) : (

            <div className="space-y-3">

              {history.map((item) => {

                const historyDisease =
                  stringifyValue(
                    item.disease
                  ) || "Unknown";

                const historyCrop =
                  stringifyValue(
                    item.crop
                  ) || "Unknown";

                const historyConfidence =
                  Number(
                    item.confidence ?? 0
                  );

                const historySymptoms =
                  normalizeList(
                    item.symptoms
                  );

                const historyHealthy =
                  historyDisease
                    .toLowerCase()
                    .includes("healthy") ||
                  historyDisease
                    .toLowerCase()
                    .includes("no disease") ||
                  historyDisease.includes("स्वस्थ");

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-emerald-100 hover:bg-emerald-50/20"
                  >

                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">

                      <div className="flex min-w-0 items-start gap-3">

                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            historyHealthy
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-amber-100 text-amber-600"
                          }`}
                        >

                          {historyHealthy ? (
                            <CheckCircle2 size={18} />
                          ) : (
                            <Stethoscope size={18} />
                          )}

                        </div>

                        <div className="min-w-0">

                          <p className="truncate text-sm font-bold text-slate-800">
                            {historyDisease}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {hi
                              ? "फसल"
                              : "Crop"}
                            :{" "}
                            {historyCrop}
                          </p>

                          {item.created_at && (
                            <p className="mt-1 text-[10px] text-slate-400">
                              {formatDate(
                                item.created_at,
                                language
                              )}
                            </p>
                          )}

                        </div>

                      </div>

                      <span className="w-fit shrink-0 rounded-full bg-emerald-100 px-3 py-1.5 text-[10px] font-bold text-emerald-700">
                        {historyConfidence}%
                        {" "}
                        {hi
                          ? "भरोसा"
                          : "confidence"}
                      </span>

                    </div>

                    {historySymptoms.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">

                        {historySymptoms
                          .slice(0, 3)
                          .map(
                            (
                              symptom,
                              index
                            ) => (
                              <span
                                key={index}
                                className="rounded-lg bg-white px-2.5 py-1.5 text-[10px] text-slate-500"
                              >
                                {stringifyValue(
                                  symptom
                                )}
                              </span>
                            )
                          )}

                      </div>
                    )}

                  </div>
                );
              })}

            </div>

          )}

        </div>

      </section>

      {/* =====================================================
          EMPTY STATE
      ====================================================== */}

      {!result && !image && (
        <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">

          <Sun
            size={18}
            className="mt-0.5 shrink-0 text-emerald-600"
          />

          <p className="text-xs leading-5 text-slate-500">
            {hi
              ? "बेहतर परिणाम के लिए प्रभावित पत्ती की फोटो अच्छी रोशनी में लें और लक्षण साफ रखें।"
              : "For better results, photograph the affected leaf in good light and keep symptoms clearly visible."}
          </p>

        </div>
      )}

    </div>
  );
}


/* ============================================================
   HELPERS
============================================================ */

function stringifyValue(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map(stringifyValue)
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {

    const preferredKeys = [
      "text",
      "description",
      "symptom",
      "name",
      "label",
      "message",
      "value",
    ];

    for (const key of preferredKeys) {

      if (
        value[key] !== undefined &&
        value[key] !== null
      ) {

        const converted =
          stringifyValue(value[key]);

        if (converted) {
          return converted;
        }
      }
    }

    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }

  return String(value);
}


function normalizeList(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map(stringifyValue)
      .filter(Boolean);
  }

  if (typeof value === "object") {
    return [
      stringifyValue(value),
    ].filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\n|•|;/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [String(value)];
}


function formatDate(value, language) {
  try {
    return new Date(value).toLocaleString(
      language === "hi"
        ? "hi-IN"
        : "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  } catch {
    return String(value);
  }
}


/* ============================================================
   UI COMPONENTS
============================================================ */

function Feature({
  icon: Icon,
  title,
  text,
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        <Icon size={18} />
      </div>

      <div className="min-w-0">

        <p className="text-xs font-bold text-slate-800">
          {title}
        </p>

        <p className="mt-0.5 text-[10px] text-slate-400">
          {text}
        </p>

      </div>

    </div>
  );
}


function Step({
  number,
  icon,
  title,
  text,
}) {
  return (
    <div className="flex gap-3">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
        {icon}
      </div>

      <div>

        <div className="flex items-center gap-2">

          <span className="text-[10px] font-bold text-emerald-200">
            {number}
          </span>

          <p className="text-sm font-semibold">
            {title}
          </p>

        </div>

        <p className="mt-1 text-xs leading-5 text-emerald-100">
          {text}
        </p>

      </div>

    </div>
  );
}


function AdviceCard({
  title,
  text,
  icon,
  className,
}) {
  return (
    <div
      className={`rounded-3xl p-5 ${className}`}
    >

      <div className="flex items-center gap-2">

        {icon}

        <h3 className="text-sm font-bold">
          {title}
        </h3>

      </div>

      <p className="mt-3 text-xs leading-6 opacity-80">
        {text}
      </p>

    </div>
  );
}


export default CropDoctor;