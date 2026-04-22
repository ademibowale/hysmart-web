import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import toast from 'react-hot-toast';

const PAYSTACK_PUBLIC_KEY = "pk_test_9b20e0d1de071dea8211cacfccff801b5e121504";
const FLUTTERWAVE_PUBLIC_KEY = "FLWPUBK_TEST_bdc15962f959ea92ca476c43c0e3a8";

// Crypto Wallet (USDT TRC20) - Fallback for international
const CRYPTO_WALLET = {
  address: "TQDbtchzoZqb3kg2VQRtXN53qxJzCZALb9",
  network: "TRC20",
  currency: "USDT",
};

// Suppress harmless Paystack CSS CORS error (optional)
const originalConsoleError = console.error;
console.error = (...args) => {
  if (args[0]?.includes?.("paystack.com/public/css/button.min.css")) return;
  originalConsoleError(...args);
};

// Load Paystack script
const loadPaystackScript = () => {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => {
      setTimeout(() => {
        if (window.PaystackPop) resolve();
        else reject(new Error("PaystackPop not available"));
      }, 100);
    };
    script.onerror = () => reject(new Error("Failed to load Paystack"));
    document.head.appendChild(script);
  });
};

// Load Flutterwave script
const loadFlutterwaveScript = () => {
  return new Promise((resolve, reject) => {
    if (window.FlutterwaveCheckout) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.flutterwave.com/v3.js";
    script.async = true;
    script.onload = () => {
      setTimeout(() => {
        if (window.FlutterwaveCheckout) resolve();
        else reject(new Error("FlutterwaveCheckout not available"));
      }, 100);
    };
    script.onerror = () => reject(new Error("Failed to load Flutterwave"));
    document.head.appendChild(script);
  });
};

// Get user location from localStorage
const getUserLocation = () => {
  try {
    const cached = localStorage.getItem('user_location');
    if (cached) {
      const data = JSON.parse(cached);
      return {
        country: data.country || 'Nigeria',
        currency: data.currency || 'NGN',
        isNigeria: data.isNigeria !== undefined ? data.isNigeria : true,
        region: data.isNigeria ? 'nigeria' : 'international',
      };
    }
  } catch (error) {}
  return { country: 'Nigeria', currency: 'NGN', isNigeria: true, region: 'nigeria' };
};

export default function PaymentMethodScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [user, setUser] = useState(null);
  const [isNigeria, setIsNigeria] = useState(true);
  const [paymentReference, setPaymentReference] = useState("");
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [transactionHash, setTransactionHash] = useState("");
  const [flutterwaveFailed, setFlutterwaveFailed] = useState(false);

  useEffect(() => {
    Promise.all([loadPaystackScript(), loadFlutterwaveScript()])
      .then(() => setScriptsLoaded(true))
      .catch(err => { console.error(err); setScriptsLoaded(true); });
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) { navigate("/"); return; }
        setUser(currentUser);

        // ✅ Ensure user exists in `users` table (fixes 406 error)
        await ensureUserExists(currentUser.id, currentUser.email);

        const locationData = getUserLocation();
        setIsNigeria(locationData.isNigeria);

        const params = new URLSearchParams(location.search);
        const planId = params.get("plan");
        const planName = params.get("planName");
        const amount = params.get("amount");
        const currency = params.get("currency");
        const duration = params.get("duration");
        const regionParam = params.get("region");

        if (regionParam) setIsNigeria(regionParam === 'nigeria');

        let mappedId = planId;
        if (planId === 'gold') mappedId = 'weekly';
        if (planId === 'premium') mappedId = 'monthly';
        if (planId === 'vip') mappedId = 'quarterly';

        let durationDays = 30;
        if (duration === 'Week') durationDays = 7;
        else if (duration === '3 Months') durationDays = 90;

        const selectedPlan = {
          id: mappedId,
          name: planName,
          price_ngn: currency === 'NGN' ? parseInt(amount) : 0,
          price_usd: currency === 'USD' ? parseFloat(amount) : 0,
          duration_days: durationDays,
        };
        setPlan(selectedPlan);

        const ref = `HYSMART_${mappedId.toUpperCase()}_${currentUser.id.substring(0,8)}_${Date.now()}`;
        setPaymentReference(ref);
      } catch (err) {
        console.error(err);
        toast.error("Failed to initialize payment. Please refresh.");
      }
    };
    init();
  }, [location, navigate]);

  // ========== FIX: Ensure user exists before inserting payment ==========
  const ensureUserExists = async (userId, userEmail) => {
    try {
      // Use maybeSingle() to avoid 406 error when no row found
      const { data: existing, error: fetchError } = await supabase
        .from('users')
        .select('id, plan, subscription_status')
        .eq('id', userId)
        .maybeSingle();  // 👈 Changed from .single() to .maybeSingle()

      // If error other than "no rows", throw
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // If user doesn't exist, create with default values (no free trial)
      if (!existing) {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: userEmail,
            plan: 'Expired',
            subscription_status: 'inactive',
            created_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;
        console.log('✅ Created missing user record for:', userId);
      } else {
        console.log('✅ User already exists:', userId);
      }
      return true;
    } catch (err) {
      console.error('❌ ensureUserExists error:', err);
      throw new Error('Failed to verify user account. Please try again.');
    }
  };

  const createPaymentRecord = async (status, method, ref, txId) => {
    try {
      // 1️⃣ Make sure the user exists in the users table
      await ensureUserExists(user.id, user.email);

      // 2️⃣ Now insert the payment record (foreign key will be satisfied)
      const { data, error } = await supabase
        .from("payments")
        .insert([{
          user_id: user.id,
          user_email: user.email,
          plan_id: plan.id,
          plan_name: plan.name,
          amount: getPriceValue(),
          currency: getCurrency(),
          payment_method: method,
          status,
          reference: ref || paymentReference,
          transaction_id: txId || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Payment record failed:", err);
      throw err;
    }
  };

  const updatePaymentStatus = async (id, status, txId) => {
    await supabase.from("payments").update({ status, transaction_id: txId, updated_at: new Date().toISOString() }).eq("id", id);
  };

  // ⚠️ IMPORTANT SECURITY NOTE: For production, move subscription activation to backend.
  // Verify payment with Paystack/Flutterwave API before activating.
  // This frontend activation is only for development/testing.
  const activateSubscription = async (paymentId, method, txId) => {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + plan.duration_days);

    const { data: sub, error } = await supabase
      .from("subscriptions")
      .insert([{
        user_id: user.id,
        plan_id: plan.id,
        plan_name: plan.name,
        status: "active",
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        payment_id: paymentId,
        reference: paymentReference,
        amount: getPriceValue(),
        currency: getCurrency(),
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();
    if (error) throw error;

    await supabase.from("users").update({
      plan: plan.name,
      subscription_status: "active",
      subscription_end: end.toISOString(),
      subscription_id: sub.id,
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);

    await supabase.auth.updateUser({
      data: { plan: plan.name, subscription_end: end.toISOString(), subscription_id: sub.id }
    });
    await supabase.auth.refreshSession();
    return sub;
  };

  const handlePaymentSuccess = async () => {
    toast.loading("Updating account...");
    await supabase.auth.refreshSession();
    await new Promise(r => setTimeout(r, 1500));
    localStorage.removeItem("dashboard_data");
    localStorage.removeItem("user_location");
    toast.dismiss();
    toast.success("Payment successful! Redirecting...");
    setTimeout(() => navigate("/dashboard?refresh=true&payment=success"), 1500);
  };

  const getPriceValue = () => {
    if (!plan) return 0;
    return isNigeria ? plan.price_ngn : plan.price_usd;
  };
  const getCurrency = () => isNigeria ? "NGN" : "USD";
  const getPrice = () => isNigeria ? `₦${plan?.price_ngn?.toLocaleString()}` : `$${plan?.price_usd}`;

  // ---------- Nigeria: Paystack ----------
  const handlePaystackPayment = async () => {
    if (!window.PaystackPop) { toast.error("Paystack not loaded"); return; }
    setLoading(true);
    try {
      const payment = await createPaymentRecord("pending", "paystack");
      if (!payment) throw new Error("Payment record failed");
      const handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: plan.price_ngn * 100,
        currency: "NGN",
        ref: payment.reference,
        channels: ["card", "bank", "ussd", "mobile_money"],
        callback: async (response) => {
          await updatePaymentStatus(payment.id, "completed", response.reference);
          await activateSubscription(payment.id, "paystack", response.reference);
          toast.success(`🎉 ${plan.name} activated!`);
          await handlePaymentSuccess();
          setLoading(false);
        },
        onClose: () => {
          setLoading(false);
          updatePaymentStatus(payment.id, "cancelled");
          toast.error("Payment cancelled");
        }
      });
      handler.openIframe();
    } catch (err) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  // ---------- International: Flutterwave (Primary) ----------
  const handleFlutterwavePayment = async () => {
    if (!window.FlutterwaveCheckout) { toast.error("Flutterwave not loaded"); return; }
    setLoading(true);
    setFlutterwaveFailed(false);
    try {
      const payment = await createPaymentRecord("pending", "flutterwave");
      if (!payment) throw new Error("Payment record failed");
      const config = {
        public_key: FLUTTERWAVE_PUBLIC_KEY,
        tx_ref: payment.reference,
        amount: Number(plan.price_usd),
        currency: "USD",
        payment_options: "card, banktransfer, ussd",
        customer: { email: user.email, name: user.email.split('@')[0] },
        customizations: { title: "HYSMART Predictions", description: `${plan.name} - ${plan.duration_days} days` },
        callback: async (response) => {
          if (response.status === "successful") {
            await updatePaymentStatus(payment.id, "completed", response.transaction_id);
            await activateSubscription(payment.id, "flutterwave", response.transaction_id);
            toast.success(`🎉 ${plan.name} activated!`);
            await handlePaymentSuccess();
          } else {
            await updatePaymentStatus(payment.id, "failed");
            toast.error("Flutterwave failed. You can try Crypto.");
            setFlutterwaveFailed(true);
          }
          setLoading(false);
        },
        onclose: () => {
          setLoading(false);
          toast.error("Payment cancelled. Try Crypto if needed.");
          setFlutterwaveFailed(true);
        }
      };
      window.FlutterwaveCheckout(config);
    } catch (err) {
      toast.error(err.message);
      setLoading(false);
      setFlutterwaveFailed(true);
    }
  };

  // ---------- International: Crypto USDT Fallback ----------
  const handleCryptoSubmit = async () => {
    if (!transactionHash.trim()) { toast.error("Enter transaction hash"); return; }
    setLoading(true);
    try {
      const payment = await createPaymentRecord("pending_verification", "crypto", paymentReference, transactionHash);
      if (!payment) throw new Error("Payment record failed");
      await supabase.from("crypto_payments").insert({
        user_id: user.id,
        user_email: user.email,
        plan_id: plan.id,
        plan_name: plan.name,
        amount: getPriceValue(),
        currency: 'USDT',
        transaction_hash: transactionHash.trim(),
        network: 'TRC20',
        status: 'pending',
        reference: paymentReference,
        submitted_at: new Date().toISOString(),
      });
      toast.success("Transaction submitted! Admin will verify within 24h.");
      setShowCryptoModal(false);
      setTransactionHash("");
      setLoading(false);
      navigate(`/payment-status?status=pending&reference=${paymentReference}`);
    } catch (err) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (isNigeria) await handlePaystackPayment();
    else await handleFlutterwavePayment();
  };

  if (!scriptsLoaded || !plan || !user) return <div style={styles.loading}><div style={styles.spinner}></div><p>Loading...</p></div>;

  // Nigerian UI
  if (isNigeria) {
    return (
      <div style={styles.container}>
        <button style={styles.back} onClick={() => navigate("/upgrade")}>← Back</button>
        <h1 style={styles.title}>Complete Payment</h1>
        <div style={styles.card}>
          <h2>{plan.name}</h2>
          <p>{plan.duration_days} days</p>
          <p style={styles.price}>{getPrice()}</p>
          <button style={styles.payBtn} onClick={handlePayment} disabled={loading}>
            {loading ? "Processing..." : `Pay ${getPrice()} with Paystack`}
          </button>
        </div>
      </div>
    );
  }

  // International UI (Flutterwave + Crypto fallback)
  return (
    <div style={styles.container}>
      <button style={styles.back} onClick={() => navigate("/upgrade")}>← Back</button>
      <h1 style={styles.title}>International Payment</h1>
      <div style={styles.card}>
        <h2>{plan.name}</h2>
        <p>{plan.duration_days} days</p>
        <p style={styles.price}>{getPrice()}</p>

        {!flutterwaveFailed ? (
          <>
            <button style={styles.payBtn} onClick={handlePayment} disabled={loading}>
              {loading ? "Processing..." : `Pay ${getPrice()} with Flutterwave`}
            </button>
            <p style={styles.fallbackNote}>
              Flutterwave issues? <button style={styles.link} onClick={() => setShowCryptoModal(true)}>Pay with USDT TRC20</button>
            </p>
          </>
        ) : (
          <button style={{...styles.payBtn, background: "#9C27B0"}} onClick={() => setShowCryptoModal(true)}>
            Pay with USDT TRC20 (Backup)
          </button>
        )}
      </div>

      {showCryptoModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3>💸 USDT (TRC20) Payment</h3>
            <p>Send <strong>{getPriceValue()} USDT</strong> to:</p>
            <code style={styles.address}>{CRYPTO_WALLET.address}</code>
            <button onClick={() => { navigator.clipboard.writeText(CRYPTO_WALLET.address); toast.success("Copied!"); }}>Copy Address</button>
            <p>Network: {CRYPTO_WALLET.network}</p>
            <input type="text" placeholder="Transaction Hash (TXID)" value={transactionHash} onChange={e => setTransactionHash(e.target.value)} style={styles.input} />
            <div style={styles.modalButtons}>
              <button onClick={() => setShowCryptoModal(false)}>Cancel</button>
              <button onClick={handleCryptoSubmit} disabled={loading}>Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: "500px", margin: "0 auto", padding: "20px", minHeight: "100vh", background: "#000", color: "#fff" },
  back: { background: "#333", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", marginBottom: "20px" },
  title: { color: "#FFD700", textAlign: "center", marginBottom: "30px" },
  card: { background: "#111", padding: "30px", borderRadius: "12px", border: "1px solid #FFD700", textAlign: "center" },
  price: { fontSize: "32px", color: "#00ffcc", margin: "15px 0" },
  payBtn: { width: "100%", padding: "14px", background: "linear-gradient(135deg, #FFD700, #FFA500)", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", marginTop: "20px" },
  fallbackNote: { marginTop: "15px", fontSize: "12px", color: "#aaa" },
  link: { background: "none", border: "none", color: "#FFD700", cursor: "pointer", textDecoration: "underline" },
  modal: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.9)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modalContent: { background: "#111", padding: "30px", borderRadius: "12px", maxWidth: "450px", width: "90%", border: "1px solid #FFD700" },
  address: { display: "block", background: "#000", padding: "10px", borderRadius: "8px", wordBreak: "break-all", margin: "10px 0", fontFamily: "monospace", color: "#00ffcc" },
  input: { width: "100%", padding: "10px", background: "#000", border: "1px solid #333", borderRadius: "8px", color: "#fff", margin: "15px 0" },
  modalButtons: { display: "flex", gap: "10px", justifyContent: "flex-end" },
  loading: { display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", background: "#000" },
  spinner: { width: "40px", height: "40px", border: "3px solid rgba(255,215,0,0.3)", borderTopColor: "#FFD700", borderRadius: "50%", animation: "spin 1s linear infinite" },
};

// Inject keyframes
const styleSheet = document.createElement("style");
styleSheet.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
if (!document.querySelector("#payment-styles")) { styleSheet.id = "payment-styles"; document.head.appendChild(styleSheet); }