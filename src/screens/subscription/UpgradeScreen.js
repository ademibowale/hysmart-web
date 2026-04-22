import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

// Updated PLANS with new pricing structure
const PLANS = [
  {
    id: "gold",
    name: "Gold Plan",
    duration_ng: "Week",
    duration_int: "Week",
    price_ngn: 500,      // ₦500/week - NIGERIA ONLY
    price_usd: 2.49,     // $2.49/week - INTERNATIONAL ONLY
    tag: "🔥 Easy Entry",
    features: [
      "✅ Sure Odds 🔥",
      "✅ Basic Predictions",
      "✅ Email Support",
      "✅ Community Access"
    ]
  },
  {
    id: "premium",
    name: "Premium Plan",
    duration_ng: "Month",
    duration_int: "Month",
    price_ngn: 2000,     // ₦2000/month - NIGERIA ONLY
    price_usd: 6.99,     // $6.99/month - INTERNATIONAL ONLY
    tag: "⭐ MOST POPULAR",
    features: [
      "✅ Sure Odds 🔥",
      "✅ Advanced Predictions",
      "✅ Priority Support",
      "✅ Early Access Tips",
      "✅ Premium Badge"
    ]
  },
  {
    id: "vip",
    name: "VIP Plan",
    duration_ng: "3 Months",
    duration_int: "3 Months",
    price_ngn: 4000,     // ₦4000/3 months - NIGERIA ONLY
    price_usd: 14.99,    // $14.99/3 months - INTERNATIONAL ONLY
    tag: "👑 BEST VALUE",
    features: [
      "✅ Sure Odds 🔥",
      "✅ AI-Powered Predictions",
      "✅ 24/7 Priority Support",
      "✅ Early Access",
      "✅ Premium Badge",
      "✅ Personal Account Manager"
    ]
  }
];

export default function UpgradeScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedPlanData, setSelectedPlanData] = useState(null);
  const [user, setUser] = useState(null);
  const [currency, setCurrency] = useState("NGN");
  const [country, setCountry] = useState("Nigeria");
  const [countryFlag, setCountryFlag] = useState("🇳🇬");
  const [isNigeria, setIsNigeria] = useState(true);
  const [locationError, setLocationError] = useState(false);

  // Get flag emoji from country code
  const getFlagEmoji = (countryCode) => {
    if (!countryCode) return '🌍';
    const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
  };

  // Get currency and country info using ip-api.com (same as Dashboard.js)
  const getCurrencyAndCountry = async () => {
    try {
      console.log("🔍 Fetching user location from ip-api.com...");
      
      // Use AbortController to set a timeout (5 seconds)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch("http://ip-api.com/json/", { signal: controller.signal });
      clearTimeout(timeout);
      
      if (!response.ok) throw new Error("HTTP error");
      const data = await response.json();
      
      console.log('📍 Location API Response:', data);
      
      if (data.status === "success") {
        const countryCode = data.countryCode;
        const isNigeriaFlag = countryCode === "NG";
        const currencyCode = isNigeriaFlag ? "NGN" : "USD";
        const flag = getFlagEmoji(countryCode);
        
        setCountry(data.country);
        setCurrency(currencyCode);
        setCountryFlag(flag);
        setIsNigeria(isNigeriaFlag);
        
        // Cache the result in localStorage (optional, but helpful)
        localStorage.setItem('user_location', JSON.stringify({
          country: data.country,
          countryCode: countryCode,
          currency: currencyCode,
          isNigeria: isNigeriaFlag,
          region: isNigeriaFlag ? 'nigeria' : 'international'
        }));
        
        // Log what pricing the user will see
        if (isNigeriaFlag) {
          console.log('💰 User will see NIGERIAN pricing (₦)');
          console.log('💰 Gold: ₦500/week');
          console.log('💰 Premium: ₦2000/month');
          console.log('💰 VIP: ₦4000/3 months');
        } else {
          console.log('💰 User will see INTERNATIONAL pricing ($)');
          console.log('💰 Gold: $2.49/week');
          console.log('💰 Premium: $6.99/month');
          console.log('💰 VIP: $14.99/3 months');
        }
        
        return { isNigeria: isNigeriaFlag, currency: currencyCode };
      } else {
        throw new Error("Location detection failed");
      }
    } catch (err) {
      console.error("❌ Failed to fetch country info:", err);
      console.log("⚠️ Using default (Nigeria/NGN)");
      
      // Default to Nigeria
      setCurrency("NGN");
      setCountry("Nigeria");
      setCountryFlag("🇳🇬");
      setIsNigeria(true);
      setLocationError(true);
      return null;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user: currentUser }, error } = await supabase.auth.getUser();
        
        if (error || !currentUser) {
          console.error("Auth error:", error);
          navigate("/");
          return;
        }
        
        setUser(currentUser);
        console.log("✅ User loaded:", currentUser.email);
        
        // Get currency and country info from ip-api.com
        await getCurrencyAndCountry();
        
      } catch (err) {
        console.error("Error loading upgrade page:", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [navigate]);

  const getPrice = (plan) => {
    if (isNigeria) {
      return `₦${plan.price_ngn.toLocaleString()}`;
    }
    return `$${plan.price_usd}`;
  };

  const getDuration = (plan) => {
    if (isNigeria) {
      return plan.duration_ng;
    }
    return plan.duration_int;
  };

  const getPlanPriceValue = (plan) => {
    if (isNigeria) {
      return plan.price_ngn;
    }
    return plan.price_usd;
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan.id);
    setSelectedPlanData(plan);
    console.log(`📋 Selected: ${plan.name} - ${getPrice(plan)}/${getDuration(plan)}`);
  };

  const handleContinue = () => {
    if (selectedPlanData) {
      const amount = getPlanPriceValue(selectedPlanData);
      const currencyCode = isNigeria ? 'NGN' : 'USD';
      const duration = getDuration(selectedPlanData);
      
      console.log(`🚀 Continuing to payment: ${selectedPlanData.name} - ${amount} ${currencyCode} for ${duration}`);
      
      // Pass all necessary info to payment method screen
      navigate(`/payment-method?plan=${selectedPlanData.id}&planName=${selectedPlanData.name}&amount=${amount}&currency=${currencyCode}&duration=${duration}&region=${isNigeria ? 'nigeria' : 'international'}`);
    }
  };

  // Get payment method info based on region
  const getPaymentInfo = () => {
    if (isNigeria) {
      return {
        method: "Paystack",
        icon: "💰",
        color: "#4CAF50",
        description: "Pay with Paystack (Cards, Bank Transfer, USSD)",
        note: "✓ Only payment method for Nigeria"
      };
    }
    return {
      method: "Flutterwave + Crypto USDT (TRC20)",
      icon: "🌍",
      color: "#2196F3",
      description: "Primary: Flutterwave | Backup: Crypto USDT (TRC20)",
      note: "✓ Flutterwave first, Crypto as backup"
    };
  };

  const paymentInfo = getPaymentInfo();

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Detecting your location...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </button>
        <div style={styles.countryInfo}>
          <span style={styles.countryFlag}>{countryFlag}</span>
          <span>{country}</span>
          <span style={styles.currencyBadge}>
            {currency === "NGN" ? "₦ NGN" : "$ USD"}
          </span>
          <span style={isNigeria ? styles.nigeriaBadge : styles.internationalBadge}>
            {isNigeria ? '🇳🇬 Nigeria Region' : '🌍 International Region'}
          </span>
        </div>
      </div>
      
      <div style={styles.container}>
        <h1 style={styles.mainTitle}>Choose Your Plan</h1>
        <p style={styles.subtitle}>
          {isNigeria 
            ? "🇳🇬 Nigerian pricing - Pay with Paystack" 
            : "🌍 International pricing - Pay with Flutterwave or Crypto"}
        </p>
        
        {/* Payment Method Banner - Region Specific */}
        <div style={{...styles.paymentBanner, borderColor: paymentInfo.color, background: `rgba(${isNigeria ? '76, 175, 80' : '33, 150, 243'}, 0.1)`}}>
          <span style={styles.paymentIcon}>{paymentInfo.icon}</span>
          <div style={{flex: 1}}>
            <div style={{...styles.paymentMethod, color: paymentInfo.color}}>{paymentInfo.method}</div>
            <div style={styles.paymentDescription}>{paymentInfo.description}</div>
            <div style={styles.paymentNote}>{paymentInfo.note}</div>
          </div>
        </div>
        
        <div style={styles.plansContainer}>
          {PLANS.map((plan) => (
            <div 
              key={plan.id}
              style={{
                ...styles.planCard,
                ...(selectedPlan === plan.id ? styles.selectedPlan : {})
              }}
              onClick={() => handleSelectPlan(plan)}
            >
              {plan.tag && (
                <div style={plan.id === 'premium' ? styles.popularBadge : styles.vipBadge}>
                  {plan.tag}
                </div>
              )}
              <h3 style={styles.planName}>{plan.name}</h3>
              <div style={styles.priceContainer}>
                <span style={styles.priceAmount}>{getPrice(plan)}</span>
                <span style={styles.pricePeriod}>/{getDuration(plan)}</span>
              </div>
              {/* Show which region this price is for */}
              <div style={styles.regionHint}>
                {isNigeria ? "🇳🇬 Nigeria Only" : "🌍 International"}
              </div>
              <ul style={styles.features}>
                {plan.features.map((feature, idx) => (
                  <li key={idx} style={styles.featureItem}>{feature}</li>
                ))}
              </ul>
              <button 
                style={{
                  ...styles.selectBtn,
                  ...(selectedPlan === plan.id ? styles.selectedBtn : {})
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectPlan(plan);
                }}
              >
                {selectedPlan === plan.id ? '✓ Selected' : `Select ${plan.name}`}
              </button>
            </div>
          ))}
        </div>
        
        {selectedPlan && (
          <button style={styles.upgradeBtn} onClick={handleContinue}>
            Continue to Payment ({isNigeria ? 'Paystack' : 'Flutterwave'})
          </button>
        )}
        
        {locationError && (
          <div style={styles.warningBox}>
            ⚠️ Could not detect your location. Defaulting to Nigerian pricing.
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #000000 0%, #1a1a2e 100%)",
    padding: "20px",
  },
  header: {
    maxWidth: "1200px",
    margin: "0 auto",
    marginBottom: "40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "15px",
  },
  backBtn: {
    background: "#333",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    transition: "all 0.2s",
  },
  countryInfo: {
    background: "#111",
    padding: "8px 16px",
    borderRadius: "8px",
    color: "#FFD700",
    fontSize: "14px",
    border: "1px solid #333",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  countryFlag: {
    fontSize: "18px",
  },
  currencyBadge: {
    background: "rgba(255, 215, 0, 0.2)",
    padding: "2px 8px",
    borderRadius: "4px",
    fontWeight: "bold",
    fontSize: "12px",
  },
  nigeriaBadge: {
    background: "rgba(76, 175, 80, 0.2)",
    padding: "2px 8px",
    borderRadius: "4px",
    fontWeight: "bold",
    fontSize: "12px",
    color: "#4CAF50",
  },
  internationalBadge: {
    background: "rgba(33, 150, 243, 0.2)",
    padding: "2px 8px",
    borderRadius: "4px",
    fontWeight: "bold",
    fontSize: "12px",
    color: "#2196F3",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  mainTitle: {
    color: "#FFD700",
    fontSize: "36px",
    textAlign: "center",
    marginBottom: "10px",
  },
  subtitle: {
    color: "#aaa",
    textAlign: "center",
    marginBottom: "30px",
    fontSize: "14px",
  },
  paymentBanner: {
    border: "1px solid",
    borderRadius: "12px",
    padding: "15px 20px",
    marginBottom: "30px",
    maxWidth: "500px",
    marginLeft: "auto",
    marginRight: "auto",
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  paymentIcon: {
    fontSize: "32px",
  },
  paymentMethod: {
    fontSize: "16px",
    fontWeight: "bold",
    marginBottom: "4px",
  },
  paymentDescription: {
    color: "#aaa",
    fontSize: "11px",
  },
  paymentNote: {
    color: "#00ffcc",
    fontSize: "10px",
    marginTop: "4px",
  },
  plansContainer: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "30px",
    marginBottom: "40px",
  },
  planCard: {
    background: "#111",
    borderRadius: "16px",
    padding: "30px",
    width: "320px",
    border: "1px solid #333",
    transition: "all 0.3s",
    cursor: "pointer",
    position: "relative",
  },
  selectedPlan: {
    border: "2px solid #FFD700",
    boxShadow: "0 0 20px rgba(255, 215, 0, 0.2)",
    transform: "scale(1.02)",
  },
  popularBadge: {
    position: "absolute",
    top: "-12px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#FFD700",
    color: "#000",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  vipBadge: {
    position: "absolute",
    top: "-12px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "linear-gradient(135deg, #FFD700, #FFA500)",
    color: "#000",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  planName: {
    color: "#FFD700",
    fontSize: "24px",
    textAlign: "center",
    marginBottom: "15px",
  },
  priceContainer: {
    textAlign: "center",
    marginBottom: "10px",
  },
  priceAmount: {
    color: "#fff",
    fontSize: "36px",
    fontWeight: "bold",
  },
  pricePeriod: {
    color: "#aaa",
    fontSize: "14px",
  },
  regionHint: {
    textAlign: "center",
    fontSize: "10px",
    color: "#666",
    marginBottom: "15px",
    padding: "4px",
    background: "rgba(0,0,0,0.5)",
    borderRadius: "4px",
  },
  features: {
    listStyle: "none",
    padding: 0,
    marginBottom: "25px",
  },
  featureItem: {
    color: "#ccc",
    padding: "8px 0",
    fontSize: "14px",
    textAlign: "center",
  },
  selectBtn: {
    width: "100%",
    padding: "12px",
    background: "#222",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "all 0.2s",
  },
  selectedBtn: {
    background: "#FFD700",
    color: "#000",
  },
  upgradeBtn: {
    display: "block",
    width: "300px",
    margin: "0 auto",
    padding: "16px",
    background: "linear-gradient(135deg, #FFD700, #FFA500)",
    border: "none",
    borderRadius: "12px",
    fontSize: "18px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "#000",
    gap: "15px",
  },
  loadingText: {
    color: "#FFD700",
    fontSize: "14px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid rgba(255, 215, 0, 0.3)",
    borderTopColor: "#FFD700",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  warningBox: {
    background: "rgba(255, 100, 0, 0.2)",
    border: "1px solid #FF6600",
    borderRadius: "8px",
    padding: "12px",
    textAlign: "center",
    marginTop: "20px",
    color: "#FFD700",
    fontSize: "12px",
  },
};

// Add animations
const addAnimations = () => {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(255, 215, 0, 0.3);
    }
    .planCard:hover {
      transform: translateY(-5px);
      border-color: #FFD700;
    }
    .selectBtn:hover {
      background: #333;
    }
    .backBtn:hover {
      background: #444;
      transform: translateY(-2px);
    }
    .upgradeBtn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(255, 215, 0, 0.3);
    }
  `;
  document.head.appendChild(style);
};
addAnimations();