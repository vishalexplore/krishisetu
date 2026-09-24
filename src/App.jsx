import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import InstallPrompt from "./components/InstallPrompt";

import Dashboard from "./pages/Dashboard";
import Farm from "./pages/Farm";
import Weather from "./pages/Weather";
import Soil from "./pages/Soil";
import Satellite from "./pages/Satellite";
import CropDoctor from "./pages/CropDoctor";
import Advisor from "./pages/Advisor";
import Profile from "./pages/Profile";

import DashboardLayout from "./layouts/DashboardLayout";
import { LanguageProvider } from "./i18n/LanguageContext";

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>

        <InstallPrompt />

        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/farm" element={<Farm />} />
            <Route path="/weather" element={<Weather />} />
            <Route path="/soil" element={<Soil />} />
            <Route path="/satellite" element={<Satellite />} />
            <Route path="/crop-doctor" element={<CropDoctor />} />
            <Route path="/advisor" element={<Advisor />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>

      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;