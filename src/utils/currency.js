// Currency and price configuration for WEB
export const PLANS = {
  GOLD: {
    id: 'gold',
    name: 'Gold Plan',
    duration: 1, // month
    duration_label: '1 Month',
    prices: {
      NGN: 2000,
      USD: 7,
    },
    features: [
      '✅ All Predictions',
      '✅ Basic Analysis',
      '✅ Email Support',
      '✅ Community Access'
    ]
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium Plan',
    duration: 3, // months
    duration_label: '3 Months',
    prices: {
      NGN: 5000,
      USD: 15,
    },
    features: [
      '✅ All Gold Features',
      '✅ Advanced Analysis',
      '✅ Priority Support',
      '✅ Early Access Tips',
      '✅ VIP Matches'
    ]
  },
  VIP: {
    id: 'vip',
    name: 'VIP Plan',
    duration: 12, // months
    duration_label: '12 Months',
    prices: {
      NGN: 20000,
      USD: 50,
    },
    features: [
      '✅ All Premium Features',
      '✅ AI-Powered Predictions',
      '✅ 24/7 Priority Support',
      '✅ Exclusive Insights',
      '✅ Personal Account Manager'
    ]
  }
};

// Get user's country and currency using IP API
export const getUserCountry = async () => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return {
      country: data.country_name,
      code: data.country_code,
      currency: data.country_code === 'NG' ? 'NGN' : 'USD'
    };
  } catch (error) {
    console.error('Error getting country:', error);
    return { country: 'Unknown', code: 'UN', currency: 'USD' };
  }
};

// Get price based on plan and currency
export const getPrice = (planId, currency) => {
  const plan = PLANS[planId.toUpperCase()];
  if (!plan) return { amount: 0, currency };
  return {
    amount: plan.prices[currency] || plan.prices.USD,
    currency: currency
  };
};

// Format price with currency symbol
export const formatPrice = (amount, currency) => {
  if (currency === 'NGN') {
    return `₦${amount.toLocaleString()}`;
  }
  return `$${amount}`;
};

// Get all plans with dynamic pricing
export const getPlansWithPricing = async () => {
  try {
    const { currency } = await getUserCountry();
    
    const plansWithPricing = Object.values(PLANS).map(plan => ({
      ...plan,
      price: getPrice(plan.id, currency),
      formatted_price: formatPrice(getPrice(plan.id, currency).amount, currency),
      currency
    }));
    
    return plansWithPricing;
  } catch (error) {
    console.error('Error getting plans:', error);
    return Object.values(PLANS);
  }
};