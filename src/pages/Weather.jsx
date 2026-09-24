import { useEffect, useState } from "react";
import {
  Sun,
  CloudSun,
  CloudRain,
  Cloud,
  Wind,
  Droplets,
  Thermometer,
  Umbrella,
  Sunrise,
  Sunset,
  MapPin,
  RefreshCw,
  Eye,
  Gauge,
  Leaf,
  Sprout,
  ArrowUpRight,
  CheckCircle2,
  CalendarDays,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { useLanguage } from "../i18n/LanguageContext";

const API_BASE = "http://127.0.0.1:8000";

function getWeatherInfo(code, language) {
  if (code === 0) {
    return {
      condition: language === "hi" ? "साफ आसमान" : "Clear sky",
      icon: Sun,
    };
  }

  if ([1, 2, 3].includes(code)) {
    return {
      condition:
        code === 1
          ? language === "hi"
            ? "मुख्यतः साफ"
            : "Mainly clear"
          : code === 2
          ? language === "hi"
            ? "आंशिक बादल"
            : "Partly cloudy"
          : language === "hi"
          ? "बादल छाए हुए"
          : "Overcast",
      icon: code === 2 ? CloudSun : Cloud,
    };
  }

  if ([45, 48].includes(code)) {
    return {
      condition: language === "hi" ? "कोहरा" : "Foggy",
      icon: Cloud,
    };
  }

  if ([51, 53, 55, 56, 57].includes(code)) {
    return {
      condition: language === "hi" ? "बूंदाबांदी" : "Drizzle",
      icon: CloudRain,
    };
  }

  if ([61, 63, 65, 66, 67].includes(code)) {
    return {
      condition: language === "hi" ? "बारिश" : "Rain",
      icon: CloudRain,
    };
  }

  if ([71, 73, 75, 77].includes(code)) {
    return {
      condition: language === "hi" ? "बर्फबारी" : "Snow",
      icon: Cloud,
    };
  }

  if ([80, 81, 82].includes(code)) {
    return {
      condition:
        language === "hi" ? "बारिश की फुहार" : "Rain showers",
      icon: CloudRain,
    };
  }

  if ([85, 86].includes(code)) {
    return {
      condition:
        language === "hi" ? "बर्फ की फुहार" : "Snow showers",
      icon: Cloud,
    };
  }

  if ([95, 96, 99].includes(code)) {
    return {
      condition:
        language === "hi" ? "आंधी-तूफान" : "Thunderstorm",
      icon: CloudRain,
    };
  }

  return {
    condition: language === "hi" ? "अज्ञात" : "Unknown",
    icon: CloudSun,
  };
}

function formatDay(dateString, index, language) {
  if (index === 0) {
    return language === "hi" ? "आज" : "Today";
  }

  return new Date(`${dateString}T12:00:00`).toLocaleDateString(
    language === "hi" ? "hi-IN" : "en-IN",
    {
      weekday: "short",
    }
  );
}

function formatTime(value) {
  if (!value) return "--";

  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getFieldActivity(wind, rainProbability, language) {
  if (rainProbability >= 70) {
    return language === "hi"
      ? "खेत में काम से बचें"
      : "Avoid field work";
  }

  if (rainProbability >= 40) {
    return language === "hi"
      ? "सावधानी से योजना बनाएं"
      : "Plan carefully";
  }

  if (wind >= 30) {
    return language === "hi"
      ? "तेज हवा की स्थिति"
      : "Windy conditions";
  }

  return language === "hi" ? "अच्छा" : "Good";
}

function Weather() {
  const { language, t } = useLanguage();

  const [farm, setFarm] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadWeather(showRefresh = false) {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const farmsResponse = await fetch(
        `${API_BASE}/farms/`
      );

      if (!farmsResponse.ok) {
        throw new Error(
          language === "hi"
            ? "खेत की जानकारी लोड नहीं हो सकी।"
            : "Unable to load farm information."
        );
      }

      const farms = await farmsResponse.json();

      if (!farms.length) {
        throw new Error(
          language === "hi"
            ? "कोई खेत नहीं मिला। पहले अपने खेत की लोकेशन सेव करें।"
            : "No farm found. Please save your farm location first."
        );
      }

      const selectedFarm = farms[0];

      setFarm(selectedFarm);

      const weatherResponse = await fetch(
        `${API_BASE}/weather/?latitude=${encodeURIComponent(
          selectedFarm.latitude
        )}&longitude=${encodeURIComponent(
          selectedFarm.longitude
        )}`
      );

      if (!weatherResponse.ok) {
        const data = await weatherResponse
          .json()
          .catch(() => null);

        throw new Error(
          data?.detail ||
            (language === "hi"
              ? "लाइव मौसम लोड नहीं हो सका।"
              : "Unable to load live weather.")
        );
      }

      const weatherData = await weatherResponse.json();

      setWeather(weatherData);
    } catch (err) {
      setError(
        err.message ||
          (language === "hi"
            ? "कुछ गलत हो गया।"
            : "Something went wrong.")
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadWeather();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2
            className="animate-spin text-sky-600"
            size={30}
          />

          <p className="text-sm font-semibold">
            {language === "hi"
              ? "लाइव मौसम लोड हो रहा है..."
              : "Loading live weather..."}
          </p>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="mx-auto max-w-2xl py-12">
        <div className="rounded-3xl border border-red-100 bg-white p-7 text-center shadow-sm">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <AlertCircle size={24} />
          </div>

          <h1 className="mt-4 text-xl font-bold text-slate-900">
            {language === "hi"
              ? "मौसम की जानकारी उपलब्ध नहीं"
              : "Weather unavailable"}
          </h1>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() => loadWeather(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-sky-700"
          >
            <RefreshCw size={15} />

            {language === "hi"
              ? "फिर से कोशिश करें"
              : "Try again"}
          </button>

        </div>
      </div>
    );
  }

  const current = weather.current;
  const daily = weather.daily;

  const currentInfo = getWeatherInfo(
    current.weather_code,
    language
  );

  const CurrentIcon = currentInfo.icon;

  const todayRain =
    daily.precipitation_probability_max?.[0] ?? 0;

  const fieldActivity = getFieldActivity(
    current.wind_speed_10m,
    todayRain,
    language
  );

  const forecast = daily.time.map((date, index) => ({
    day: formatDay(date, index, language),
    date,
    icon: getWeatherInfo(
      daily.weather_code[index],
      language
    ).icon,
    condition: getWeatherInfo(
      daily.weather_code[index],
      language
    ).condition,
    high: `${Math.round(
      daily.temperature_2m_max[index]
    )}°`,
    low: `${Math.round(
      daily.temperature_2m_min[index]
    )}°`,
    rain: `${daily.precipitation_probability_max[index] ?? 0}%`,
  }));

  const advisoryTitle =
    todayRain >= 50
      ? language === "hi"
        ? "बारिश की संभावना है — सिंचाई की योजना सावधानी से बनाएं"
        : "Rain is likely — plan irrigation carefully"
      : current.precipitation > 0
      ? language === "hi"
        ? "अभी बारिश हो रही है"
        : "Rain is currently occurring"
      : language === "hi"
      ? "अभी तेज बारिश की संभावना नहीं है"
      : "No significant rain currently expected";

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">

      {/* HEADER */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

        <div>
          <div className="mb-2 flex items-center gap-2">

            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <CloudSun size={16} />
            </div>

            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">
              {language === "hi"
                ? "लाइव मौसम"
                : "Live Weather"}
            </span>

          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            {language === "hi"
              ? "खेत का मौसम"
              : "Farm Weather"}
          </h1>

          <div className="mt-1.5 flex items-center gap-2 text-sm text-slate-500">
            <MapPin
              size={15}
              className="text-sky-500"
            />

            <span>
              {farm?.name ||
                (language === "hi"
                  ? "मेरा खेत"
                  : "My Farm")}{" "}
              ·{" "}
              {language === "hi"
                ? "खेत की लाइव लोकेशन"
                : "Live farm location"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadWeather(true)}
          disabled={refreshing}
          className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 disabled:opacity-60"
        >
          <RefreshCw
            size={15}
            className={
              refreshing ? "animate-spin" : ""
            }
          />

          {refreshing
            ? language === "hi"
              ? "रिफ्रेश हो रहा है..."
              : "Refreshing..."
            : language === "hi"
            ? "मौसम रिफ्रेश करें"
            : "Refresh weather"}
        </button>

      </section>

      {/* CURRENT WEATHER */}
      <section className="relative overflow-hidden rounded-[28px] bg-sky-700 p-5 text-white shadow-lg shadow-sky-900/10 sm:p-7">

        <div className="absolute -right-16 -top-20 h-60 w-60 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 right-20 h-64 w-64 rounded-full bg-sky-500/30" />

        <div className="relative grid gap-7 lg:grid-cols-[1fr_1.35fr] lg:items-center">

          <div>

            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold text-sky-100">
              <CurrentIcon size={13} />

              {language === "hi"
                ? "लाइव स्थिति"
                : "LIVE CONDITIONS"}
            </div>

            <div className="mt-5 flex items-center gap-4 sm:gap-5">

              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 sm:h-20 sm:w-20 sm:rounded-3xl">
                <CurrentIcon
                  size={42}
                  strokeWidth={1.5}
                />
              </div>

              <div>

                <div className="flex items-start">

                  <span className="text-5xl font-bold tracking-tight sm:text-6xl">
                    {Math.round(
                      current.temperature_2m
                    )}
                  </span>

                  <span className="mt-1.5 text-xl font-medium sm:mt-2 sm:text-2xl">
                    °C
                  </span>

                </div>

                <p className="mt-1 text-xs font-medium text-sky-100 sm:text-sm">
                  {currentInfo.condition}
                </p>

              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-sky-100">

              <span>
                {language === "hi"
                  ? "महसूस हो रहा है"
                  : "Feels like"}{" "}
                <strong className="text-white">
                  {Math.round(
                    current.apparent_temperature
                  )}
                  °C
                </strong>
              </span>

              <span className="h-1 w-1 rounded-full bg-sky-300" />

              <span>
                {fieldActivity}{" "}
                {language === "hi"
                  ? "खेत की स्थिति"
                  : "field conditions"}
              </span>

            </div>

          </div>

          {/* WEATHER STATS */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">

            <WeatherStat
              icon={<Droplets size={17} />}
              label={
                language === "hi"
                  ? "नमी"
                  : "Humidity"
              }
              value={`${current.relative_humidity_2m}%`}
            />

            <WeatherStat
              icon={<Wind size={17} />}
              label={
                language === "hi"
                  ? "हवा"
                  : "Wind"
              }
              value={`${Math.round(
                current.wind_speed_10m
              )} km/h`}
            />

            <WeatherStat
              icon={<Umbrella size={17} />}
              label={
                language === "hi"
                  ? "बारिश की संभावना"
                  : "Rain chance"
              }
              value={`${todayRain}%`}
            />

            <WeatherStat
              icon={<Gauge size={17} />}
              label={
                language === "hi"
                  ? "अभी बारिश"
                  : "Rain now"
              }
              value={`${current.precipitation} mm`}
            />

          </div>

        </div>
      </section>

      {/* FARMING ADVISORY */}
      <section className="overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-sm">

        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Umbrella size={21} />
          </div>

          <div className="min-w-0 flex-1">

            <div className="flex flex-wrap items-center gap-2">

              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-600">
                {language === "hi"
                  ? "कृषि सलाह"
                  : "Farming advisory"}
              </p>

              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold text-emerald-600">
                <CheckCircle2 size={11} />

                {language === "hi"
                  ? "लाइव मौसम पर आधारित"
                  : "Live weather based"}
              </span>

            </div>

            <h2 className="mt-1 text-base font-bold text-slate-900 sm:text-lg">
              {advisoryTitle}
            </h2>

            <p className="mt-1.5 max-w-3xl text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">
              {language === "hi"
                ? `आज बारिश की अधिकतम संभावना ${todayRain}% है। सिंचाई या खेत में काम करने से पहले इस लाइव मौसम की जानकारी को अपनी फसल और मिट्टी की स्थिति के साथ देखें।`
                : `Today's maximum rain probability is ${todayRain}%. Use this live forecast together with your crop and soil conditions before irrigation or field work.`}
            </p>

          </div>

        </div>

      </section>

      {/* FORECAST */}
      <section>

        <div className="mb-4 flex items-end justify-between">

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              {language === "hi"
                ? "पूर्वानुमान"
                : "Forecast"}
            </p>

            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              {language === "hi"
                ? "7 दिन का मौसम"
                : "7-day forecast"}
            </h2>
          </div>

          <div className="hidden items-center gap-1.5 text-xs font-medium text-slate-400 sm:flex">
            <Eye size={14} />

            {language === "hi"
              ? "दैनिक जानकारी"
              : "Daily outlook"}
          </div>

        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">

          {forecast.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={item.date}
                className={`rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                  index === 0
                    ? "border-sky-200 ring-1 ring-sky-100"
                    : "border-slate-200/80"
                }`}
              >

                <div className="flex items-center justify-between">

                  <p className="text-sm font-bold text-slate-800">
                    {item.day}
                  </p>

                  {index === 0 && (
                    <span className="rounded-full bg-sky-50 px-2 py-1 text-[8px] font-bold text-sky-600">
                      {language === "hi"
                        ? "अभी"
                        : "NOW"}
                    </span>
                  )}

                </div>

                <div className="my-4 flex items-center justify-between">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                    <Icon
                      size={26}
                      strokeWidth={1.6}
                    />
                  </div>

                  <div className="text-right">

                    <p className="text-xl font-bold text-slate-900">
                      {item.high}
                    </p>

                    <p className="mt-0.5 text-xs font-medium text-slate-400">
                      {item.low}
                    </p>

                  </div>

                </div>

                <p className="text-[11px] font-medium text-slate-500">
                  {item.condition}
                </p>

                <div className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-[10px] font-bold text-sky-600">

                  <Droplets size={12} />

                  {item.rain}{" "}
                  {language === "hi"
                    ? "बारिश"
                    : "rain"}

                </div>

              </div>
            );
          })}

        </div>

      </section>

      {/* FIELD CONDITIONS */}
      <section>

        <div className="mb-4">

          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">
            {language === "hi"
              ? "खेत की स्थिति"
              : "Field conditions"}
          </p>

          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
            {language === "hi"
              ? "आज के उपयोगी संकेतक"
              : "Today's useful indicators"}
          </h2>

        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

          <InfoCard
            icon={<Thermometer size={20} />}
            iconClass="bg-orange-50 text-orange-500"
            label={
              language === "hi"
                ? "महसूस होने वाला तापमान"
                : "Feels like"
            }
            value={`${Math.round(
              current.apparent_temperature
            )}°C`}
            detail={
              language === "hi"
                ? "वर्तमान मौसम के आधार पर"
                : "Based on current conditions"
            }
          />

          <InfoCard
            icon={<Droplets size={20} />}
            iconClass="bg-sky-50 text-sky-600"
            label={
              language === "hi"
                ? "नमी"
                : "Humidity"
            }
            value={`${current.relative_humidity_2m}%`}
            detail={
              language === "hi"
                ? "वर्तमान हवा की नमी"
                : "Current relative humidity"
            }
          />

          <InfoCard
            icon={<Wind size={20} />}
            iconClass="bg-violet-50 text-violet-600"
            label={
              language === "hi"
                ? "हवा"
                : "Wind"
            }
            value={`${Math.round(
              current.wind_speed_10m
            )} km/h`}
            detail={
              language === "hi"
                ? "वर्तमान हवा की गति"
                : "Current wind speed"
            }
          />

          <InfoCard
            icon={<Sprout size={20} />}
            iconClass="bg-emerald-50 text-emerald-600"
            label={
              language === "hi"
                ? "खेत में गतिविधि"
                : "Field activity"
            }
            value={fieldActivity}
            detail={
              language === "hi"
                ? "बारिश और हवा के आधार पर"
                : "Based on rain and wind"
            }
          />

        </div>

      </section>

      {/* SUN INFORMATION */}
      <section>

        <div className="mb-4">

          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange-500">
            {language === "hi"
              ? "दिन की रोशनी"
              : "Daylight"}
          </p>

          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
            {language === "hi"
              ? "सूर्योदय और सूर्यास्त"
              : "Sunrise & sunset"}
          </h2>

        </div>

        <div className="grid gap-3 sm:grid-cols-2">

          <SunCard
            icon={<Sunrise size={22} />}
            iconClass="bg-orange-50 text-orange-500"
            label={
              language === "hi"
                ? "सूर्योदय"
                : "Sunrise"
            }
            time={formatTime(daily.sunrise?.[0])}
            detail={
              language === "hi"
                ? "दिन की शुरुआत"
                : "Start of daylight"
            }
          />

          <SunCard
            icon={<Sunset size={22} />}
            iconClass="bg-indigo-50 text-indigo-500"
            label={
              language === "hi"
                ? "सूर्यास्त"
                : "Sunset"
            }
            time={formatTime(daily.sunset?.[0])}
            detail={
              language === "hi"
                ? "दिन का अंत"
                : "End of daylight"
            }
          />

        </div>

      </section>

      {/* WEATHER NOTE */}
      <div className="flex gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-4">

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
          <Leaf size={17} />
        </div>

        <div>

          <p className="text-xs font-bold text-slate-700">
            {language === "hi"
              ? "लाइव मौसम पर आधारित खेती"
              : "Live weather-based farming"}
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {language === "hi"
              ? "मौसम की जानकारी आपके सेव किए गए खेत के निर्देशांकों से प्राप्त की जाती है। सिंचाई और खेत के काम की योजना बनाते समय इसे अपनी वास्तविक मिट्टी और फसल की स्थिति के साथ उपयोग करें।"
              : "Weather data is fetched using your saved farm coordinates. Use it together with your actual soil and crop conditions when planning irrigation and field activities."}
          </p>

        </div>

      </div>

    </div>
  );
}

function WeatherStat({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-3.5 backdrop-blur-sm">

      <div className="flex items-center gap-2 text-sky-100">
        {icon}

        <span className="text-[10px] font-medium">
          {label}
        </span>
      </div>

      <p className="mt-2 text-sm font-bold">
        {value}
      </p>

    </div>
  );
}

function InfoCard({
  icon,
  iconClass,
  label,
  value,
  detail,
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">

      <div className="flex items-start justify-between">

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>

        <ArrowUpRight
          size={15}
          className="text-slate-300"
        />

      </div>

      <p className="mt-4 text-[10px] font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-[10px] text-slate-400">
        {detail}
      </p>

    </div>
  );
}

function SunCard({
  icon,
  iconClass,
  label,
  time,
  detail,
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">

      <div className="flex items-center gap-4">

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>

        <div>

          <p className="text-[10px] font-medium text-slate-400">
            {label}
          </p>

          <p className="mt-1 text-xl font-bold text-slate-900">
            {time}
          </p>

          <p className="mt-0.5 text-[10px] text-slate-400">
            {detail}
          </p>

        </div>

      </div>

      <CalendarDays
        size={17}
        className="text-slate-300"
      />

    </div>
  );
}

export default Weather;