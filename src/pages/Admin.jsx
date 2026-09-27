import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  CalendarCheck2,
  RefreshCw,
  ShieldCheck,
  Sprout,
  Users,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";

const API_BASE = "https://krishisetu-kb9p.onrender.com";

function Stat({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        {icon}
      </div>
      <p className="mt-4 text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError("");

      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE}/admin/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.detail || "Admin dashboard could not load");
      }

      setData(body);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60 * 1000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading && !data) {
    return <div className="p-6 text-sm text-slate-500">Loading admin dashboard...</div>;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm font-semibold text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
            KrishiSetu
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Users, activity and farm overview.
          </p>
        </div>

        <button
          onClick={load}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Users size={18} />} label="Total registered users" value={data?.total_users ?? 0} />
        <Stat icon={<Activity size={18} />} label="Active now · last 15 min" value={data?.active_users ?? 0} />
        <Stat icon={<CalendarCheck2 size={18} />} label="Today's logins" value={data?.today_logins ?? 0} />
        <Stat icon={<Sprout size={18} />} label="Total farms" value={data?.total_farms ?? 0} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Stat icon={<Activity size={18} />} label="Recently active · 24 hours" value={data?.recently_active ?? 0} />
        <Stat icon={<ShieldCheck size={18} />} label="Weekly active users · 7 days" value={data?.weekly_active ?? 0} />
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-900">Users</h2>
          <p className="mt-1 text-xs text-slate-500">
            Last activity and farm count.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[700px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Farms</th>
                <th className="px-5 py-3">Last active</th>
              </tr>
            </thead>
            <tbody>
              {(data?.users || []).map((item) => (
                <tr key={item.uid} className="border-t border-slate-100">
                  <td className="px-5 py-4 font-semibold text-slate-800">
                    {item.name || "Farmer"}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {item.email || "—"}
                  </td>
                  <td className="px-5 py-4 font-semibold text-emerald-700">
                    {item.farm_count}
                  </td>
                  <td className="px-5 py-4 text-slate-500">
                    {item.last_seen
                      ? new Date(item.last_seen).toLocaleString("en-IN")
                      : "—"}
                  </td>
                </tr>
              ))}

              {(!data?.users || data.users.length === 0) && (
                <tr>
                  <td colSpan="4" className="px-5 py-8 text-center text-sm text-slate-500">
                    No activity recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
