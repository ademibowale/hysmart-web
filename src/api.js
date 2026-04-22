import axios from "axios";
import API_BASE from "./apiConfig";
import { supabase } from "./supabaseClient";

/* ================= AXIOS INSTANCE ================= */

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

/* ================= REQUEST INTERCEPTOR ================= */

api.interceptors.request.use(
  async (config) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.access_token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${session.access_token}`,
        };
      }

      return config;
    } catch (err) {
      console.log("Auth attach error:", err);
      return config;
    }
  },
  (error) => Promise.reject(error)
);

/* ================= RESPONSE INTERCEPTOR ================= */

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // handle unauthorized (optional logout)
    if (error.response?.status === 401) {
      console.warn("Unauthorized request - session may be expired");

      // optional: force logout
      await supabase.auth.signOut();

      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);

export default api;