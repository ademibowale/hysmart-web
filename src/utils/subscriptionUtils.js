import { supabase } from "../supabaseClient";

// API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Updated plan configurations with correct naming
export const PLANS = {
  WEEKLY: {
    id: 'weekly',
    name: 'Gold Plan',        // Plan ID: weekly → Name: Gold Plan
    durationDays: 7,
    durationText: 'week',
    nigeriaPrice: 500,
    internationalPrice: 2.49,
    nigeriaCurrency: 'NGN',
    internationalCurrency: 'USD',
    features: [
      'Access to all predictions',
      'Sure odds picks',
      'Basic support'
    ]
  },
  MONTHLY: {
    id: 'monthly',
    name: 'Premium Plan',     // Plan ID: monthly → Name: Premium Plan
    durationDays: 30,
    durationText: 'month',
    nigeriaPrice: 2000,
    internationalPrice: 6.99,
    nigeriaCurrency: 'NGN',
    internationalCurrency: 'USD',
    features: [
      'Access to all predictions',
      'Sure odds picks',
      'Early access to tips',
      'Premium badge',
      'Priority support'
    ]
  },
  QUARTERLY: {
    id: 'quarterly',
    name: 'VIP Plan',         // Plan ID: quarterly → Name: VIP Plan
    durationDays: 90,
    durationText: '3 months',
    nigeriaPrice: 4000,
    internationalPrice: 14.99,
    nigeriaCurrency: 'NGN',
    internationalCurrency: 'USD',
    features: [
      'Access to all predictions',
      'Sure odds picks',
      'Early access to tips',
      'VIP badge',
      'Priority support',
      'Save 33% compared to monthly'
    ]
  }
};

// Get auth token
const getAuthToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
};

// Get plans with backend-verified pricing
export async function getPlans() {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/subscriptions/plans`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await response.json();
    
    if (result.success) {
      // Cache the plans
      localStorage.setItem('cached_plans', JSON.stringify(result.data));
      localStorage.setItem('user_country', result.user_country);
      return result.data;
    }
    throw new Error('Failed to fetch plans');
  } catch (error) {
    console.error('Error fetching plans from backend, using fallback:', error.message);
    // Fallback to local plans
    const location = await getUserLocation();
    const plans = {
      weekly: getPlanPrice('weekly', location.countryCode),
      monthly: getPlanPrice('monthly', location.countryCode),
      quarterly: getPlanPrice('quarterly', location.countryCode)
    };
    return plans;
  }
}

// Get single plan with backend-verified pricing
export async function getPlan(planId) {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/subscriptions/plans/${planId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    }
    throw new Error('Failed to fetch plan');
  } catch (error) {
    console.error('Error fetching plan from backend, using fallback:', error.message);
    const location = await getUserLocation();
    return getPlanPrice(planId, location.countryCode);
  }
}

// Create subscription via backend (SECURE)
export async function createSubscriptionBackend(userId, planId, paymentData) {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');
  
  const response = await fetch(`${API_URL}/subscriptions/create-subscription`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      plan_id: planId,
      payment_id: paymentData.paymentId,
      reference: paymentData.reference,
      amount: paymentData.amount,
      currency: paymentData.currency,
      payment_method: paymentData.paymentMethod
    })
  });
  
  const result = await response.json();
  if (!result.success) throw new Error(result.error);
  
  return result.subscription;
}

// Create subscription directly in Supabase (FALLBACK if backend fails)
export async function createSubscriptionDirect(userId, planId, paymentData, userLocation) {
  const plan = PLANS[planId.toUpperCase()];
  if (!plan) throw new Error('Invalid plan');
  
  const priceInfo = getPlanPrice(planId, userLocation.countryCode);
  const startDate = new Date();
  const endDate = calculateEndDate(startDate, plan.durationDays);
  
  const subscriptionData = {
    user_id: userId,
    plan_id: plan.id,
    plan_name: plan.name,
    status: 'active',
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    payment_id: paymentData.paymentId,
    reference: paymentData.reference,
    amount: priceInfo.amount,
    currency: priceInfo.currency,
    location_country: userLocation.country,
    location_is_nigeria: userLocation.isNigeria,
    duration_days: plan.durationDays,
    payment_method: paymentData.paymentMethod,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  // Check if user already has active subscription
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  
  if (existing) {
    const { data, error } = await supabase
      .from('subscriptions')
      .update(subscriptionData)
      .eq('id', existing.id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert([subscriptionData])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
}

// Main create subscription function (tries backend first, then fallback)
export async function createSubscription(userId, planId, paymentData, userLocation) {
  try {
    // Try backend first (SECURE)
    return await createSubscriptionBackend(userId, planId, paymentData);
  } catch (backendError) {
    console.error('Backend subscription failed, using direct fallback:', backendError.message);
    // Fallback to direct Supabase insert
    return await createSubscriptionDirect(userId, planId, paymentData, userLocation);
  }
}

// Get user's subscription from backend
export async function getUserSubscription(userId) {
  try {
    const token = await getAuthToken();
    if (!token) return null;
    
    const response = await fetch(`${API_URL}/subscriptions/my-subscription`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const result = await response.json();
    if (!result.success) return null;
    if (!result.hasSubscription) return null;
    
    return result.subscription;
  } catch (error) {
    console.error('Error fetching subscription from backend:', error.message);
    // Fallback to direct Supabase query
    const { data, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (subError || !data) return null;
    
    const now = new Date();
    const endDate = new Date(data.end_date);
    
    if (endDate < now) {
      await supabase
        .from('subscriptions')
        .update({ status: 'expired' })
        .eq('id', data.id);
      return null;
    }
    
    return data;
  }
}

// Get user's current plan
export async function getUserPlan(userId) {
  const subscription = await getUserSubscription(userId);
  
  if (!subscription) {
    return {
      plan: 'Free',
      isPaidUser: false,
      subscriptionEndDate: null,
      daysRemaining: 0
    };
  }
  
  const now = new Date();
  const endDate = new Date(subscription.end_date);
  const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
  
  return {
    plan: subscription.plan_name,
    isPaidUser: true,
    subscriptionEndDate: endDate,
    daysRemaining: daysRemaining,
    subscription: subscription
  };
}

// Get user's country and currency (UI display only)
export async function getUserLocation() {
  try {
    const cached = localStorage.getItem('user_location');
    if (cached) {
      return JSON.parse(cached);
    }

    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    const location = {
      country: data.country_name,
      countryCode: data.country_code,
      currency: data.currency,
      isNigeria: data.country_code === 'NG'
    };
    
    localStorage.setItem('user_location', JSON.stringify(location));
    return location;
  } catch (error) {
    console.error('Error getting location:', error);
    return {
      country: 'Nigeria',
      countryCode: 'NG',
      currency: 'NGN',
      isNigeria: true
    };
  }
}

// Get plan price based on user location (FRONTEND ONLY - for display)
export function getPlanPrice(planId, userCountryCode) {
  let plan;
  
  // Handle plan ID mapping
  if (planId === 'weekly') {
    plan = PLANS.WEEKLY;
  } else if (planId === 'monthly') {
    plan = PLANS.MONTHLY;
  } else if (planId === 'quarterly') {
    plan = PLANS.QUARTERLY;
  } else {
    plan = PLANS[planId.toUpperCase()];
  }
  
  if (!plan) return null;
  
  const isNigeria = userCountryCode === 'NG';
  
  return {
    id: plan.id,
    name: plan.name,
    amount: isNigeria ? plan.nigeriaPrice : plan.internationalPrice,
    currency: isNigeria ? plan.nigeriaCurrency : plan.internationalCurrency,
    isNigeria: isNigeria,
    displayPrice: isNigeria ? `₦${plan.nigeriaPrice.toLocaleString()}` : `$${plan.internationalPrice}`,
    durationDays: plan.durationDays,
    durationText: plan.durationText,
    features: plan.features
  };
}

// Get all plans with pricing (FRONTEND ONLY - for display)
export async function getAllPlans() {
  const location = await getUserLocation();
  const plans = {
    weekly: getPlanPrice('weekly', location.countryCode),
    monthly: getPlanPrice('monthly', location.countryCode),
    quarterly: getPlanPrice('quarterly', location.countryCode)
  };
  
  return { plans, location };
}

// Calculate end date based on plan duration
export function calculateEndDate(startDate, durationDays) {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationDays);
  return endDate;
}

// Create crypto payment record
export async function createCryptoPayment(userId, userEmail, planId, planName, amount, transactionHash) {
  const { data, error } = await supabase
    .from('crypto_payments')
    .insert({
      user_id: userId,
      user_email: userEmail,
      plan_id: planId,
      plan_name: planName,
      amount: amount,
      currency: 'USDT',
      transaction_hash: transactionHash,
      network: 'TRC20',
      status: 'pending',
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Verify crypto payment (admin function)
export async function verifyCryptoPayment(paymentId, isConfirmed = true) {
  const { data, error } = await supabase
    .from('crypto_payments')
    .update({
      status: isConfirmed ? 'verified' : 'failed',
      verified_at: isConfirmed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', paymentId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Get subscription status
export async function getSubscriptionStatus(userId) {
  try {
    const token = await getAuthToken();
    if (!token) return { hasActiveSubscription: false, plan: 'Free' };
    
    const response = await fetch(`${API_URL}/subscriptions/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    
    return result;
  } catch (error) {
    console.error('Error fetching subscription status:', error.message);
    // Fallback to direct check
    const subscription = await getUserSubscription(userId);
    return {
      hasActiveSubscription: !!subscription,
      subscription: subscription,
      plan: subscription?.plan_name || 'Free'
    };
  }
}

// Cancel subscription
export async function cancelSubscription(subscriptionId) {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Not authenticated');
    
    const response = await fetch(`${API_URL}/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    
    return result;
  } catch (error) {
    console.error('Error cancelling subscription:', error.message);
    // Fallback to direct update
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);
    
    if (updateError) throw updateError;
    
    // Update user to Free plan
    await supabase
      .from('users')
      .update({
        plan: 'Free',
        subscription_status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', (await supabase.auth.getUser()).data.user?.id);
    
    return { success: true };
  }
}

// Renew subscription
export async function renewSubscription(subscriptionId, paymentData) {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');
  
  const response = await fetch(`${API_URL}/subscriptions/${subscriptionId}/renew`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      payment_id: paymentData.paymentId,
      reference: paymentData.reference
    })
  });
  
  const result = await response.json();
  if (!result.success) throw new Error(result.error);
  
  return result.data;
}

// Get subscription history
export async function getSubscriptionHistory(userId) {
  try {
    const token = await getAuthToken();
    if (!token) return [];
    
    const response = await fetch(`${API_URL}/subscriptions/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    
    return result.data;
  } catch (error) {
    console.error('Error fetching subscription history:', error.message);
    // Fallback to direct query
    const { data, error: historyError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (historyError) return [];
    return data;
  }
}

// Export all functions
export default {
  PLANS,
  getPlans,
  getPlan,
  createSubscription,
  getUserSubscription,
  getUserPlan,
  getUserLocation,
  getPlanPrice,
  getAllPlans,
  calculateEndDate,
  createCryptoPayment,
  verifyCryptoPayment,
  getSubscriptionStatus,
  cancelSubscription,
  renewSubscription,
  getSubscriptionHistory
};