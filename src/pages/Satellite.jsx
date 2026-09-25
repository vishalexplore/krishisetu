import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

const API_BASE_URL = "https://krishisetu-kb9p.onrender.com";

function NDVIMap({ farm }) {
  if (!farm?.analysis_available || !farm?.ndvi_tile_url) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="p-4">
        <h2 className="font-bold text-gray-900">
          Crop Health Map
        </h2>

        <p className="mt-1 text-xs text-gray-500">
          Real Sentinel-2 NDVI imagery
        </p>
      </div>

      <div className="h-[350px] w-full">
        <MapContainer
          center={[farm.latitude, farm.longitude]}
          zoom={15}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <TileLayer
            url={farm.ndvi_tile_url}
            opacity={0.75}
          />

          <CircleMarker
            center={[farm.latitude, farm.longitude]}
            radius={8}
            pathOptions={{
              color: "white",
              fillOpacity: 1,
            }}
          />
        </MapContainer>
      </div>

      <div className="flex flex-wrap items-center gap-4 p-4 text-xs">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-full bg-red-700" />
          Low
        </span>

        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-full bg-yellow-400" />
          Moderate
        </span>

        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-full bg-green-600" />
          Healthy
        </span>
      </div>
    </div>
  );
}

export default function Satellite() {
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [farm, setFarm] = useState(null);

  const [loadingFarms, setLoadingFarms] = useState(true);
  const [loadingSatellite, setLoadingSatellite] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadFarms = async () => {
      try {
        setLoadingFarms(true);
        setError("");

        const response = await fetch(`${API_BASE_URL}/farms/`);

        if (!response.ok) {
          throw new Error("Farms could not be loaded.");
        }

        const data = await response.json();

        setFarms(data);

        if (data.length > 0) {
          setSelectedFarmId(String(data[0].id));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingFarms(false);
      }
    };

    loadFarms();
  }, []);

  useEffect(() => {
    if (!selectedFarmId) return;

    const loadSatelliteData = async () => {
      try {
        setLoadingSatellite(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/satellite/farm/${selectedFarmId}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);

          throw new Error(
            errorData?.detail ||
              "Satellite data could not be loaded."
          );
        }

        const data = await response.json();

        setFarm(data);
      } catch (err) {
        setFarm(null);
        setError(err.message);
      } finally {
        setLoadingSatellite(false);
      }
    };

    loadSatelliteData();
  }, [selectedFarmId]);

  if (loadingFarms) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          Loading farms...
        </div>
      </div>
    );
  }

  if (farms.length === 0) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">
            No farm found
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Please add a farm first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">

      {/* Header */}
      <div>
        <p className="text-sm font-medium text-green-600">
          Google Earth Engine
        </p>

        <h1 className="mt-1 text-2xl font-bold text-gray-900">
          Satellite Monitoring
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Real Sentinel-2 satellite analysis for your farm.
        </p>
      </div>

      {/* Farm Selector */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <label className="text-sm font-semibold text-gray-700">
          Select Farm
        </label>

        <select
          value={selectedFarmId}
          onChange={(e) =>
            setSelectedFarmId(e.target.value)
          }
          className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-green-500"
        >
          {farms.map((item) => (
            <option
              key={item.id}
              value={item.id}
            >
              {item.name} — {item.crop}
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <h2 className="font-semibold text-red-700">
            Satellite data unavailable
          </h2>

          <p className="mt-1 text-sm text-red-600">
            {error}
          </p>
        </div>
      )}

      {/* Loading */}
      {loadingSatellite && (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-gray-600">
            Analyzing satellite imagery...
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Google Earth Engine is processing Sentinel-2 data.
          </p>
        </div>
      )}

      {/* Satellite Result */}
      {!loadingSatellite && farm && (
        <>
          {/* Farm Information */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Farm
            </p>

            <h2 className="mt-1 text-xl font-bold text-gray-900">
              {farm.farm_name}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {farm.crop} · {farm.latitude},{" "}
              {farm.longitude}
            </p>
          </div>

          {/* REAL NDVI MAP */}
          <NDVIMap farm={farm} />

          {/* NDVI */}
          {farm.analysis_available && (
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">
                    Current NDVI
                  </p>

                  <p className="mt-2 text-5xl font-bold text-green-600">
                    {farm.ndvi}
                  </p>
                </div>

                <div className="rounded-xl bg-green-50 px-4 py-3 text-center">
                  <p className="text-xs text-gray-500">
                    Crop Health
                  </p>

                  <p className="mt-1 font-bold text-green-700">
                    {farm.health}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-2 flex justify-between text-xs text-gray-500">
                  <span>Low vegetation</span>
                  <span>Healthy vegetation</span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(
                          100,
                          ((farm.ndvi + 1) / 2) * 100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Details */}
          {farm.analysis_available && (
            <div className="grid grid-cols-2 gap-4">

              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <p className="text-xs text-gray-500">
                  Latest Image
                </p>

                <p className="mt-2 font-semibold text-gray-900">
                  {farm.latest_image_date}
                </p>
              </div>

              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <p className="text-xs text-gray-500">
                  Images Found
                </p>

                <p className="mt-2 font-semibold text-gray-900">
                  {farm.image_count}
                </p>
              </div>

              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <p className="text-xs text-gray-500">
                  Resolution
                </p>

                <p className="mt-2 font-semibold text-gray-900">
                  {farm.resolution_meters} m
                </p>
              </div>

              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <p className="text-xs text-gray-500">
                  Analysis Period
                </p>

                <p className="mt-2 font-semibold text-gray-900">
                  {farm.days_checked} days
                </p>
              </div>

            </div>
          )}

          {/* No Analysis */}
          {!farm.analysis_available && (
            <div className="rounded-2xl border bg-yellow-50 p-5">
              <p className="font-semibold text-yellow-800">
                Satellite analysis unavailable
              </p>

              <p className="mt-1 text-sm text-yellow-700">
                {farm.message}
              </p>
            </div>
          )}

          {/* Source */}
          <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
            <p className="text-sm font-semibold text-green-800">
              Real Satellite Analysis
            </p>

            <p className="mt-1 text-xs leading-5 text-green-700">
              NDVI calculated from Sentinel-2 imagery
              using Google Earth Engine.
            </p>

            {farm.dataset && (
              <p className="mt-2 text-xs text-green-700">
                Dataset: {farm.dataset}
              </p>
            )}
          </div>
        </>
      )}

      <p className="text-xs leading-5 text-gray-500">
        Satellite-based NDVI is an indicator of vegetation
        condition and should be combined with field
        observations before making important agricultural
        decisions.
      </p>
    </div>
  );
}