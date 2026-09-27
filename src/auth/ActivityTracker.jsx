import { useEffect } from "react";
import { useAuth } from "./AuthContext";

const API_BASE = "https://krishisetu-kb9p.onrender.com";

export default function ActivityTracker() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const send = async (action = "active") => {
      try {
        const token = await user.getIdToken();
        if (cancelled) return;

        await fetch(`${API_BASE}/admin/activity?action=${action}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
      } catch (error) {
        console.debug("Activity tracking skipped:", error);
      }
    };

    const loginKey = `krishisetu-login-recorded-${user.uid}`;
    if (!sessionStorage.getItem(loginKey)) {
      sessionStorage.setItem(loginKey, "1");
      send("login");
    } else {
      send("active");
    }

    const interval = setInterval(() => send("active"), 5 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

  return null;
}
