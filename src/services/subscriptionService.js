import { supabase } from '../supabaseClient';
import { PLANS, getPrice, getUserCountry } from '../utils/currency';

// Get user's current subscription
export const getUserSubscription = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    return { success: true, subscription: data || null };
  } catch (error) {
    console.error('Error getting subscription:', error);
    return { success: false, error: error.message };
  }
};

// Create payment intent (calls your backend)
export const createPaymentIntent = async (planId, paymentMethod, user) => {
  try {
    const { currency } = await getUserCountry();
    const plan = PLANS[planId.toUpperCase()];
    const price = getPrice(planId, currency);
    
    // Call your backend API to create payment
    const response = await fetch('/api/create-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: JSON.stringify({
        plan_id: planId,
        plan_name: plan.name,
        amount: price.amount,
        currency: price.currency,
        payment_method: paymentMethod,
        user_id: user.id,
        user_email: user.email
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) throw new Error(data.error);
    
    return {
      success: true,
      payment_id: data.payment_id,
      payment_url: data.payment_url,
      reference: data.reference
    };
    
  } catch (error) {
    console.error('Payment creation error:', error);
    return { success: false, error: error.message };
  }
};

// Verify payment status
export const verifyPaymentStatus = async (reference) => {
  try {
    const response = await fetch(`/api/verify-payment?reference=${reference}`, {
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      }
    });
    
    const data = await response.json();
    
    return {
      success: data.status === 'success',
      status: data.status,
      subscription: data.subscription
    };
    
  } catch (error) {
    console.error('Payment verification error:', error);
    return { success: false, error: error.message };
  }
};

// Get all plans with pricing (for display)
export const fetchPlans = async () => {
  return await getPlansWithPricing();
};