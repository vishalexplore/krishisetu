import { useEffect, useRef, useState } from "react";
import {
  UserRound,
  MapPin,
  Sprout,
  Ruler,
  Pencil,
  Bell,
  ShieldCheck,
  ChevronRight,
  Leaf,
  CalendarDays,
  Tractor,
  Wheat,
  CheckCircle2,
  FileText,
  CreditCard,
  Landmark,
  Upload,
  Trash2,
  Eye,
  LogOut,
  Smartphone,
  MapPinned,
  Languages,
  Moon,
  LockKeyhole,
  BadgeCheck,
  CircleHelp,
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";

const API_BASE = "https://krishisetu-kb9p.onrender.com";

function Profile() {
  const { language, setLanguage } = useLanguage();
  const hi = language === "hi";

  const [profile, setProfile] = useState({
    name: "Farmer",
    mobile: "",
    village: "",
    district: "",
    state: "Uttar Pradesh",
    email: "",
  });

  const [editing, setEditing] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);

  const [farms, setFarms] = useState([]);
  const [notifications, setNotifications] = useState(true);
  const [weatherAlerts, setWeatherAlerts] = useState(true);
  const [farmAlerts, setFarmAlerts] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [message, setMessage] = useState("");

  const [profilePhoto, setProfilePhoto] = useState(
    () =>
      localStorage.getItem("krishisetu-profile-photo") || ""
  );

  const [documents, setDocuments] = useState({
    aadhaar: null,
    land: null,
    bank: null,
    kcc: null,
  });

  const [schemeStatus, setSchemeStatus] = useState({
    pmKisan: "pending",
    fasalBima: "pending",
    kcc: "pending",
  });

 useEffect(() => {
  fetchProfile();
  fetchFarms();

  const savedNotifications = localStorage.getItem(
    "krishisetu-notifications"
  );

  if (savedNotifications !== null) {
    setNotifications(savedNotifications === "true");
  }

  const savedWeather = localStorage.getItem(
    "krishisetu-weather-alerts"
  );

  if (savedWeather !== null) {
    setWeatherAlerts(savedWeather === "true");
  }

  const savedFarmAlerts = localStorage.getItem(
    "krishisetu-farm-alerts"
  );

  if (savedFarmAlerts !== null) {
    setFarmAlerts(savedFarmAlerts === "true");
  }

  const savedDarkMode = localStorage.getItem(
    "krishisetu-dark-mode"
  );

  const enabled = savedDarkMode === "true";

  setDarkMode(enabled);

  document.documentElement.classList.toggle(
    "dark",
    enabled
  );

  document.body.classList.toggle(
    "dark-mode",
    enabled
  );
}, []);

useEffect(() => {
  localStorage.setItem(
    "krishisetu-notifications",
    String(notifications)
  );
}, [notifications]);

useEffect(() => {
  localStorage.setItem(
    "krishisetu-weather-alerts",
    String(weatherAlerts)
  );
}, [weatherAlerts]);

useEffect(() => {
  localStorage.setItem(
    "krishisetu-farm-alerts",
    String(farmAlerts)
  );
}, [farmAlerts]);

function toggleDarkMode(value) {
  setDarkMode(value);

  localStorage.setItem(
    "krishisetu-dark-mode",
    String(value)
  );

  document.documentElement.classList.toggle(
    "dark",
    value
  );

  document.body.classList.toggle(
    "dark-mode",
    value
  );
}
  async function fetchProfile() {
    try {
      setProfileLoading(true);

      const response = await fetch(`${API_BASE}/profile/`);

      if (!response.ok) {
        throw new Error("Unable to fetch profile");
      }

      const data = await response.json();

      setProfile({
        name: data.name || "Farmer",
        mobile: data.mobile || "",
        village: data.village || "",
        district: data.district || "",
        state: data.state || "Uttar Pradesh",
        email: data.email || "",
      });
    } catch (error) {
      console.error("Profile fetch error:", error);

      showMessage(
        hi
          ? "प्रोफ़ाइल लोड नहीं हो सकी"
          : "Unable to load profile"
      );
    } finally {
      setProfileLoading(false);
    }
  }

  async function fetchFarms() {
    try {
      const response = await fetch(`${API_BASE}/farms/`);

      if (!response.ok) {
        throw new Error("Unable to fetch farms");
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setFarms(data);
      }
    } catch (error) {
      console.error("Farm fetch error:", error);
      setFarms([]);
    }
  }

  async function saveProfile() {
    try {
      setProfileSaving(true);

      const params = new URLSearchParams();

      params.append(
        "name",
        profile.name?.trim() || "Farmer"
      );

      if (profile.mobile?.trim()) {
        params.append("mobile", profile.mobile.trim());
      }

      if (profile.village?.trim()) {
        params.append("village", profile.village.trim());
      }

      if (profile.district?.trim()) {
        params.append("district", profile.district.trim());
      }

      params.append(
        "state",
        profile.state?.trim() || "Uttar Pradesh"
      );

      if (profile.email?.trim()) {
        params.append("email", profile.email.trim());
      }

      const response = await fetch(
        `${API_BASE}/profile/?${params.toString()}`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => null);

        throw new Error(
          errorData?.detail || "Unable to save profile"
        );
      }

      const data = await response.json();

      setProfile({
        name: data.name || "Farmer",
        mobile: data.mobile || "",
        village: data.village || "",
        district: data.district || "",
        state: data.state || "Uttar Pradesh",
        email: data.email || "",
      });

      setEditing(false);

      showMessage(
        hi
          ? "प्रोफ़ाइल PostgreSQL में सेव हो गई"
          : "Profile saved to PostgreSQL"
      );
    } catch (error) {
      console.error("Profile save error:", error);

      showMessage(
        hi
          ? "प्रोफ़ाइल सेव नहीं हो सकी"
          : "Unable to save profile"
      );
    } finally {
      setProfileSaving(false);
    }
  }

  function showMessage(text) {
    setMessage(text);

    setTimeout(() => {
      setMessage("");
    }, 2500);
  }

  function updateProfile(field, value) {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleProfilePhoto(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showMessage(
        hi
          ? "कृपया image फाइल चुनें"
          : "Please choose an image file"
      );

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showMessage(
        hi
          ? "फोटो 5 MB से कम होनी चाहिए"
          : "Photo must be smaller than 5 MB"
      );

      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = String(reader.result || "");

      setProfilePhoto(result);

      localStorage.setItem(
        "krishisetu-profile-photo",
        result
      );

      showMessage(
        hi
          ? "प्रोफ़ाइल फोटो सेव हो गई"
          : "Profile photo saved"
      );
    };

    reader.readAsDataURL(file);

    event.target.value = "";
  }

  function removeProfilePhoto() {
    setProfilePhoto("");

    localStorage.removeItem(
      "krishisetu-profile-photo"
    );

    showMessage(
      hi
        ? "प्रोफ़ाइल फोटो हटा दी गई"
        : "Profile photo removed"
    );
  }

  function handleDocumentUpload(type, event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type)) {
      showMessage(
        hi
          ? "केवल PDF या image फाइल अपलोड करें"
          : "Please upload a PDF or image file"
      );

      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showMessage(
        hi
          ? "फाइल 5 MB से कम होनी चाहिए"
          : "File must be smaller than 5 MB"
      );

      return;
    }

    setDocuments((current) => ({
      ...current,
      [type]: {
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
      },
    }));

    showMessage(
      hi
        ? "दस्तावेज़ चुना गया"
        : "Document selected"
    );

    event.target.value = "";
  }

  function removeDocument(type) {
    const existing = documents[type];

    if (existing?.url) {
      URL.revokeObjectURL(existing.url);
    }

    setDocuments((current) => ({
      ...current,
      [type]: null,
    }));

    showMessage(
      hi
        ? "दस्तावेज़ हटा दिया गया"
        : "Document removed"
    );
  }

  function requestLocation() {
    if (!navigator.geolocation) {
      showMessage(
        hi
          ? "आपके ब्राउज़र में location उपलब्ध नहीं है"
          : "Location is not available in your browser"
      );

      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationEnabled(true);

        showMessage(
          hi
            ? "Location permission मिल गई"
            : "Location permission granted"
        );
      },
      () => {
        setLocationEnabled(false);

        showMessage(
          hi
            ? "Location permission नहीं मिली"
            : "Location permission was not granted"
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }

  function toggleDarkMode(value) {
    setDarkMode(value);

    document.documentElement.classList.toggle(
      "dark",
      value
    );
  }

  function logout() {
    showMessage(
      hi
        ? "Logout feature अभी तैयार नहीं है"
        : "Logout feature is not connected yet"
    );
  }

  const primaryFarm = farms[0];

  const crop = primaryFarm?.crop || "Wheat";

  const area = primaryFarm?.area_acres;

  const location =
    primaryFarm?.latitude != null &&
    primaryFarm?.longitude != null
      ? `${Number(primaryFarm.latitude).toFixed(4)}, ${Number(
          primaryFarm.longitude
        ).toFixed(4)}`
      : hi
        ? "स्थान नहीं जोड़ा गया"
        : "Location not added";

  const sowingDate =
    primaryFarm?.sowing_date || null;

  return (
    <div className="mx-auto w-full max-w-[1180px] min-w-0 space-y-6 overflow-x-hidden pb-8">

      {message && (
        <div className="fixed right-4 top-20 z-[100] flex items-center gap-2 rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-xs font-semibold text-emerald-700 shadow-xl">
          <CheckCircle2 size={16} />
          {message}
        </div>
      )}

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
            {hi ? "खाता" : "Account"}
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            {hi ? "प्रोफ़ाइल" : "Profile"}
          </h1>

          <p className="mt-1.5 text-sm text-slate-500">
            {hi
              ? "अपनी किसान प्रोफ़ाइल, खेत और दस्तावेज़ प्रबंधित करें।"
              : "Manage your farmer profile, farms and documents."}
          </p>
        </div>

        <div className="flex w-fit items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
          <CheckCircle2
            size={15}
            className="text-emerald-600"
          />

          <span className="text-xs font-semibold text-emerald-700">
            {hi ? "खाता सक्रिय है" : "Account active"}
          </span>
        </div>
      </div>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">

        <div className="min-w-0 space-y-5">

          <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">

            <div className="flex items-start justify-between">

              <div className="relative h-20 w-20 shrink-0">

                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600">

                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt={
                        hi
                          ? "प्रोफ़ाइल फोटो"
                          : "Profile photo"
                      }
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound
                      size={35}
                      strokeWidth={1.8}
                    />
                  )}

                </div>

                <label
                  htmlFor="profile-photo-input"
                  className="absolute -bottom-2 -right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-emerald-600 text-white shadow-md transition hover:bg-emerald-700"
                  title={
                    hi
                      ? "फोटो बदलें"
                      : "Change photo"
                  }
                >
                  <Pencil size={13} />
                </label>

                <input
                  id="profile-photo-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleProfilePhoto}
                />

              </div>

              <button
                type="button"
                onClick={() => setEditing(!editing)}
                disabled={profileLoading || profileSaving}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Pencil size={13} />

                {editing
                  ? hi
                    ? "रद्द करें"
                    : "Cancel"
                  : hi
                    ? "प्रोफ़ाइल बदलें"
                    : "Edit profile"}
              </button>

            </div>

            {profilePhoto && (
              <button
                type="button"
                onClick={removeProfilePhoto}
                className="mt-3 text-[10px] font-bold text-red-500 hover:text-red-600"
              >
                {hi
                  ? "फोटो हटाएं"
                  : "Remove photo"}
              </button>
            )}

            <div className="mt-5">

              <div className="flex items-center gap-2">

                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  {profileLoading
                    ? hi
                      ? "लोड हो रहा है..."
                      : "Loading..."
                    : profile.name ||
                      (hi ? "किसान" : "Farmer")}
                </h2>

                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-600">
                  {hi ? "सक्रिय" : "ACTIVE"}
                </span>

              </div>

              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                <MapPin size={13} />
                {profile.state || "India"}
              </div>

            </div>

            {editing ? (

              <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5">

                <InputField
                  label={hi ? "नाम" : "Name"}
                  value={profile.name}
                  onChange={(value) =>
                    updateProfile("name", value)
                  }
                  placeholder={
                    hi
                      ? "अपना नाम"
                      : "Your name"
                  }
                />

                <InputField
                  label={
                    hi
                      ? "मोबाइल नंबर"
                      : "Mobile number"
                  }
                  value={profile.mobile}
                  onChange={(value) =>
                    updateProfile(
                      "mobile",
                      value
                    )
                  }
                  placeholder="98XXXXXXXX"
                  type="tel"
                />

                <div className="grid gap-3 sm:grid-cols-2">

                  <InputField
                    label={hi ? "गाँव" : "Village"}
                    value={profile.village}
                    onChange={(value) =>
                      updateProfile(
                        "village",
                        value
                      )
                    }
                    placeholder={
                      hi
                        ? "गाँव का नाम"
                        : "Village"
                    }
                  />

                  <InputField
                    label={
                      hi
                        ? "जिला"
                        : "District"
                    }
                    value={profile.district}
                    onChange={(value) =>
                      updateProfile(
                        "district",
                        value
                      )
                    }
                    placeholder={
                      hi
                        ? "जिले का नाम"
                        : "District"
                    }
                  />

                </div>

                <InputField
                  label={hi ? "राज्य" : "State"}
                  value={profile.state}
                  onChange={(value) =>
                    updateProfile(
                      "state",
                      value
                    )
                  }
                  placeholder="Uttar Pradesh"
                />

                <InputField
                  label={
                    hi
                      ? "ईमेल (वैकल्पिक)"
                      : "Email (optional)"
                  }
                  value={profile.email}
                  onChange={(value) =>
                    updateProfile(
                      "email",
                      value
                    )
                  }
                  placeholder="farmer@example.com"
                  type="email"
                />

                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={profileSaving}
                  className="mt-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {profileSaving
                    ? hi
                      ? "सेव हो रहा है..."
                      : "Saving..."
                    : hi
                      ? "प्रोफ़ाइल सेव करें"
                      : "Save profile"}
                </button>

              </div>

            ) : (

              <div className="mt-5 border-t border-slate-100 pt-4">

                <ProfileDetail
                  icon={UserRound}
                  label={
                    hi ? "नाम" : "Name"
                  }
                  value={
                    profile.name || "Farmer"
                  }
                />

                <ProfileDetail
                  icon={Smartphone}
                  label={
                    hi
                      ? "मोबाइल"
                      : "Mobile"
                  }
                  value={
                    profile.mobile ||
                    (hi
                      ? "नहीं जोड़ा गया"
                      : "Not added")
                  }
                />

                <ProfileDetail
                  icon={MapPin}
                  label={
                    hi
                      ? "स्थान"
                      : "Location"
                  }
                  value={
                    [
                      profile.village,
                      profile.district,
                      profile.state,
                    ]
                      .filter(Boolean)
                      .join(", ") ||
                    "India"
                  }
                />

                <ProfileDetail
                  icon={CalendarDays}
                  label={
                    hi
                      ? "सदस्य बने"
                      : "Member since"
                  }
                  value="2026"
                />

                <ProfileDetail
                  icon={CreditCard}
                  label={
                    hi
                      ? "ईमेल"
                      : "Email"
                  }
                  value={
                    profile.email ||
                    (hi
                      ? "नहीं जोड़ा गया"
                      : "Not added")
                  }
                />

              </div>

            )}

          </section>

          <section className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm">

            <div className="flex items-start gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                <Leaf size={19} />
              </div>

              <div className="min-w-0">

                <h3 className="text-sm font-bold">
                  {hi
                    ? "कृषि सेतु के साथ स्मार्ट खेती"
                    : "Smarter farming with KrishiSetu"}
                </h3>

                <p className="mt-1.5 text-xs leading-5 text-slate-400">
                  {hi
                    ? "अपनी जानकारी अपडेट रखें ताकि मौसम, मिट्टी, सैटेलाइट और फसल संबंधी बेहतर सुझाव मिल सकें।"
                    : "Keep your details updated to receive better weather, soil, satellite and crop recommendations."}
                </p>

              </div>

            </div>

          </section>

          <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">

            <SectionHeader
              icon={MapPinned}
              title={
                hi
                  ? "स्थान और GPS"
                  : "Location & GPS"
              }
              description={
                hi
                  ? "अपने खेत का स्थान अपडेट रखें"
                  : "Keep your farm location updated"
              }
            />

            <div className="mt-4 rounded-2xl bg-slate-50 p-4">

              <div className="flex items-start gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <MapPin size={18} />
                </div>

                <div className="min-w-0 flex-1">

                  <p className="text-xs font-bold text-slate-800">
                    {hi
                      ? "वर्तमान खेत स्थान"
                      : "Current farm location"}
                  </p>

                  <p className="mt-1 text-[11px] text-slate-400">
                    {location}
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={requestLocation}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-xs font-bold text-emerald-700 hover:bg-emerald-50"
              >
                <MapPinned size={15} />

                {locationEnabled
                  ? hi
                    ? "Location अनुमति मिल गई"
                    : "Location permission granted"
                  : hi
                    ? "Location अनुमति दें"
                    : "Allow location"}
              </button>

            </div>

          </section>

        </div>

        <div className="min-w-0 space-y-5">

          <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">

            <SectionHeader
              icon={Tractor}
              eyebrow={
                hi ? "मेरा खेत" : "My farm"
              }
              title={
                hi
                  ? "खेत की जानकारी"
                  : "Farm information"
              }
              description={
                hi
                  ? "आपके वर्तमान खेत की जानकारी"
                  : "Your current farming information"
              }
            />

            <div className="mt-5 grid gap-3 sm:grid-cols-2">

              <FarmInfo
                icon={Sprout}
                label={
                  hi
                    ? "मुख्य फसल"
                    : "Primary crop"
                }
                value={crop}
              />

              <FarmInfo
                icon={Ruler}
                label={
                  hi
                    ? "खेत का क्षेत्रफल"
                    : "Farm area"
                }
                value={
                  area
                    ? `${area} ${
                        hi ? "एकड़" : "acres"
                      }`
                    : hi
                      ? "नहीं जोड़ा गया"
                      : "Not added"
                }
              />

              <FarmInfo
                icon={MapPin}
                label={
                  hi
                    ? "खेत का स्थान"
                    : "Farm location"
                }
                value={location}
                muted={!primaryFarm}
              />

              <FarmInfo
                icon={CalendarDays}
                label={
                  hi
                    ? "बुवाई की तारीख"
                    : "Sowing date"
                }
                value={
                  sowingDate ||
                  (hi
                    ? "नहीं जोड़ा गया"
                    : "Not added")
                }
                muted={!sowingDate}
              />

            </div>

            <Link
              to="/farm"
              className="mt-4 flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-left transition hover:border-emerald-200 hover:bg-emerald-50/50"
            >

              <div className="min-w-0">

                <p className="text-xs font-bold text-slate-800">
                  {hi
                    ? "खेत की जानकारी प्रबंधित करें"
                    : "Manage farm information"}
                </p>

                <p className="mt-0.5 text-[10px] text-slate-400">
                  {hi
                    ? "फसल, क्षेत्रफल और स्थान अपडेट करें"
                    : "Update crop, area and location"}
                </p>

              </div>

              <ChevronRight
                size={16}
                className="shrink-0 text-slate-300"
              />

            </Link>

          </section>

          <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">

            <SectionHeader
              icon={Sprout}
              title={
                hi
                  ? "मेरे खेत"
                  : "My farms"
              }
              description={
                hi
                  ? "आपके सभी जुड़े हुए खेत"
                  : "All your connected farms"
              }
            />

            <div className="mt-4 space-y-2">

              {farms.length > 0 ? (

                farms.map((farm) => (

                  <div
                    key={farm.id}
                    className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"
                  >

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Wheat size={18} />
                    </div>

                    <div className="min-w-0 flex-1">

                      <p className="truncate text-xs font-bold text-slate-800">
                        {farm.name}
                      </p>

                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {farm.crop} •{" "}
                        {farm.area_acres}{" "}
                        {hi
                          ? "एकड़"
                          : "acres"}
                      </p>

                    </div>

                    <CheckCircle2
                      size={17}
                      className="text-emerald-500"
                    />

                  </div>

                ))

              ) : (

                <div className="rounded-2xl bg-slate-50 p-5 text-center">

                  <Sprout
                    size={24}
                    className="mx-auto text-slate-300"
                  />

                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    {hi
                      ? "अभी कोई खेत नहीं मिला"
                      : "No farms found yet"}
                  </p>

                </div>

              )}

            </div>

            <Link
              to="/farm"
              className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-200 px-4 py-3 text-xs font-bold text-emerald-700 hover:bg-emerald-50"
            >
              <Plus size={15} />
              {hi
                ? "नया खेत जोड़ें"
                : "Add another farm"}
            </Link>

          </section>

          <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">

            <SectionHeader
              icon={FileText}
              title={
                hi
                  ? "महत्वपूर्ण दस्तावेज़"
                  : "Important documents"
              }
              description={
                hi
                  ? "अपने जरूरी दस्तावेज़ सुरक्षित रूप से जोड़ें"
                  : "Add your important documents securely"
              }
            />

            <div className="mt-4 space-y-3">

              <DocumentUpload
                type="aadhaar"
                icon={CreditCard}
                title={
                  hi
                    ? "आधार कार्ड"
                    : "Aadhaar Card"
                }
                description={
                  hi
                    ? "PDF या फोटो • अधिकतम 5 MB"
                    : "PDF or image • Max 5 MB"
                }
                document={documents.aadhaar}
                onUpload={handleDocumentUpload}
                onRemove={removeDocument}
                hi={hi}
              />

              <DocumentUpload
                type="land"
                icon={Landmark}
                title={
                  hi
                    ? "खेत के कागज़ / खसरा-खतौनी"
                    : "Land / Khasra-Khatauni"
                }
                description={
                  hi
                    ? "जमीन के रिकॉर्ड की PDF या फोटो"
                    : "Land record PDF or image"
                }
                document={documents.land}
                onUpload={handleDocumentUpload}
                onRemove={removeDocument}
                hi={hi}
              />

              <DocumentUpload
                type="bank"
                icon={Landmark}
                title={
                  hi
                    ? "बैंक पासबुक"
                    : "Bank Passbook"
                }
                description={
                  hi
                    ? "वैकल्पिक दस्तावेज़"
                    : "Optional document"
                }
                document={documents.bank}
                onUpload={handleDocumentUpload}
                onRemove={removeDocument}
                hi={hi}
              />

              <DocumentUpload
                type="kcc"
                icon={CreditCard}
                title={
                  hi
                    ? "किसान क्रेडिट कार्ड"
                    : "Kisan Credit Card"
                }
                description={
                  hi
                    ? "KCC से संबंधित दस्तावेज़"
                    : "KCC related document"
                }
                document={documents.kcc}
                onUpload={handleDocumentUpload}
                onRemove={removeDocument}
                hi={hi}
              />

            </div>

            <div className="mt-4 flex gap-2 rounded-2xl border border-amber-100 bg-amber-50 p-3">

              <ShieldCheck
                size={16}
                className="mt-0.5 shrink-0 text-amber-600"
              />

              <p className="text-[10px] leading-4 text-amber-700">
                {hi
                  ? "संवेदनशील दस्तावेज़ों को किसी के साथ साझा न करें। अभी ये फाइलें केवल इस स्क्रीन के वर्तमान session में रखी जाती हैं।"
                  : "Do not share sensitive documents with anyone. These files are currently kept only in the active screen session."}
              </p>

            </div>

          </section>

          <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">

            <SectionHeader
              icon={BadgeCheck}
              title={
                hi
                  ? "सरकारी योजनाएँ"
                  : "Government schemes"
              }
              description={
                hi
                  ? "अपनी योजना की स्थिति ट्रैक करें"
                  : "Track your scheme status"
              }
            />

            <div className="mt-4 space-y-2">

              <SchemeRow
                title="PM-KISAN"
                description={
                  hi
                    ? "किसान सम्मान निधि"
                    : "Farmer income support"
                }
                status={schemeStatus.pmKisan}
                onChange={() =>
                  setSchemeStatus((s) => ({
                    ...s,
                    pmKisan:
                      s.pmKisan === "pending"
                        ? "verified"
                        : "pending",
                  }))
                }
                hi={hi}
              />

              <SchemeRow
                title={
                  hi
                    ? "फसल बीमा"
                    : "Fasal Bima"
                }
                description={
                  hi
                    ? "प्रधानमंत्री फसल बीमा"
                    : "Crop insurance"
                }
                status={schemeStatus.fasalBima}
                onChange={() =>
                  setSchemeStatus((s) => ({
                    ...s,
                    fasalBima:
                      s.fasalBima === "pending"
                        ? "verified"
                        : "pending",
                  }))
                }
                hi={hi}
              />

              <SchemeRow
                title="KCC"
                description={
                  hi
                    ? "किसान क्रेडिट कार्ड"
                    : "Kisan Credit Card"
                }
                status={schemeStatus.kcc}
                onChange={() =>
                  setSchemeStatus((s) => ({
                    ...s,
                    kcc:
                      s.kcc === "pending"
                        ? "verified"
                        : "pending",
                  }))
                }
                hi={hi}
              />

            </div>

            <p className="mt-3 text-[10px] leading-4 text-slate-400">
              {hi
                ? "योजना की वास्तविक eligibility और status बाद में सरकारी APIs/verification से connect किए जा सकते हैं।"
                : "Real eligibility and status can later be connected to government APIs or verification."}
            </p>

          </section>

          <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">

            <div className="border-b border-slate-100 px-5 py-5">

              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                {hi ? "अलर्ट" : "Alerts"}
              </p>

              <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">
                {hi
                  ? "सूचनाएँ"
                  : "Notifications"}
              </h2>

            </div>

            <ToggleRow
              icon={Bell}
              title={
                hi
                  ? "सभी सूचनाएँ"
                  : "All notifications"
              }
              description={
                hi
                  ? "KrishiSetu की सभी alerts"
                  : "All KrishiSetu alerts"
              }
              value={notifications}
              onChange={setNotifications}
              iconClass="bg-amber-50 text-amber-600"
            />

            <ToggleRow
              icon={Bell}
              title={
                hi
                  ? "मौसम अलर्ट"
                  : "Weather alerts"
              }
              description={
                hi
                  ? "बारिश, हवा और मौसम की चेतावनी"
                  : "Rain, wind and weather warnings"
              }
              value={weatherAlerts}
              onChange={setWeatherAlerts}
              iconClass="bg-blue-50 text-blue-600"
            />

            <ToggleRow
              icon={Sprout}
              title={
                hi
                  ? "खेत अलर्ट"
                  : "Farm alerts"
              }
              description={
                hi
                  ? "फसल और खेत से जुड़े reminders"
                  : "Crop and farm reminders"
              }
              value={farmAlerts}
              onChange={setFarmAlerts}
              iconClass="bg-emerald-50 text-emerald-600"
              last
            />

          </section>

          <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">

            <div className="border-b border-slate-100 px-5 py-5">

              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                {hi
                  ? "पसंद"
                  : "Preferences"}
              </p>

              <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">
                {hi
                  ? "ऐप सेटिंग्स"
                  : "App settings"}
              </h2>

            </div>

            <Setting
              icon={Languages}
              title={
                hi
                  ? "भाषा"
                  : "Language"
              }
              description={
                hi
                  ? "हिंदी / English"
                  : "Hindi / English"
              }
              iconClass="bg-violet-50 text-violet-600"
              action={
                <button
                  type="button"
                  onClick={() =>
                    setLanguage(
                      hi ? "en" : "hi"
                    )
                  }
                  className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-bold text-slate-600"
                >
                  {hi
                    ? "English"
                    : "हिंदी"}
                </button>
              }
            />

            <Setting
              icon={Moon}
              title={
                hi
                  ? "डार्क मोड"
                  : "Dark mode"
              }
              description={
                hi
                  ? "ऐप का appearance बदलें"
                  : "Change app appearance"
              }
              iconClass="bg-slate-100 text-slate-600"
              action={
                <Toggle
                  value={darkMode}
                  onChange={toggleDarkMode}
                />
              }
            />

            <Setting
              icon={LockKeyhole}
              title={
                hi
                  ? "प्राइवेसी और सुरक्षा"
                  : "Privacy & security"
              }
              description={
                hi
                  ? "खाते और डेटा की सुरक्षा"
                  : "Account and data security"
              }
              iconClass="bg-emerald-50 text-emerald-600"
              last
            />

          </section>

          <section className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-4">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                <ShieldCheck size={18} />
              </div>

              <div className="min-w-0 flex-1">

                <p className="text-xs font-bold text-emerald-800">
                  {hi
                    ? "आपका खाता तैयार है"
                    : "Your account is ready"}
                </p>

                <p className="mt-0.5 text-[10px] text-emerald-700/60">
                  {hi
                    ? "KrishiSetu के खेती के सभी tools उपलब्ध हैं।"
                    : "All KrishiSetu farming tools are available."}
                </p>

              </div>

            </div>

          </section>

          <div className="grid gap-3 sm:grid-cols-2">

            <button
              type="button"
              onClick={() =>
                showMessage(
                  hi
                    ? "Help center जल्द उपलब्ध होगा"
                    : "Help center will be available soon"
                )
              }
              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              <CircleHelp size={16} />
              {hi
                ? "मदद और सहायता"
                : "Help & support"}
            </button>

            <button
              type="button"
              onClick={logout}
              className="flex items-center justify-center gap-2 rounded-2xl border border-red-100 bg-white px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50"
            >
              <LogOut size={16} />
              {hi
                ? "लॉग आउट"
                : "Logout"}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}) {
  return (
    <label className="block">

      <span className="mb-1.5 block text-[10px] font-semibold text-slate-400">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
      />

    </label>
  );
}

function SectionHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
}) {
  return (
    <div className="flex items-start justify-between">

      <div>

        {eyebrow && (
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">
            {eyebrow}
          </p>
        )}

        <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">
          {title}
        </h2>

        <p className="mt-1 text-xs text-slate-400">
          {description}
        </p>

      </div>

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        <Icon size={19} />
      </div>

    </div>
  );
}

function ProfileDetail({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex items-center gap-3 py-2">

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
        <Icon size={15} />
      </div>

      <div className="min-w-0">

        <p className="text-[10px] text-slate-400">
          {label}
        </p>

        <p className="mt-0.5 truncate text-xs font-semibold text-slate-700">
          {value}
        </p>

      </div>

    </div>
  );
}

function FarmInfo({
  icon: Icon,
  label,
  value,
  muted,
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 transition hover:bg-emerald-50/50">

      <div className="flex items-center gap-2">

        <Icon
          size={15}
          className={
            muted
              ? "text-slate-400"
              : "text-emerald-600"
          }
        />

        <span className="text-[10px] font-semibold text-slate-400">
          {label}
        </span>

      </div>

      <p
        className={`mt-2 text-sm font-bold ${
          muted
            ? "text-slate-400"
            : "text-slate-800"
        }`}
      >
        {value}
      </p>

    </div>
  );
}

function DocumentUpload({
  type,
  icon: Icon,
  title,
  description,
  document,
  onUpload,
  onRemove,
  hi,
}) {
  const inputRef = useRef(null);

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">

      <div className="flex items-center gap-3">

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
          <Icon size={18} />
        </div>

        <div className="min-w-0 flex-1">

          <p className="text-xs font-bold text-slate-800">
            {title}
          </p>

          <p className="mt-0.5 truncate text-[10px] text-slate-400">
            {document
              ? document.name
              : description}
          </p>

        </div>

        {document ? (

          <div className="flex items-center gap-1">

            <a
              href={document.url}
              target="_blank"
              rel="noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-500 hover:text-emerald-600"
              title={
                hi ? "देखें" : "View"
              }
            >
              <Eye size={15} />
            </a>

            <button
              type="button"
              onClick={() =>
                onRemove(type)
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-red-500 hover:bg-red-50"
              title={
                hi ? "हटाएं" : "Remove"
              }
            >
              <Trash2 size={15} />
            </button>

          </div>

        ) : (

          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(event) =>
                onUpload(type, event)
              }
            />

            <button
              type="button"
              onClick={() =>
                inputRef.current?.click()
              }
              className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[10px] font-bold text-emerald-700 shadow-sm hover:bg-emerald-50"
            >
              <Upload size={13} />

              {hi
                ? "अपलोड"
                : "Upload"}
            </button>
          </>

        )}

      </div>

    </div>
  );
}

function SchemeRow({
  title,
  description,
  status,
  onChange,
  hi,
}) {
  const verified =
    status === "verified";

  return (
    <button
      type="button"
      onClick={onChange}
      className="flex w-full items-center gap-3 rounded-2xl bg-slate-50 p-3 text-left transition hover:bg-emerald-50/50"
    >

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
        <BadgeCheck size={18} />
      </div>

      <div className="min-w-0 flex-1">

        <p className="text-xs font-bold text-slate-800">
          {title}
        </p>

        <p className="mt-0.5 text-[10px] text-slate-400">
          {description}
        </p>

      </div>

      <span
        className={`rounded-full px-2 py-1 text-[9px] font-bold ${
          verified
            ? "bg-emerald-100 text-emerald-700"
            : "bg-amber-100 text-amber-700"
        }`}
      >
        {verified
          ? hi
            ? "जाँचा गया"
            : "Verified"
          : hi
            ? "लंबित"
            : "Pending"}
      </span>

    </button>
  );
}

function ToggleRow({
  icon: Icon,
  title,
  description,
  value,
  onChange,
  iconClass,
  last,
}) {
  return (
    <div
      className={`flex items-center gap-3 px-5 py-4 ${
        !last
          ? "border-b border-slate-100"
          : ""
      }`}
    >

      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        <Icon size={17} />
      </div>

      <div className="min-w-0 flex-1">

        <p className="text-xs font-bold text-slate-800">
          {title}
        </p>

        <p className="mt-0.5 truncate text-[10px] text-slate-400">
          {description}
        </p>

      </div>

      <Toggle
        value={value}
        onChange={onChange}
      />

    </div>
  );
}

function Setting({
  icon: Icon,
  title,
  description,
  iconClass,
  action,
  last,
}) {
  return (
    <div
      className={`flex w-full items-center gap-3 px-5 py-4 ${
        !last
          ? "border-b border-slate-100"
          : ""
      }`}
    >

      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        <Icon size={17} />
      </div>

      <div className="min-w-0 flex-1">

        <p className="text-xs font-bold text-slate-800">
          {title}
        </p>

        <p className="mt-0.5 truncate text-[10px] text-slate-400">
          {description}
        </p>

      </div>

      {action || (
        <ChevronRight
          size={16}
          className="shrink-0 text-slate-300"
        />
      )}

    </div>
  );
}

function Toggle({
  value,
  onChange,
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        value
          ? "bg-emerald-500"
          : "bg-slate-200"
      }`}
      aria-pressed={value}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
          value
            ? "left-6"
            : "left-1"
        }`}
      />
    </button>
  );
}

export default Profile;