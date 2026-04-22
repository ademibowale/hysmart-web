// web/src/hooks/usePredictions.js
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const CACHE_KEY = "predictions_cache";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export default function usePredictions() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadFromCache = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          setData(data);
          setLastUpdated(new Date(timestamp).toLocaleString());
          return true;
        }
      }
    } catch (e) {}
    return false;
  };

  const saveToCache = (predictions) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: predictions,
        timestamp: Date.now()
      }));
    } catch (e) {}
  };

  const fetchPredictions = async () => {
    if (!navigator.onLine) {
      setOffline(true);
      setLoading(false);
      return;
    }
    try {
      // ✅ Safely get token – ignore lock errors
      let token = null;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token;
      } catch (lockErr) {
        // Ignore lock errors (they don't break the request)
        if (lockErr.name !== 'AbortError') console.error(lockErr);
        // Retry once quickly
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token;
      }

      if (!token) return;

      const res = await fetch("/api/predictions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        saveToCache(json.data);
        setLastUpdated(new Date().toLocaleString());
      }
    } catch (err) {
      console.error("Failed to fetch predictions:", err);
      setOffline(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cached = loadFromCache();
    if (!cached) {
      fetchPredictions();
    } else {
      setLoading(false);
      fetchPredictions(); // background refresh
    }

    const handleOnline = () => {
      setOffline(false);
      fetchPredictions();
    };
    const handleOffline = () => setOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { data, loading, offline, lastUpdated };
}