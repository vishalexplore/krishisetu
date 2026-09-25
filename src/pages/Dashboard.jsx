import { useEffect, useState } from "react";
import {
  Sun,
  CloudSun,
  Droplets,
  Wind,
  Sprout,
  Map,
  Satellite,
  Stethoscope,
  Bot,
  ArrowUpRight,
  AlertTriangle,
  ThermometerSun,
  Leaf,
  Activity,
  ChevronRight,
  FlaskConical,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";

const API_BASE = "https://krishisetu-kb9p.onrender.com";

function Dashboard() {
  const { language, t } = useLanguage();
  const hi = language === "hi";

  const [farm, setFarm] = useState(null);
  const [weather, setWeather] = useState(null);
  const [soil, setSoil] = useState(null);
  const [satellite, setSatellite] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      // -----------------------------
      // FARM
      // -----------------------------

      const farmResponse = await fetch(`${API_BASE}/farms/`);

      if (!farmResponse.ok) {
        throw new Error("Could not load farm data");
      }

      const farms = await farmResponse.json();

      if (!farms || farms.length === 0) {
        setFarm(null);
        setWeather(null);
        setSoil(null);
        setSatellite(null);
        return;
      }

      const latestFarm = farms[0];
      setFarm(latestFarm);

      // -----------------------------
      // WEATHER
      // -----------------------------

      try {
  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${encodeURIComponent(latestFarm.latitude)}` +
    `&longitude=${encodeURIComponent(latestFarm.longitude)}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,sunrise,sunset` +
    `&timezone=auto` +
    `&forecast_days=7`;

  const weatherResponse = await fetch(weatherUrl);

  if (weatherResponse.ok) {
    const weatherData = await weatherResponse.json();
    setWeather(weatherData);
  } else {
    console.error("Weather API error:", weatherResponse.status);
    setWeather(null);
  }
} catch (weatherError) {
  console.error("Weather error:", weatherError);
  setWeather(null);
}
      // -----------------------------
      // SOIL
      // -----------------------------

      try {
        const soilResponse = await fetch(
          `${API_BASE}/soil/${latestFarm.id}`
        );

        if (soilResponse.ok) {
          const soilData = await soilResponse.json();
          setSoil(soilData);
        } else {
          setSoil(null);
        }
      } catch (soilError) {
        console.error("Soil error:", soilError);
        setSoil(null);
      }

      // -----------------------------
      // SATELLITE / NDVI
      // -----------------------------

      try {
        const satelliteResponse = await fetch(
          `${API_BASE}/satellite/farm/${latestFarm.id}?days=60`
        );

        if (satelliteResponse.ok) {
          const satelliteData = await satelliteResponse.json();
          setSatellite(satelliteData);
        } else {
          setSatellite(null);
        }
      } catch (satelliteError) {
        console.error("Satellite error:", satelliteError);
        setSatellite(null);
      }
    } catch (err) {
      console.error("Dashboard error:", err);

      setError(
        hi
          ? "डैशबोर्ड की जानकारी लोड नहीं हो पा रही है। कृपया बैकएंड चेक करें।"
          : "Dashboard data could not be loaded. Please check the backend."
      );
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // WEATHER
  // -----------------------------

  const current = weather?.current;

  const temperature = current
    ? `${Math.round(current.temperature_2m)}°C`
    : "—";

  const feelsLike = current
    ? hi
      ? `महसूस ${Math.round(current.apparent_temperature)}°C`
      : `Feels like ${Math.round(current.apparent_temperature)}°C`
    : "—";

  const humidity = current
    ? `${Math.round(current.relative_humidity_2m)}%`
    : "—";

  const wind = current
    ? `${Math.round(current.wind_speed_10m)} km/h`
    : "—";

  const weatherInfo = getWeatherInfo(
    current?.weather_code,
    language
  );

  const humidityStatus =
    current?.relative_humidity_2m >= 80
      ? t("weather", "highMoisture")
      : current?.relative_humidity_2m >= 50
        ? t("weather", "goodMoisture")
        : t("weather", "lowMoisture");

  const windStatus =
    current?.wind_speed_10m >= 30
      ? t("weather", "strongWind")
      : current?.wind_speed_10m >= 15
        ? t("weather", "moderateBreeze")
        : t("weather", "lightBreeze");

  const rainProbability =
    weather?.daily?.precipitation_probability_max?.[0];

  const rainStatus =
    rainProbability >= 60
      ? hi
        ? "ज्यादा"
        : "High"
      : rainProbability >= 30
        ? hi
          ? "मध्यम"
          : "Moderate"
        : hi
          ? "कम"
          : "Low";

  // -----------------------------
  // SMART REMINDER
  // -----------------------------

  const reminderText =
    satellite?.health === "Stressed" ||
    satellite?.health === "Very Low Vegetation"
      ? hi
        ? "Satellite NDVI फसल में stress दिखा रहा है। खेत की जांच करें।"
        : "Satellite NDVI indicates crop stress. Inspect the field."
      : rainProbability != null && rainProbability >= 60
        ? hi
          ? "आज बारिश की संभावना ज्यादा है। बिना जरूरत सिंचाई न करें।"
          : "Rain probability is high today. Avoid unnecessary irrigation."
        : current?.relative_humidity_2m >= 80
          ? hi
            ? "आज नमी ज्यादा है। फसल में fungal disease के लक्षण देखें।"
            : "Humidity is high. Check for possible fungal disease symptoms."
          : hi
            ? "आज मौसम ठीक है। फसल में होने वाले बदलावों पर नजर रखें।"
            : "Weather looks suitable today. Keep monitoring your crop.";

  // -----------------------------
  // LOADING
  // -----------------------------

  if (loading) {
    return (
      <div className="mx-auto max-w-[1500px]">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />

            <p className="mt-3 text-sm font-medium text-slate-500">
              {hi
                ? "डैशबोर्ड लोड हो रहा है..."
                : "Loading dashboard..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------
  // ERROR
  // -----------------------------

  if (error) {
    return (
      <div className="mx-auto max-w-[1500px]">
        <div className="rounded-3xl border border-red-100 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle
              className="mt-0.5 text-red-500"
              size={20}
            />

            <div>
              <h2 className="font-bold text-red-800">
                {hi
                  ? "डैशबोर्ड की जानकारी उपलब्ध नहीं"
                  : "Dashboard data unavailable"}
              </h2>

              <p className="mt-1 text-sm text-red-700/80">
                {error}
              </p>

              <button
                onClick={loadDashboard}
                className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
              >
                {hi ? "फिर कोशिश करें" : "Try again"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------
  // NO FARM
  // -----------------------------

  if (!farm) {
    return (
      <div className="mx-auto max-w-[1500px]">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Sprout size={25} />
          </div>

          <h1 className="mt-4 text-xl font-bold text-slate-900">
            {hi ? "पहले अपना खेत जोड़ें" : "Add your farm first"}
          </h1>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {hi
              ? "लाइव मौसम, मिट्टी और satellite information देखने के लिए पहले अपना खेत सेव करें।"
              : "Save your farm first to view live weather, soil and satellite information."}
          </p>

          <Link
            to="/farm"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white hover:bg-emerald-700"
          >
            {t("farm", "addFarm")}
            <ArrowUpRight size={14} />
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">

      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl bg-emerald-700 p-6 text-white shadow-sm sm:p-7">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 right-1/3 h-72 w-72 rounded-full bg-emerald-400/20" />

        <div className="relative grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-2xl">

            <div className="flex items-center gap-2 text-emerald-100">
              <Leaf size={17} />

              <span className="text-[10px] font-bold uppercase tracking-[0.16em]">
                {t("dashboard", "smartFarming")}
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-bold leading-tight sm:text-3xl">
              {hi
                ? "आपके खेत की पूरी स्थिति एक जगह।"
                : "Your complete farm status in one place."}
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-50/80">
              {farm.name} · {farm.crop} · {farm.area_acres}{" "}
              {hi ? "एकड़" : "acres"}.
              {" "}
              {hi
                ? "मौसम, मिट्टी और satellite data के साथ।"
                : "With weather, soil and satellite data."}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/farm"
                className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-white/30 bg-white px-4 py-2.5 text-xs font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
              >
                <Map size={15} />
                <span className="!text-emerald-700">
                  {t("dashboard", "viewMyFarm")}
                </span>
                <ArrowUpRight
                  size={14}
                  className="text-emerald-700"
                />
              </Link>

              <Link
                to="/advisor"
                className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-white/40 bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-900"
              >
                <Bot size={15} />
                {t("dashboard", "askAiAdvisor")}
              </Link>
            </div>
          </div>

          <div className="flex w-full items-center justify-center lg:w-[190px]">
            <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-[10px] border-white/15">
              <div className="absolute inset-2 rounded-full border-[5px] border-emerald-300/70 border-r-transparent border-b-transparent -rotate-45" />

              <div className="text-center">
                <p className="text-3xl font-bold">
                  {satellite?.analysis_available ? "✓" : "—"}
                </p>

                <p className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-emerald-100">
                  {satellite?.analysis_available
                    ? hi
                      ? "Satellite active"
                      : "Satellite active"
                    : hi
                      ? "Analysis"
                      : "Analysis"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK STATS */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

        <StatCard
          icon={ThermometerSun}
          label={t("dashboard", "temperature")}
          value={temperature}
          detail={feelsLike}
          iconClass="bg-amber-50 text-amber-600"
        />

        <StatCard
          icon={Droplets}
          label={t("dashboard", "humidity")}
          value={humidity}
          detail={humidityStatus}
          iconClass="bg-sky-50 text-sky-600"
        />

        <StatCard
          icon={Satellite}
          label="NDVI"
          value={
            satellite?.ndvi != null
              ? satellite.ndvi
              : "—"
          }
          detail={
            satellite?.health ||
            (hi ? "उपलब्ध नहीं" : "Unavailable")
          }
          iconClass="bg-violet-50 text-violet-600"
        />

        <StatCard
          icon={Sprout}
          label={t("dashboard", "crop")}
          value={farm.crop || "—"}
          detail={`${farm.area_acres} ${
            hi ? "एकड़" : "acres"
          }`}
          iconClass="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* DATA OVERVIEW */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            {hi ? "फार्म डेटा" : "Farm data"}
          </p>

          <h2 className="mt-1 text-lg font-bold text-slate-900">
            {hi
              ? "आपके खेत की वर्तमान स्थिति"
              : "Current farm status"}
          </h2>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

          <DataStatusCard
            icon={Sprout}
            title={hi ? "फसल" : "Crop"}
            value={farm.crop || "—"}
            status={hi ? "Farm data" : "Farm data"}
          />

          <DataStatusCard
            icon={FlaskConical}
            title={hi ? "मिट्टी" : "Soil"}
            value={
              soil
                ? `pH ${soil.ph ?? "—"}`
                : hi
                  ? "डेटा नहीं"
                  : "No data"
            }
            status={
              soil
                ? hi
                  ? "Soil test available"
                  : "Soil test available"
                : hi
                  ? "Test required"
                  : "Test required"
            }
            good={!!soil}
          />

          <DataStatusCard
            icon={Satellite}
            title="Sentinel-2 NDVI"
            value={
              satellite?.ndvi != null
                ? satellite.ndvi
                : "—"
            }
            status={
              satellite?.health ||
              (hi ? "डेटा नहीं" : "No data")
            }
            good={!!satellite?.analysis_available}
          />

          <DataStatusCard
            icon={Activity}
            title={hi ? "Satellite images" : "Satellite images"}
            value={
              satellite?.image_count != null
                ? satellite.image_count
                : "—"
            }
            status={
              satellite?.latest_image_date
                ? `${hi ? "Latest" : "Latest"} ${satellite.latest_image_date}`
                : hi
                  ? "उपलब्ध नहीं"
                  : "Unavailable"
            }
            good={!!satellite?.analysis_available}
          />

        </div>
      </section>

      {/* MAIN GRID */}
      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">

        {/* LEFT */}
        <div className="space-y-5">

          {/* WEATHER */}
          <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">

            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  {hi ? "मौसम" : "Weather"}
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  {t("dashboard", "todaysConditions")}
                </h2>
              </div>

              <Link
                to="/weather"
                className="flex items-center gap-1 text-[10px] font-bold text-emerald-600"
              >
                {t("dashboard", "fullForecast")}
                <ChevronRight size={14} />
              </Link>
            </div>

            <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">

              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
                  <WeatherIcon
                    code={current?.weather_code}
                    size={34}
                  />
                </div>

                <div>
                  <p className="text-3xl font-bold tracking-tight text-slate-900">
                    {temperature}
                  </p>

                  <p className="mt-0.5 text-xs text-slate-400">
                    {weatherInfo.label}
                  </p>
                </div>
              </div>

              <div className="h-px w-full bg-slate-100 sm:h-12 sm:w-px" />

              <div className="grid flex-1 grid-cols-3 gap-3">
                <WeatherMini
                  icon={Droplets}
                  label={t("dashboard", "humidity")}
                  value={humidity}
                />

                <WeatherMini
                  icon={Wind}
                  label={t("dashboard", "windSpeed")}
                  value={wind}
                />

                <WeatherMini
                  icon={Sun}
                  label={t("dashboard", "rainChance")}
                  value={
                    rainProbability != null
                      ? `${rainProbability}%`
                      : "—"
                  }
                />
              </div>
            </div>
          </section>

          {/* FARM */}
          <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">

            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  {t("dashboard", "myFarm")}
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  {t("dashboard", "farmOverview")}
                </h2>
              </div>

              <Link
                to="/farm"
                className="flex items-center gap-1 text-[10px] font-bold text-emerald-600"
              >
                {t("common", "viewDetails")}
                <ChevronRight size={14} />
              </Link>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <FarmMetric
                icon={Sprout}
                label={t("dashboard", "primaryCrop")}
                value={farm.crop || "—"}
              />

              <FarmMetric
                icon={Map}
                label={t("dashboard", "farmArea")}
                value={`${farm.area_acres} ${
                  hi ? "एकड़" : "acres"
                }`}
              />

              <FarmMetric
                icon={Activity}
                label={t("dashboard", "farmStatus")}
                value={t("dashboard", "active")}
              />
            </div>
          </section>
        </div>

        {/* RIGHT */}
        <div className="space-y-5">

          {/* SATELLITE */}
          <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">

            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  {hi ? "सैटेलाइट" : "Satellite"}
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  {hi
                    ? "फसल की सैटेलाइट स्थिति"
                    : "Satellite crop health"}
                </h2>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Satellite size={17} />
              </div>
            </div>

            {satellite?.analysis_available ? (
              <div className="mt-5">

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-4xl font-bold text-slate-900">
                      {satellite.ndvi}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      NDVI
                    </p>
                  </div>

                  <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700">
                    {satellite.health}
                  </span>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{
                      width: `${Math.min(
                        Math.max(
                          ((satellite.ndvi + 0.2) / 1) * 100,
                          0
                        ),
                        100
                      )}%`,
                    }}
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <MiniValue
                    label={hi ? "Images" : "Images"}
                    value={satellite.image_count}
                  />

                  <MiniValue
                    label={hi ? "Latest" : "Latest"}
                    value={
                      satellite.latest_image_date || "—"
                    }
                  />
                </div>

              </div>
            ) : (
              <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-center">
                <Satellite
                  size={25}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-2 text-xs font-semibold text-slate-600">
                  {hi
                    ? "Satellite analysis उपलब्ध नहीं है"
                    : "Satellite analysis unavailable"}
                </p>
              </div>
            )}

            <Link
              to="/satellite"
              className="mt-5 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-[10px] font-bold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
            >
              {hi
                ? "Satellite analysis खोलें"
                : "Open satellite analysis"}
              <ChevronRight size={13} />
            </Link>
          </section>

          {/* SOIL */}
          <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">

            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  {hi ? "मिट्टी" : "Soil"}
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  {hi
                    ? "मिट्टी की जांच"
                    : "Soil test"}
                </h2>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <FlaskConical size={17} />
              </div>
            </div>

            {soil ? (
              <div className="mt-5 grid grid-cols-3 gap-2">
                <SoilMini label="pH" value={soil.ph} />
                <SoilMini label="N" value={soil.nitrogen} />
                <SoilMini label="P" value={soil.phosphorus} />
                <SoilMini label="K" value={soil.potassium} />
                <SoilMini
                  label={hi ? "नमी" : "Moisture"}
                  value={
                    soil.moisture != null
                      ? `${soil.moisture}`
                      : "—"
                  }
                />
                <SoilMini
                  label="OC"
                  value={soil.organic_carbon}
                />
              </div>
            ) : (
              <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-center">
                <FlaskConical
                  size={25}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-2 text-xs font-semibold text-slate-600">
                  {hi
                    ? "Soil test data उपलब्ध नहीं है"
                    : "No soil test data available"}
                </p>
              </div>
            )}

            <Link
              to="/soil"
              className="mt-5 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-[10px] font-bold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
            >
              {hi
                ? "Soil details खोलें"
                : "Open soil details"}
              <ChevronRight size={13} />
            </Link>
          </section>
        </div>
      </div>

      {/* ALERT */}
      <section className="rounded-3xl border border-amber-100 bg-amber-50/70 p-5">

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-500 shadow-sm">
            <AlertTriangle size={18} />
          </div>

          <div>
            <p className="text-xs font-bold text-amber-800">
              {t("dashboard", "farmReminder")}
            </p>

            <p className="mt-1 text-[11px] leading-5 text-amber-700/70">
              {reminderText}
            </p>

            <Link
              to="/crop-doctor"
              className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-amber-700"
            >
              {hi
                ? "फसल डॉक्टर खोलें"
                : "Open Crop Doctor"}
              <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section>
        <div className="mb-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            {t("dashboard", "tools")}
          </p>

          <h2 className="mt-1 text-lg font-bold text-slate-900">
            {t("dashboard", "quickActions")}
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

          <QuickAction
            to="/farm"
            icon={Map}
            title={t("dashboard", "myFarm")}
            description={
              hi
                ? "अपने खेत का प्रबंधन करें"
                : "Manage your farm"
            }
          />

          <QuickAction
            to="/satellite"
            icon={Satellite}
            title={t("dashboard", "satellite")}
            description={
              hi
                ? "फसल की सेहत देखें"
                : "View crop health"
            }
          />

          <QuickAction
            to="/crop-doctor"
            icon={Stethoscope}
            title={t("dashboard", "cropDoctor")}
            description={
              hi
                ? "फसल की बीमारी जांचें"
                : "Check crop disease"
            }
          />

          <QuickAction
            to="/advisor"
            icon={Bot}
            title={t("dashboard", "aiAdvisor")}
            description={
              hi
                ? "AI से कृषि सलाह लें"
                : "Get AI farming advice"
            }
          />

        </div>
      </section>
    </div>
  );
}

// --------------------------------------------------
// WEATHER
// --------------------------------------------------

function getWeatherInfo(code, language) {
  const unavailable = {
    label:
      language === "hi"
        ? "मौसम उपलब्ध नहीं"
        : "Weather unavailable",
    icon: CloudSun,
  };

  if (code == null) return unavailable;

  if (code === 0) {
    return {
      label: language === "hi" ? "साफ आसमान" : "Clear sky",
      icon: Sun,
    };
  }

  if ([1, 2, 3].includes(code)) {
    return {
      label:
        language === "hi"
          ? "आंशिक बादल"
          : "Partly cloudy",
      icon: CloudSun,
    };
  }

  if ([45, 48].includes(code)) {
    return {
      label: language === "hi" ? "कोहरा" : "Foggy",
      icon: CloudSun,
    };
  }

  if ([51, 53, 55, 56, 57].includes(code)) {
    return {
      label:
        language === "hi"
          ? "बूंदाबांदी"
          : "Drizzle",
      icon: Droplets,
    };
  }

  if ([61, 63, 65, 66, 67].includes(code)) {
    return {
      label:
        language === "hi"
          ? "बारिश"
          : "Rain",
      icon: Droplets,
    };
  }

  if ([80, 81, 82].includes(code)) {
    return {
      label:
        language === "hi"
          ? "बारिश की फुहार"
          : "Rain showers",
      icon: Droplets,
    };
  }

  if ([95, 96, 99].includes(code)) {
    return {
      label:
        language === "hi"
          ? "आंधी-तूफान"
          : "Thunderstorm",
      icon: CloudSun,
    };
  }

  return {
    label:
      language === "hi"
        ? "बदलता मौसम"
        : "Variable weather",
    icon: CloudSun,
  };
}

function WeatherIcon({ code, size = 24 }) {
  const { language } = useLanguage();
  const { icon: Icon } = getWeatherInfo(code, language);

  return <Icon size={size} strokeWidth={1.7} />;
}

// --------------------------------------------------
// COMPONENTS
// --------------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  iconClass,
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold text-slate-400">
          {label}
        </span>

        <div
          className={`flex h-8 w-8 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={15} />
        </div>
      </div>

      <p className="mt-3 text-xl font-bold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-0.5 text-[10px] text-slate-400">
        {detail}
      </p>
    </div>
  );
}

function DataStatusCard({
  icon: Icon,
  title,
  value,
  status,
  good = true,
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="flex items-center gap-2">
        <Icon
          size={15}
          className={
            good
              ? "text-emerald-600"
              : "text-slate-400"
          }
        />

        <span className="text-[10px] font-semibold text-slate-400">
          {title}
        </span>
      </div>

      <p className="mt-2 text-sm font-bold text-slate-800">
        {value}
      </p>

      <p
        className={`mt-1 text-[9px] font-semibold ${
          good
            ? "text-emerald-600"
            : "text-slate-400"
        }`}
      >
        {status}
      </p>
    </div>
  );
}

function FarmMetric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="flex items-center gap-2">
        <Icon size={15} className="text-emerald-600" />

        <span className="text-[10px] font-semibold text-slate-400">
          {label}
        </span>
      </div>

      <p className="mt-2 text-sm font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function WeatherMini({ icon: Icon, label, value }) {
  return (
    <div>
      <Icon size={15} className="text-slate-400" />

      <p className="mt-1 text-xs font-bold text-slate-700">
        {value}
      </p>

      <p className="mt-0.5 text-[9px] text-slate-400">
        {label}
      </p>
    </div>
  );
}

function MiniValue({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[9px] text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-[10px] font-bold text-slate-700">
        {value}
      </p>
    </div>
  );
}

function SoilMini({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center">
      <p className="text-[9px] font-semibold text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xs font-bold text-slate-800">
        {value ?? "—"}
      </p>
    </div>
  );
}

function QuickAction({
  to,
  icon: Icon,
  title,
  description,
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white">
        <Icon size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-slate-800">
          {title}
        </p>

        <p className="mt-0.5 truncate text-[10px] text-slate-400">
          {description}
        </p>
      </div>

      <ArrowUpRight
        size={15}
        className="text-slate-300 transition group-hover:text-emerald-600"
      />
    </Link>
  );
}

export default Dashboard;