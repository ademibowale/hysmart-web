import React, { useEffect, useState } from "react";
import { supabase } from "./src/supabaseClient";
import SplashScreen from "./src/components/SplashScreen";
import AppRouter from "./src/router/AppRouter";
import InstallPrompt from "./src/components/InstallPrompt";
import { Toaster } from "react-hot-toast";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // Listen for service worker updates (new version available)
  useEffect(() => {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        setUpdateAvailable(true);
      });
    }
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        if (!supabase) throw new Error("Supabase client not initialized");

        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Session error:", error);
          setError(error.message);
        }

        if (mounted) setSession(data?.session || null);
      } catch (err) {
        console.error("Initialization error:", err);
        setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) setSession(session);
      }
    );

    // Minimum splash display time (improves perceived performance)
    const timer = setTimeout(() => {
      if (mounted) setShowSplash(false);
    }, 4000);

    return () => {
      mounted = false;
      subscription?.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  // Refresh the page when a new service worker is ready
  const handleRefresh = () => {
    window.location.reload();
  };

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Refresh</button>
      </div>
    );
  }

  if (loading || showSplash) {
    return <SplashScreen />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#000" }}>
      {/* Offline indicator */}
      {!isOnline && (
        <div style={styles.offlineBanner}>
          ⚡ You are offline – some features may be unavailable.
        </div>
      )}

      {/* Update available banner (new version ready) */}
      {updateAvailable && (
        <div style={styles.updateBanner}>
          🔄 A new version is available.
          <button onClick={handleRefresh} style={styles.updateBtn}>
            Refresh
          </button>
        </div>
      )}

      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#333', color: '#fff' },
        }}
      />
      
      {/* Install prompt (Android/Desktop) + iOS guide */}
      <InstallPrompt />

      <AppRouter session={session} />
    </div>
  );
}

const styles = {
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#000',
    color: '#fff',
    padding: '20px',
    textAlign: 'center',
  },
  offlineBanner: {
    background: '#ff9800',
    color: '#000',
    textAlign: 'center',
    padding: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    zIndex: 1000,
    position: 'sticky',
    top: 0,
  },
  updateBanner: {
    background: '#2196f3',
    color: '#fff',
    textAlign: 'center',
    padding: '10px',
    fontSize: '14px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  updateBtn: {
    background: '#fff',
    color: '#2196f3',
    border: 'none',
    padding: '4px 12px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
};