import axios from "axios";
import { supabase } from "../lib/supabase"; // adjust path if different

const API_BASE_URL = "http://localhost:3000/api"; 
// If testing locally on Android emulator use:
// http://10.0.2.2:3000/api
// If real device use your computer IP

const api = axios.create({
  baseURL: API_BASE_URL,
});

const getAuthHeaders = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    Authorization: `Bearer ${session?.access_token}`,
  };
};

// ------------------------------
// FETCH PLANS
// ------------------------------
export const fetchPlans = async () => {
  const response = await api.get("/subscription/plans");
  return response.data;
};

// ------------------------------
// CREATE SUBSCRIPTION
// ------------------------------
export const createSubscription = async (planId, paymentMethod) => {
  const headers = await getAuthHeaders();

  const response = await api.post(
    "/subscription/upgrade",
    { planId, paymentMethod },
    { headers }
  );

  return response.data;
};

// ------------------------------
// INITIALIZE PAYMENT
// ------------------------------
export const initializePayment = async (subscriptionId) => {
  const headers = await getAuthHeaders();

  const response = await api.post(
    "/payment/initialize",
    { subscriptionId },
    { headers }
  );

  return response.data;
};

// ------------------------------
// GET SUBSCRIPTION STATUS
// ------------------------------
export const getSubscriptionStatus = async () => {
  const headers = await getAuthHeaders();

  const response = await api.get("/subscription/status", { headers });

  return response.data;
};