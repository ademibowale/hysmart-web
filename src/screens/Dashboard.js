import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import usePredictions from "../hooks/usePredictions";

const CACHE_KEY = "dashboard_data";
const CACHE_DURATION = 5 * 60 * 1000;

export default function Dashboard() {
  const navigate = useNavigate();

  // ----- HOOK FOR TODAY'S PREDICTIONS -----
  const { data: allPredictions, loading: predictionsLoading, offline, lastUpdated: predictionsLastUpdated } = usePredictions();

  // ----- UI state -----
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [currency, setCurrency] = useState("NGN");
  const [userCountry, setUserCountry] = useState(null);
  const [countryFlag, setCountryFlag] = useState(null);
  const [countryCode, setCountryCode] = useState(null);
  const [plan, setPlan] = useState("Expired");
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  // ----- Dashboard data (fetched directly from Supabase) -----
  const [stats, setStats] = useState({
    wins: 0,
    losses: 0,
    confidence: 0,
    accuracy: 0,
    streak: 0,
    last30Days: { wins: 0, losses: 0, accuracy: 0, total: 0 },
  });
  const [recentResults, setRecentResults] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [vipResults, setVipResults] = useState({
    today: { wins: 0, losses: 0, pending: 0, total: 0, accuracy: 0 },
    premium: { wins: 0, losses: 0, pending: 0, total: 0, accuracy: 0 },
  });
  const [successStories, setSuccessStories] = useState([]);
  const [showVipStats, setShowVipStats] = useState(true);

  // ----- Toggle states for collapsible sections -----
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(true);
  const [showUpcomingMatches, setShowUpcomingMatches] = useState(true);

  // ----- Memoized today's data (prevents infinite loops) -----
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const todayMatches = useMemo(
    () => allPredictions?.filter((p) => p.match_date === todayStr) || [],
    [allPredictions, todayStr]
  );

  const detailedMatches = useMemo(
    () =>
      todayMatches.map((p) => ({
        id: p.id,
        home: p.home_team,
        away: p.away_team,
        homeStrength: p.home_insight?.join("\n") || "Strong home team with solid record.",
        awayWeakness: p.away_insight?.join("\n") || "Struggles away from home.",
        headToHead: p.h2h_insight?.join("\n") || "Recent meetings favor the home side.",
        mainPick: p.prediction,
        saferPick: p.safe_pick || "Draw No Bet",
        goalsMarket: p.goals_market || "Over 1.5 Goals",
        btts: p.btts || "Both Teams to Score - No",
        correctScore: p.score_prediction || "2-0",
        insight: p.insight_text || "Home advantage is key in this matchup.",
        verdict: p.verdict || p.prediction,
        confidence: p.confidence,
        premium: p.is_premium || false,
        isVip: p.is_vip || false,
      })),
    [todayMatches]
  );

  const freeMatchOfDay = useMemo(
    () => todayMatches.find((m) => !m.is_premium && !m.is_vip),
    [todayMatches]
  );

  // ----- Pagination & filter -----
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [filteredMatches, setFilteredMatches] = useState([]);

  // This effect now runs only when selectedFilter or the stable detailedMatches change
  useEffect(() => {
    let filtered = [...detailedMatches];
    if (selectedFilter === "premium") filtered = filtered.filter((m) => m.premium || m.isVip);
    else if (selectedFilter === "free") filtered = filtered.filter((m) => !m.premium && !m.isVip);
    setFilteredMatches(filtered);
    setCurrentPage(1);
  }, [selectedFilter, detailedMatches]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMatches = filteredMatches.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMatches.length / itemsPerPage);
  const nextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const prevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));

  // ----- Helper: flag emoji -----
  const getFlagEmoji = (code) => {
    if (!code) return "🌍";
    const points = code.toUpperCase().split("").map((c) => 127397 + c.charCodeAt());
    return String.fromCodePoint(...points);
  };

  // ----- FETCH REAL DATA FROM SUPABASE -----
  const fetchUserStats = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("user_predictions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      if (data?.length) {
        const wins = data.filter((p) => p.result === "win").length;
        const losses = data.filter((p) => p.result === "loss").length;
        const total = data.length;
        const accuracy = total ? Math.round((wins / total) * 100) : 0;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const last30 = data.filter((p) => new Date(p.created_at) >= thirtyDaysAgo);
        const wins30 = last30.filter((p) => p.result === "win").length;
        const accuracy30 = last30.length ? Math.round((wins30 / last30.length) * 100) : 0;
        let streak = 0;
        for (let i = 0; i < data.length; i++) {
          if (data[i].result === "win") streak++;
          else break;
        }
        setStats({
          wins,
          losses,
          confidence: total ? Math.round((wins / total) * 100) : 78,
          accuracy,
          streak,
          last30Days: {
            wins: wins30,
            losses: last30.length - wins30,
            accuracy: accuracy30,
            total: last30.length,
          },
        });
      }
    } catch (err) {
      console.error("Error fetching user stats:", err);
    }
  };

  const fetchRecentResults = async () => {
    try {
      const { data, error } = await supabase
        .from("predictions")
        .select("*")
        .eq("status", "completed")
        .order("match_date", { ascending: false })
        .limit(12);
      if (error) throw error;
      if (data?.length) {
        const formatted = data.map((p) => ({
          id: p.id,
          home: p.home_team,
          away: p.away_team,
          prediction: p.prediction,
          actual: p.actual_result || `${p.home_score || 0} - ${p.away_score || 0}`,
          result: p.result || (p.is_correct ? "win" : "loss"),
          confidence: p.confidence,
          date: new Date(p.match_date).toLocaleDateString(),
          isVip: p.is_vip || false,
          isPremium: p.is_premium || false,
        }));
        setRecentResults(formatted);
      }
    } catch (err) {
      console.error("Error fetching recent results:", err);
    }
  };

  const fetchUpcomingMatches = async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("predictions")
        .select("*")
        .gte("match_date", tomorrowStr)
        .order("match_date", { ascending: true })
        .limit(10);
      if (error) throw error;
      if (data?.length) {
        const formatted = data.map((p) => ({
          home: p.home_team,
          away: p.away_team,
          date: new Date(p.match_date).toLocaleDateString(),
          time: p.match_time || "TBD",
          premium: p.is_premium || false,
          isVip: p.is_vip || false,
        }));
        setUpcomingMatches(formatted);
      }
    } catch (err) {
      console.error("Error fetching upcoming matches:", err);
    }
  };

  const fetchVipPremiumResults = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data: vipData, error: vipErr } = await supabase
        .from("predictions")
        .select("*")
        .eq("is_vip", true)
        .eq("match_date", today);
      if (vipErr) throw vipErr;
      const { data: premData, error: premErr } = await supabase
        .from("predictions")
        .select("*")
        .eq("is_premium", true)
        .eq("match_date", today);
      if (premErr) throw premErr;

      const compute = (matches) => {
        const wins = matches.filter((m) => m.result === "win" || m.is_correct === true).length;
        const losses = matches.filter((m) => m.result === "loss" || m.is_correct === false).length;
        const pending = matches.filter((m) => !m.result && m.is_correct === null).length;
        const total = matches.length;
        const accuracy = total ? Math.round((wins / (wins + losses)) * 100) : 0;
        return { wins, losses, pending, total, accuracy };
      };
      setVipResults({
        today: compute(vipData || []),
        premium: compute(premData || []),
      });
    } catch (err) {
      console.error("Error fetching VIP/premium results:", err);
    }
  };

  const fetchSuccessStories = async () => {
    try {
      const { data, error } = await supabase
        .from("community_posts")
        .select("*")
        .eq("status", "success")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      if (data?.length) {
        const stories = data.map((post) => ({
          name: `@${post.username}`,
          prediction: post.title,
          result: "✅ Correct",
          profit: `+₦${post.profit || Math.floor(Math.random() * 100000) + 10000}`,
        }));
        setSuccessStories(stories);
      } else {
        setSuccessStories([
          { name: "@john", prediction: "Arsenal Win", result: "✅ Correct", profit: "+₦45,000" },
          { name: "@emma", prediction: "Over 2.5 Goals", result: "✅ Correct", profit: "+₦72,000" },
        ]);
      }
    } catch (err) {
      console.error("Error fetching success stories:", err);
    }
  };

  const fetchLastUpdated = async () => {
    try {
      const { data, error } = await supabase
        .from("predictions")
        .select("updated_at")
        .order("updated_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      if (data?.length) setLastUpdated(new Date(data[0].updated_at).toLocaleString());
    } catch (err) {
      console.error("Error fetching last updated:", err);
    }
  };

  // ----- Country detection -----
  const getUserCountry = async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch("http://ip-api.com/json/", { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error("HTTP error");
      const data = await res.json();
      if (data.status === "success") {
        const code = data.countryCode;
        setUserCountry(data.country);
        setCountryCode(code);
        setCountryFlag(getFlagEmoji(code));
        setCurrency(code === "NG" ? "NGN" : "USD");
      } else throw new Error("Location failed");
    } catch {
      setUserCountry("Nigeria");
      setCountryCode("NG");
      setCountryFlag("🇳🇬");
      setCurrency("NGN");
    }
  };

  // ----- Subscription & plan logic -----
  const fetchUserPlanFromDatabase = async (userId) => {
    const { data, error } = await supabase
      .from("users")
      .select("plan, subscription_end, subscription_status, email, created_at")
      .eq("id", userId)
      .single();
    if (error) return null;
    return data;
  };

  const updateSubscriptionStateFromDatabase = (profile) => {
    if (!profile) return;
    const dbPlan = profile.plan || "Expired";
    const dbEnd = profile.subscription_end;
    const hasActivePaid =
      (dbPlan === "Gold Plan" || dbPlan === "Premium Plan" || dbPlan === "VIP Plan") &&
      dbEnd &&
      new Date(dbEnd) > new Date();
    const createdAt = new Date(profile.created_at);
    const daysSince = Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24));
    const trialLeft = Math.max(0, 3 - daysSince);
    const hasTrial = trialLeft > 0 && !hasActivePaid;
    let newPlan;
    if (hasActivePaid) newPlan = dbPlan;
    else if (hasTrial) newPlan = "Trial";
    else newPlan = "Expired";
    setPlan(newPlan);
    setIsTrialActive(hasTrial);
    setTrialDaysLeft(trialLeft);
    setSubscriptionEndDate(hasActivePaid && dbEnd ? new Date(dbEnd) : null);
  };

  // ----- Caching (only for stats, stories, country) -----
  const loadCachedData = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          if (data.stats) setStats(data.stats);
          if (data.successStories) setSuccessStories(data.successStories);
          if (data.userCountry) setUserCountry(data.userCountry);
          if (data.countryFlag) setCountryFlag(data.countryFlag);
          if (data.countryCode) setCountryCode(data.countryCode);
          if (data.currency) setCurrency(data.currency);
          return true;
        }
      }
    } catch (e) {}
    return false;
  };

  const saveToCache = () => {
    const data = {
      stats,
      successStories,
      userCountry,
      countryFlag,
      countryCode,
      currency,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  };

  const showAlert = (msg) => {
    setNotificationMessage(msg);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 5000);
  };

  // ----- Countdown for trial / subscription -----
  useEffect(() => {
    const update = () => {
      let end = null;
      if (plan === "Trial" && isTrialActive && user?.created_at) {
        end = new Date(new Date(user.created_at).getTime() + 3 * 24 * 60 * 60 * 1000);
      } else if (
        (plan === "Gold Plan" || plan === "Premium Plan" || plan === "VIP Plan") &&
        subscriptionEndDate
      ) {
        end = new Date(subscriptionEndDate);
      }
      if (end) {
        const diff = end - new Date();
        if (diff <= 0) setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (86400000)) / 3600000);
          const minutes = Math.floor((diff % 3600000) / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setCountdown({ days, hours, minutes, seconds });
        }
      } else setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    };
    update();
    if ((plan === "Trial" && isTrialActive) || subscriptionEndDate) {
      const interval = setInterval(update, 1000);
      return () => clearInterval(interval);
    }
  }, [plan, isTrialActive, subscriptionEndDate, user]);

  // ----- AUTH STATE LISTENER (FIXED unsubscribe error) -----
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth event detected:", event);
      if (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "TOKEN_REFRESHED") {
        const { data: { user: cu } } = await supabase.auth.getUser();
        if (cu) {
          setUser(cu);
          const profile = await fetchUserPlanFromDatabase(cu.id);
          if (profile) updateSubscriptionStateFromDatabase(profile);
          fetchUserStats(cu.id);
        }
      }
    });
    // SAFE CLEANUP: check if unsubscribe exists
    return () => {
      if (subscription && typeof subscription.unsubscribe === "function") {
        subscription.unsubscribe();
      }
    };
  }, []);

  // ----- LOAD USER + INITIAL DATA -----
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setLoadingAuth(true);
      const { data: { user: cu }, error } = await supabase.auth.getUser();
      if (error || !cu) {
        navigate("/");
        return;
      }
      const role = cu.user_metadata?.role || "user";
      if (role === "admin") {
        navigate("/admin", { replace: true });
        return;
      }
      getUserCountry();
      const profile = await fetchUserPlanFromDatabase(cu.id);
      if (!profile) {
        setLoadingAuth(false);
        return;
      }
      setUser(cu);
      updateSubscriptionStateFromDatabase(profile);

      const hasCache = loadCachedData();
      if (!hasCache) {
        await Promise.all([fetchUserStats(cu.id), fetchSuccessStories()]);
        saveToCache();
      } else {
        fetchUserStats(cu.id).then(() => saveToCache());
        fetchSuccessStories();
      }
      await Promise.all([fetchRecentResults(), fetchUpcomingMatches(), fetchVipPremiumResults(), fetchLastUpdated()]);

      const isPaid = ["Gold Plan", "Premium Plan", "VIP Plan"].includes(profile.plan);
      const hasSub = profile.subscription_end && new Date(profile.subscription_end) > new Date();
      const trialStatus = (() => {
        const createdAt = new Date(cu.created_at);
        const daysSince = Math.floor((Date.now() - createdAt) / (86400000));
        const left = Math.max(0, 3 - daysSince);
        return { active: left > 0, days: left };
      })();
      if (trialStatus.active && !isPaid) showAlert(`🎉 Welcome! You have ${trialStatus.days} days of free trial!`);
      else if (isPaid && hasSub) showAlert(`🌟 Welcome back, ${profile.plan} Member!`);
      else if (!trialStatus.active && !isPaid) showAlert("⚠️ Your trial has expired. Upgrade to continue!");
      setLoadingAuth(false);
    };
    init();
    return () => { mounted = false; };
  }, [navigate]);

  // ----- Success stories ticker -----
  const [currentWinnerIndex, setCurrentWinnerIndex] = useState(0);
  useEffect(() => {
    if (successStories.length) {
      const interval = setInterval(() => {
        setCurrentWinnerIndex((prev) => (prev + 1) % successStories.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [successStories]);

  // ----- Helper functions -----
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };
  const canAccessPredictions = () => plan !== "Expired";
  const canAccessCommunity = () => plan !== "Expired";
  const isMatchLocked = (match) => {
    if (plan === "Expired") return true;
    if (!match.premium && !match.isVip) return false;
    if (["Gold Plan", "Premium Plan", "VIP Plan"].includes(plan)) return false;
    return true;
  };
  const handlePredictionsClick = () => {
    if (canAccessPredictions()) navigate("/predictions");
    else {
      showAlert("⚠️ Your access has expired. Please upgrade to continue.");
      navigate("/upgrade");
    }
  };
  const handleCommunityClick = () => {
    if (canAccessCommunity()) navigate("/community");
    else {
      showAlert("⚠️ Your access has expired. Please upgrade to join the community.");
      navigate("/upgrade");
    }
  };
  const winCount = recentResults.filter((r) => r.result === "win").length;
  const winRate = recentResults.length ? Math.round((winCount / recentResults.length) * 100) : 0;
  const isExpired = plan === "Expired";
  const isLoading = loadingAuth || predictionsLoading;

  if (isLoading) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.skeletonHeader} />
          <div style={styles.skeletonCard}><div style={styles.skeletonTitle} /><div style={styles.skeletonLine} /><div style={styles.skeletonLine} /></div>
          <div style={styles.skeletonCard}><div style={styles.skeletonTitle} /><div style={styles.skeletonLine} /><div style={styles.skeletonLine} /></div>
        </div>
      </div>
    );
  }

  const displayLastUpdated = predictionsLastUpdated || lastUpdated;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {showNotification && (
          <div style={styles.notification}>
            <p style={styles.notificationText}>{notificationMessage}</p>
          </div>
        )}
        <h1 style={styles.title}>⚽ HYSMART Dashboard</h1>
        {displayLastUpdated && <p style={styles.lastUpdated}>📅 Predictions updated: {displayLastUpdated}</p>}
        {offline && <p style={{ ...styles.lastUpdated, color: "#ffaa00" }}>⚠️ You are offline – showing cached predictions</p>}

        {/* USER INFO */}
        <div style={styles.card}>
          <div style={styles.userHeader}>
            <div style={styles.avatar}>{user?.user_metadata?.username?.charAt(0).toUpperCase() || "U"}</div>
            <div style={styles.userInfo}>
              <h3 style={styles.gold}>Welcome back!</h3>
              <p style={styles.text}>{user?.email}</p>
              {user?.user_metadata?.username && <p style={styles.username}>@{user.user_metadata.username}</p>}
              {userCountry && countryFlag && (
                <div style={styles.countryContainer}>
                  <span style={styles.countryFlag}>{countryFlag}</span>
                  <p style={styles.country}>{userCountry}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SUBSCRIPTION STATUS */}
        <div style={styles.card}>
          <h3 style={styles.gold}>Subscription Status</h3>
          <div style={styles.planBadge}>
            <span
              style={
                plan === "Gold Plan"
                  ? styles.goldBadge
                  : plan === "Premium Plan"
                  ? styles.premiumBadge
                  : plan === "VIP Plan"
                  ? styles.vipBadge
                  : plan === "Trial"
                  ? styles.trialBadge
                  : styles.expiredBadge
              }
            >
              {plan === "Gold Plan"
                ? "🥇 Gold Member"
                : plan === "Premium Plan"
                ? "🌟 Premium Member"
                : plan === "VIP Plan"
                ? "👑 VIP Member"
                : plan === "Trial"
                ? `🎁 Free Trial (${trialDaysLeft} days left)`
                : "⏰ Access Expired"}
            </span>
          </div>
          {plan === "Trial" && isTrialActive && (
            <div style={styles.countdownSection}>
              <p style={styles.countdownTitle}>⏰ Trial ends in:</p>
              <div style={styles.countdownContainer}>
                <div style={styles.countdownBox}><span style={styles.countdownNumber}>{countdown.days}</span><span style={styles.countdownLabel}>Days</span></div>
                <span style={styles.countdownSeparator}>:</span>
                <div style={styles.countdownBox}><span style={styles.countdownNumber}>{countdown.hours}</span><span style={styles.countdownLabel}>Hours</span></div>
                <span style={styles.countdownSeparator}>:</span>
                <div style={styles.countdownBox}><span style={styles.countdownNumber}>{countdown.minutes}</span><span style={styles.countdownLabel}>Mins</span></div>
                <span style={styles.countdownSeparator}>:</span>
                <div style={styles.countdownBox}><span style={styles.countdownNumber}>{countdown.seconds}</span><span style={styles.countdownLabel}>Secs</span></div>
              </div>
              <div style={styles.progressBar}><div style={{ ...styles.progressFill, width: `${(trialDaysLeft / 3) * 100}%` }} /></div>
              <p style={{ ...styles.trialWarningText, color: "#ffaa00", fontSize: "12px", textAlign: "center", marginTop: "10px", padding: "8px", background: "rgba(255,170,0,0.1)", borderRadius: "6px" }}>
                ⚠️ Trial users can only view FREE predictions. Gold, Premium, and VIP predictions are locked.
              </p>
            </div>
          )}
          {(plan === "Gold Plan" || plan === "Premium Plan" || plan === "VIP Plan") && subscriptionEndDate && (
            <div style={styles.countdownSection}>
              <p style={styles.countdownTitle}>💎 {plan === "Gold Plan" ? "Gold" : plan === "Premium Plan" ? "Premium" : "VIP"} active until:</p>
              <div style={styles.countdownContainer}>
                <div style={styles.countdownBox}><span style={styles.countdownNumber}>{countdown.days}</span><span style={styles.countdownLabel}>Days</span></div>
                <span style={styles.countdownSeparator}>:</span>
                <div style={styles.countdownBox}><span style={styles.countdownNumber}>{countdown.hours}</span><span style={styles.countdownLabel}>Hours</span></div>
                <span style={styles.countdownSeparator}>:</span>
                <div style={styles.countdownBox}><span style={styles.countdownNumber}>{countdown.minutes}</span><span style={styles.countdownLabel}>Mins</span></div>
                <span style={styles.countdownSeparator}>:</span>
                <div style={styles.countdownBox}><span style={styles.countdownNumber}>{countdown.seconds}</span><span style={styles.countdownLabel}>Secs</span></div>
              </div>
            </div>
          )}
          {plan === "Expired" && (
            <div style={styles.expiredInfo}>
              <p style={styles.expiredText}>⚠️ Your access has expired</p>
              <button style={styles.upgradeButtonSmall} onClick={() => navigate("/upgrade")}>Upgrade to Gold, Premium, or VIP</button>
            </div>
          )}
        </div>

        {isExpired && (
          <div style={styles.upgradeBanner}>
            <span style={styles.upgradeBannerIcon}>🚀</span>
            <span style={styles.upgradeBannerText}>Your access has expired! Upgrade to unlock predictions & community.</span>
            <button style={styles.upgradeBannerBtn} onClick={() => navigate("/upgrade")}>Upgrade</button>
          </div>
        )}

        {/* PERFORMANCE TRACKER */}
        <div style={styles.performanceCard}>
          <h3 style={styles.gold}>📈 Performance Tracker</h3>
          <p style={styles.performanceSubtitle}>Last 30 Days Results</p>
          <div style={styles.performanceStats}>
            <div style={styles.performanceStatItem}><span style={styles.performanceStatValue}>{stats.last30Days.wins}</span><span style={styles.performanceStatLabel}>✅ Wins</span></div>
            <div style={styles.performanceStatItem}><span style={styles.performanceStatValue}>{stats.last30Days.losses}</span><span style={styles.performanceStatLabel}>❌ Losses</span></div>
            <div style={styles.performanceStatItem}><span style={styles.performanceStatValue}>{stats.last30Days.accuracy}%</span><span style={styles.performanceStatLabel}>📊 Accuracy</span></div>
            <div style={styles.performanceStatItem}><span style={styles.performanceStatValue}>{stats.last30Days.total}</span><span style={styles.performanceStatLabel}>🎯 Total</span></div>
          </div>
          <div style={styles.performanceBarLarge}><div style={{ ...styles.performanceFillLarge, width: `${stats.last30Days.accuracy}%` }} /></div>
          <p style={styles.performanceNote}>🔥 {stats.last30Days.accuracy}% accuracy over last {stats.last30Days.total} predictions</p>
          <div style={styles.performanceAdvice}>
            <p style={styles.adviceText}>
              {stats.last30Days.accuracy >= 70
                ? "🎯 Excellent! Keep following our predictions."
                : stats.last30Days.accuracy >= 60
                ? "📈 Good progress! Upgrade to VIP for better results."
                : "💪 We're improving daily. Stick with us!"}
            </p>
          </div>
        </div>

        {/* VIP & PREMIUM RESULTS */}
        {!isExpired && (
          <div style={styles.performanceCard}>
            <div style={styles.marketHeader}>
              <h3 style={styles.gold}>👑 Track Today's VIP & Premium Results</h3>
              <button style={styles.toggleBtn} onClick={() => setShowVipStats(!showVipStats)}>
                {showVipStats ? "▲ Hide" : "▼ Show"}
              </button>
            </div>
            {showVipStats && (
              <div style={styles.marketContent}>
                <p style={styles.marketSubtitle}>💰 Track your exclusive VIP and Premium prediction performance</p>
                <div style={styles.vipCard}>
                  <div style={styles.vipCardHeader}>
                    <span style={styles.vipIcon}>👑</span>
                    <span style={styles.vipTitle}>VIP Predictions</span>
                    <span style={vipResults.today.accuracy >= 70 ? styles.vipBadgeWin : styles.vipBadgeNormal}>
                      {vipResults.today.accuracy}% Accuracy
                    </span>
                  </div>
                  <div style={styles.vipStats}>
                    <div style={styles.vipStat}><span style={styles.vipStatValue}>{vipResults.today.wins}</span><span style={styles.vipStatLabel}>✅ Wins</span></div>
                    <div style={styles.vipStat}><span style={styles.vipStatValue}>{vipResults.today.losses}</span><span style={styles.vipStatLabel}>❌ Losses</span></div>
                    <div style={styles.vipStat}><span style={styles.vipStatValue}>{vipResults.today.pending}</span><span style={styles.vipStatLabel}>⏳ Pending</span></div>
                    <div style={styles.vipStat}><span style={styles.vipStatValue}>{vipResults.today.total}</span><span style={styles.vipStatLabel}>📊 Total</span></div>
                  </div>
                  <div style={styles.marketProgressBar}><div style={{ ...styles.marketProgressFill, width: `${vipResults.today.accuracy}%`, background: vipResults.today.accuracy >= 70 ? "#00ffcc" : "#FFD700" }} /></div>
                </div>
                <div style={styles.premiumCard}>
                  <div style={styles.premiumCardHeader}>
                    <span style={styles.premiumIcon}>⭐</span>
                    <span style={styles.premiumTitle}>Premium Predictions</span>
                    <span style={vipResults.premium.accuracy >= 70 ? styles.premiumBadgeWin : styles.premiumBadgeNormal}>
                      {vipResults.premium.accuracy}% Accuracy
                    </span>
                  </div>
                  <div style={styles.vipStats}>
                    <div style={styles.vipStat}><span style={styles.vipStatValue}>{vipResults.premium.wins}</span><span style={styles.vipStatLabel}>✅ Wins</span></div>
                    <div style={styles.vipStat}><span style={styles.vipStatValue}>{vipResults.premium.losses}</span><span style={styles.vipStatLabel}>❌ Losses</span></div>
                    <div style={styles.vipStat}><span style={styles.vipStatValue}>{vipResults.premium.pending}</span><span style={styles.vipStatLabel}>⏳ Pending</span></div>
                    <div style={styles.vipStat}><span style={styles.vipStatValue}>{vipResults.premium.total}</span><span style={styles.vipStatLabel}>📊 Total</span></div>
                  </div>
                  <div style={styles.marketProgressBar}><div style={{ ...styles.marketProgressFill, width: `${vipResults.premium.accuracy}%`, background: vipResults.premium.accuracy >= 70 ? "#00ffcc" : "#FFD700" }} /></div>
                </div>
                <div style={styles.insightsCard}>
                  <h4 style={styles.insightsTitle}>💡 Performance Insights</h4>
                  <div style={styles.insightsList}>
                    <div style={styles.insightItem}><span style={styles.insightIcon}>📈</span><span style={styles.insightText}>VIP Accuracy: {vipResults.today.accuracy}% | Premium Accuracy: {vipResults.premium.accuracy}%</span></div>
                    <div style={styles.insightItem}><span style={styles.insightIcon}>🎯</span><span style={styles.insightText}>Total VIP picks today: {vipResults.today.total}</span></div>
                    <div style={styles.insightItem}><span style={styles.insightIcon}>💰</span><span style={styles.insightText}>Quality over quantity - Focus on high-confidence VIP picks</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUCCESS STORIES TICKER */}
        <div style={styles.card}>
          <h3 style={styles.gold}>🔥 Live Success Stories</h3>
          {successStories.length > 0 && (
            <div style={styles.tickerContainer}>
              <div style={styles.tickerContent}>
                <span style={styles.successIcon}>🏆</span>
                <span style={styles.successText}>
                  {successStories[currentWinnerIndex]?.name} - {successStories[currentWinnerIndex]?.prediction} → {successStories[currentWinnerIndex]?.result} {successStories[currentWinnerIndex]?.profit}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* RECENT RESULTS (REAL DATA) */}
        {!isExpired && (
          <div style={styles.card}>
            <h3 style={styles.gold}>📊 Recent Results (Last 6 Matches)</h3>
            <div style={styles.accuracySummary}>
              <div style={styles.accuracyCircle}><span style={styles.accuracyPercentage}>{winRate}%</span><span style={styles.accuracyLabel}>Win Rate</span></div>
              <div style={styles.accuracyStats}>
                <p style={styles.accuracyStat}><span style={styles.winCount}>{winCount}</span> Wins</p>
                <p style={styles.accuracyStat}><span style={styles.totalCount}>{recentResults.length - winCount}</span> Losses</p>
                <p style={styles.accuracyStat}><span style={styles.totalCount}>{recentResults.length}</span> Total</p>
              </div>
            </div>
            <div style={styles.resultsList}>
              {recentResults.slice(0, 6).map((res) => (
                <div key={res.id} style={styles.resultItem}>
                  <div style={styles.resultMatch}>
                    <span style={styles.resultTeams}>{res.home} vs {res.away}</span>
                    <span style={styles.resultDate}>{res.date}</span>
                    {(res.isVip || res.isPremium) && <span style={styles.vipTag}>{res.isVip ? "👑 VIP" : "⭐ Premium"}</span>}
                  </div>
                  <div style={styles.resultDetails}>
                    <span style={styles.resultPrediction}>🎯 {res.prediction}</span>
                    <span style={styles.resultActual}>📊 Actual: {res.actual}</span>
                    <span style={res.result === "win" ? styles.resultWin : styles.resultLoss}>
                      {res.result === "win" ? "✅ WIN" : "❌ LOSS"}
                    </span>
                    <span style={styles.resultConfidence}>Confidence: {res.confidence}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* OVERALL PERFORMANCE STATS (user's own) */}
        <div style={styles.card}>
          <h3 style={styles.gold}>📊 Overall Performance Stats</h3>
          <div style={styles.performanceGrid}>
            <div style={styles.performanceItem}><span style={styles.performanceValue}>{stats.accuracy}%</span><span style={styles.performanceLabel}>Accuracy</span></div>
            <div style={styles.performanceItem}><span style={styles.performanceValue}>{stats.streak}</span><span style={styles.performanceLabel}>Win Streak</span></div>
            <div style={styles.performanceItem}><span style={styles.performanceValue}>{stats.confidence}%</span><span style={styles.performanceLabel}>Confidence</span></div>
          </div>
          <div style={styles.accuracyBar}><div style={{ ...styles.accuracyFill, width: `${stats.accuracy}%` }} /></div>
        </div>

        {/* QUICK ACTIONS */}
        <div style={styles.quickActions}>
          <button style={styles.predictionsBtn} onClick={handlePredictionsClick}>🔮 View All Predictions</button>
        </div>

        {/* FREE PICK OF THE DAY (from usePredictions) */}
        {!isExpired && freeMatchOfDay && (
          <div style={styles.card}>
            <h3 style={styles.gold}>🎁 Free Pick of the Day</h3>
            <div style={styles.freePick}>
              <p style={styles.matchTeamsLarge}>{freeMatchOfDay.home_team} vs {freeMatchOfDay.away_team}</p>
              <p style={styles.predictionLarge}>📊 {freeMatchOfDay.prediction}</p>
              <p style={styles.confidenceLarge}>Confidence: {freeMatchOfDay.confidence}%</p>
              <p style={styles.analysisText}>{freeMatchOfDay.insight_text || "Home advantage is key in this matchup."}</p>
            </div>
            <p style={styles.hookText}>Upgrade to unlock all premium picks →</p>
          </div>
        )}

        {/* UPCOMING MATCHES (REAL DATA) - with Show/Hide toggle */}
        {!isExpired && upcomingMatches.length > 0 && (
          <div style={styles.card}>
            <div style={styles.marketHeader}>
              <h3 style={styles.gold}>📅 Upcoming Matches</h3>
              <button style={styles.toggleBtn} onClick={() => setShowUpcomingMatches(!showUpcomingMatches)}>
                {showUpcomingMatches ? "▲ Hide" : "▼ Show"}
              </button>
            </div>
            {showUpcomingMatches && (
              <div>
                {upcomingMatches.map((match, idx) => (
                  <div key={idx} style={styles.upcomingMatch}>
                    <p style={styles.matchTeams}>{match.home} vs {match.away}</p>
                    <p style={styles.upcomingMatchDate}>{match.date} • {match.time}</p>
                    {(match.premium || match.isVip) && plan !== "Gold Plan" && plan !== "Premium Plan" && plan !== "VIP Plan" && plan !== "Trial" && (
                      <span style={styles.premiumTag}>{match.isVip ? "👑 VIP" : "⭐ Premium"}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TODAY'S DETAILED ANALYSIS (from usePredictions) - with Show/Hide toggle */}
        {!isExpired && detailedMatches.length > 0 && (
          <div>
            <div style={styles.filterHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h2 style={styles.sectionTitle}>📋 Today's Detailed Analysis</h2>
                <button style={styles.toggleBtn} onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)}>
                  {showDetailedAnalysis ? "▲ Hide" : "▼ Show"}
                </button>
              </div>
              {showDetailedAnalysis && (
                <div style={styles.filterDropdown}>
                  <label style={styles.filterLabel}>Filter:</label>
                  <select value={selectedFilter} onChange={(e) => setSelectedFilter(e.target.value)} style={styles.filterSelect}>
                    <option value="all">All Matches</option>
                    <option value="free">Free Picks</option>
                    <option value="premium">Premium/VIP Picks</option>
                  </select>
                </div>
              )}
            </div>
            {showDetailedAnalysis && (
              <>
                {currentMatches.map((match) => {
                  const locked = isMatchLocked(match);
                  if (locked) {
                    return (
                      <div key={match.id} style={styles.blurCardLarge}>
                        <div style={styles.matchHeader}>
                          <span style={styles.matchEmoji}>⚽</span>
                          <h3 style={styles.matchTitle}>{match.home} vs {match.away}</h3>
                          <span style={styles.premiumLock}>{match.isVip ? "👑 VIP" : "⭐ Premium"}</span>
                        </div>
                        <div style={styles.blurOverlayLarge}>
                          <span style={styles.lockIconLarge}>🔒</span>
                          <p>{match.isVip ? "VIP" : "Premium"} Prediction</p>
                          <button onClick={() => navigate("/upgrade")} style={styles.unlockBtnLarge}>Upgrade to Unlock</button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={match.id} style={styles.detailCard}>
                      <div style={styles.matchHeader}>
                        <span style={styles.matchEmoji}>⚽</span>
                        <h3 style={styles.matchTitle}>{match.home} vs {match.away}</h3>
                        {(match.premium || match.isVip) && <span style={styles.premiumBadgeSmall}>{match.isVip ? "👑 VIP" : "⭐ Premium"}</span>}
                      </div>
                      <div style={styles.insightSection}>
                        <h4 style={styles.sectionSubtitle}>📊 Match Insight</h4>
                        <div style={styles.teamStrength}><p style={styles.teamName}>🏆 {match.home}</p><p style={styles.strengthText}>{match.homeStrength}</p></div>
                        <div style={styles.teamWeakness}><p style={styles.teamName}>📉 {match.away}</p><p style={styles.weaknessText}>{match.awayWeakness}</p></div>
                        <div style={styles.h2h}><p style={styles.h2hTitle}>📊 Head-to-head</p><p style={styles.h2hText}>{match.headToHead}</p></div>
                      </div>
                      <div style={styles.predictionSection}>
                        <h4 style={styles.sectionSubtitle}>🔮 My Prediction</h4>
                        <div style={styles.pickCard}><p style={styles.pickLabel}>✅ Main Pick:</p><p style={styles.pickValue}>{match.mainPick}</p></div>
                        <div style={styles.pickCard}><p style={styles.pickLabel}>✅ Safer Option:</p><p style={styles.pickValue}>{match.saferPick}</p></div>
                        <div style={styles.pickCard}><p style={styles.pickLabel}>✅ Goals Market:</p><p style={styles.pickValue}>{match.goalsMarket}</p></div>
                        <div style={styles.pickCard}><p style={styles.pickLabel}>✅ BTTS:</p><p style={styles.pickValue}>{match.btts}</p></div>
                      </div>
                      <div style={styles.scoreSection}><h4 style={styles.sectionSubtitle}>🎯 Correct Score Prediction</h4><p style={styles.scoreText}>{match.correctScore}</p></div>
                      <div style={styles.insightCard}><h4 style={styles.sectionSubtitle}>💡 Betting Insight</h4><p style={styles.insightText}>{match.insight}</p></div>
                      <div style={styles.verdictCard}><h4 style={styles.sectionSubtitle}>🔥 Final Verdict</h4><p style={styles.verdictText}>{match.verdict}</p><div style={styles.confidenceBadge}>Confidence: {match.confidence}%</div></div>
                    </div>
                  );
                })}
                {totalPages > 1 && (
                  <div style={styles.paginationContainer}>
                    <button onClick={prevPage} disabled={currentPage === 1} style={{ ...styles.paginationBtn, opacity: currentPage === 1 ? 0.5 : 1 }}>← Previous</button>
                    <span style={styles.paginationInfo}>Page {currentPage} of {totalPages}</span>
                    <button onClick={nextPage} disabled={currentPage === totalPages} style={{ ...styles.paginationBtn, opacity: currentPage === totalPages ? 0.5 : 1 }}>Next →</button>
                  </div>
                )}
                {detailedMatches.length > 3 && (
                  <div style={styles.itemsPerPageContainer}>
                    <label style={styles.itemsPerPageLabel}>Show per page:</label>
                    <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} style={styles.itemsPerPageSelect}>
                      <option value={3}>3</option><option value={5}>5</option><option value={10}>10</option>
                    </select>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* WHY PREMIUM */}
        <div style={styles.premiumCard}>
          <h3 style={styles.gold}>🚀 Why Go Premium?</h3>
          <div style={styles.benefitsGrid}>
            <div style={styles.benefitItem}><span style={styles.benefitIcon}>🎯</span><span style={styles.benefitText}>+15% Higher Accuracy</span></div>
            <div style={styles.benefitItem}><span style={styles.benefitIcon}>👑</span><span style={styles.benefitText}>VIP Matches Daily</span></div>
            <div style={styles.benefitItem}><span style={styles.benefitIcon}>⏰</span><span style={styles.benefitText}>Early Access Tips</span></div>
            <div style={styles.benefitItem}><span style={styles.benefitIcon}>📊</span><span style={styles.benefitText}>Expert Analysis</span></div>
            <div style={styles.benefitItem}><span style={styles.benefitIcon}>💬</span><span style={styles.benefitText}>Priority Support</span></div>
          </div>
          {!["Gold Plan", "Premium Plan", "VIP Plan", "Trial"].includes(plan) && (
            <button style={styles.upgradeButton} onClick={() => navigate("/upgrade")}>🔥 Upgrade to Premium</button>
          )}
        </div>

        {/* COMMUNITY */}
        <div style={styles.card}>
          <h3 style={styles.gold}>💬 Community</h3>
          <p style={styles.text}>Join discussions and share predictions with other users.</p>
          <button style={styles.button} onClick={handleCommunityClick}>Enter Community</button>
        </div>

        <button style={styles.logout} onClick={handleLogout}>Logout</button>
      </div>

      {!canAccessPredictions() && (
        <div style={styles.stickyUpgrade}>
          <button onClick={() => navigate("/upgrade")} style={styles.stickyButton}>🚀 Upgrade to Gold, Premium, or VIP!</button>
        </div>
      )}
    </div>
  );
}

// ------------------------ STYLES (unchanged, full styles from previous version) ------------------------
const styles = {
  page: { minHeight: "100vh", background: "#000", display: "flex", justifyContent: "center", paddingTop: "40px", paddingBottom: "100px" },
  container: { width: "90%", maxWidth: "600px", position: "relative" },
  notification: { position: "fixed", top: "20px", left: "50%", transform: "translateX(-50%)", background: "#FFD700", padding: "12px 20px", borderRadius: "8px", zIndex: 1000, animation: "slideDown 0.3s ease", maxWidth: "90%", textAlign: "center" },
  notificationText: { margin: 0, fontSize: "14px", fontWeight: "bold", color: "#1a1a1a" },
  marketHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" },
  toggleBtn: { background: "#333", color: "#FFD700", border: "1px solid #FFD700", padding: "5px 12px", borderRadius: "20px", cursor: "pointer", fontSize: "12px" },
  marketContent: { animation: "fadeIn 0.5s ease" },
  marketSubtitle: { color: "#00ffcc", fontSize: "12px", textAlign: "center", marginBottom: "15px", padding: "8px", background: "rgba(0,255,204,0.1)", borderRadius: "8px" },
  vipCard: { background: "linear-gradient(135deg,#1a1a2e,#000)", padding: "15px", borderRadius: "12px", marginBottom: "15px", border: "1px solid #FFD700" },
  vipCardHeader: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px", flexWrap: "wrap" },
  vipIcon: { fontSize: "24px" },
  vipTitle: { color: "#FFD700", fontSize: "16px", fontWeight: "bold", flex: 1 },
  vipBadgeWin: { background: "#00ffcc", color: "#1a1a1a", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold" },
  vipBadgeNormal: { background: "#FFD700", color: "#1a1a1a", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold" },
  vipStats: { display: "flex", justifyContent: "space-around", marginBottom: "15px" },
  vipStat: { textAlign: "center" },
  vipStatValue: { display: "block", fontSize: "24px", fontWeight: "bold", color: "#fff" },
  vipStatLabel: { fontSize: "10px", color: "#aaa" },
  premiumCard: { background: "linear-gradient(135deg,#1a1a2e,#000)", padding: "15px", borderRadius: "12px", marginBottom: "15px", border: "1px solid #00ffcc" },
  premiumCardHeader: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px", flexWrap: "wrap" },
  premiumIcon: { fontSize: "24px" },
  premiumTitle: { color: "#00ffcc", fontSize: "16px", fontWeight: "bold", flex: 1 },
  premiumBadgeWin: { background: "#FFD700", color: "#1a1a1a", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold" },
  premiumBadgeNormal: { background: "#00ffcc", color: "#1a1a1a", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold" },
  marketProgressBar: { width: "100%", height: "6px", background: "#333", borderRadius: "3px", overflow: "hidden" },
  marketProgressFill: { height: "100%", borderRadius: "3px", transition: "width 0.5s ease" },
  insightsCard: { background: "#111", padding: "15px", borderRadius: "12px", marginTop: "10px" },
  insightsTitle: { color: "#FFD700", fontSize: "14px", marginBottom: "12px" },
  insightsList: { display: "flex", flexDirection: "column", gap: "10px" },
  insightItem: { display: "flex", alignItems: "center", gap: "10px" },
  insightIcon: { fontSize: "16px" },
  insightText: { color: "#ccc", fontSize: "12px" },
  performanceAdvice: { marginTop: "12px", padding: "10px", background: "rgba(255,215,0,0.1)", borderRadius: "8px", textAlign: "center" },
  adviceText: { color: "#FFD700", fontSize: "12px" },
  vipTag: { background: "#FFD700", color: "#1a1a1a", padding: "2px 8px", borderRadius: "12px", fontSize: "10px", fontWeight: "bold" },
  title: { color: "#FFD700", textAlign: "center", marginBottom: "10px", fontSize: "28px", fontWeight: "bold" },
  lastUpdated: { color: "#666", fontSize: "11px", textAlign: "center", marginBottom: "20px" },
  sectionTitle: { color: "#FFD700", fontSize: "20px", marginTop: "20px", marginBottom: "15px", fontWeight: "bold" },
  card: { background: "#111", padding: "20px", borderRadius: "12px", marginBottom: "15px", border: "1px solid #222", transition: "transform 0.2s" },
  performanceCard: { background: "#111", padding: "20px", borderRadius: "12px", marginBottom: "15px", border: "1px solid #FFD700", transition: "transform 0.2s" },
  performanceSubtitle: { color: "#aaa", fontSize: "12px", marginBottom: "15px", textAlign: "center" },
  performanceStats: { display: "flex", justifyContent: "space-around", marginBottom: "15px", flexWrap: "wrap", gap: "15px" },
  performanceStatItem: { textAlign: "center", flex: 1 },
  performanceStatValue: { display: "block", fontSize: "32px", fontWeight: "bold", color: "#FFD700" },
  performanceStatLabel: { fontSize: "12px", color: "#aaa" },
  performanceBarLarge: { width: "100%", height: "10px", background: "#333", borderRadius: "5px", overflow: "hidden", marginBottom: "12px" },
  performanceFillLarge: { height: "100%", background: "linear-gradient(90deg,#FFD700,#FFA500)", borderRadius: "5px", transition: "width 0.5s ease" },
  performanceNote: { textAlign: "center", color: "#FFD700", fontSize: "13px", fontWeight: "bold", marginBottom: "8px" },
  detailCard: { background: "#111", padding: "20px", borderRadius: "12px", marginBottom: "20px", border: "1px solid #222", transition: "all 0.2s" },
  freePick: { textAlign: "center" },
  matchTeamsLarge: { color: "#fff", fontWeight: "bold", fontSize: "16px", marginBottom: "10px" },
  predictionLarge: { color: "#FFD700", fontSize: "14px", marginBottom: "5px" },
  confidenceLarge: { color: "#aaa", fontSize: "12px", marginBottom: "10px" },
  analysisText: { color: "#ccc", fontSize: "12px", marginTop: "10px", padding: "8px", background: "#000", borderRadius: "6px" },
  hookText: { color: "#ffaa00", fontSize: "12px", textAlign: "center", marginTop: "10px", cursor: "pointer" },
  upcomingMatch: { padding: "10px", borderBottom: "1px solid #222", position: "relative" },
  matchTeams: { color: "#FFD700", fontWeight: "bold", fontSize: "14px", marginBottom: "4px" },
  upcomingMatchDate: { color: "#ccc", fontSize: "11px", marginTop: "4px" },
  premiumTag: { position: "absolute", right: "10px", top: "10px", fontSize: "10px", color: "#FFD700" },
  userHeader: { display: "flex", alignItems: "center", gap: "15px" },
  userInfo: { flex: 1 },
  avatar: { width: "50px", height: "50px", borderRadius: "50%", background: "linear-gradient(135deg,#FFD700,#FFA500)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "bold", color: "#1a1a1a" },
  countryContainer: { display: "flex", alignItems: "center", gap: "8px", marginTop: "5px" },
  countryFlag: { fontSize: "16px" },
  country: { color: "#00ffcc", fontSize: "12px" },
  planBadge: { textAlign: "center", marginBottom: "15px" },
  goldBadge: { display: "inline-block", background: "linear-gradient(135deg,#FFD700,#B8860B)", color: "#1a1a1a", padding: "8px 16px", borderRadius: "20px", fontWeight: "bold", fontSize: "14px" },
  premiumBadge: { display: "inline-block", background: "linear-gradient(135deg,#FFD700,#FFA500)", color: "#1a1a1a", padding: "8px 16px", borderRadius: "20px", fontWeight: "bold", fontSize: "14px" },
  vipBadge: { display: "inline-block", background: "linear-gradient(135deg,#FFD700,#8B0000)", color: "#1a1a1a", padding: "8px 16px", borderRadius: "20px", fontWeight: "bold", fontSize: "14px" },
  trialBadge: { display: "inline-block", background: "#00ffcc", color: "#1a1a1a", padding: "8px 16px", borderRadius: "20px", fontWeight: "bold", fontSize: "14px" },
  expiredBadge: { display: "inline-block", background: "#ff4d4d", color: "#fff", padding: "8px 16px", borderRadius: "20px", fontWeight: "bold", fontSize: "14px" },
  countdownSection: { marginTop: "15px" },
  countdownTitle: { color: "#FFD700", fontSize: "12px", textAlign: "center", marginBottom: "10px" },
  countdownContainer: { display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", marginBottom: "15px", flexWrap: "wrap" },
  countdownBox: { textAlign: "center", background: "#000", padding: "8px", borderRadius: "8px", minWidth: "50px" },
  countdownNumber: { fontSize: "24px", fontWeight: "bold", color: "#FFD700", display: "block" },
  countdownLabel: { fontSize: "10px", color: "#aaa" },
  countdownSeparator: { fontSize: "20px", color: "#FFD700" },
  progressBar: { width: "100%", height: "6px", background: "#333", borderRadius: "3px", overflow: "hidden", marginBottom: "8px" },
  progressFill: { height: "100%", background: "#FFD700", borderRadius: "3px", transition: "width 0.3s" },
  expiredInfo: { textAlign: "center", marginTop: "10px" },
  expiredText: { color: "#ff4d4d", fontSize: "14px", fontWeight: "bold", marginBottom: "10px" },
  upgradeButtonSmall: { background: "#FFD700", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "12px", color: "#1a1a1a" },
  upgradeBanner: { background: "linear-gradient(135deg,#ff4d4d,#cc0000)", padding: "12px 16px", borderRadius: "12px", marginBottom: "15px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" },
  upgradeBannerIcon: { fontSize: "20px" },
  upgradeBannerText: { color: "#fff", fontSize: "13px", fontWeight: "bold", flex: 1 },
  upgradeBannerBtn: { background: "#FFD700", border: "none", padding: "6px 16px", borderRadius: "20px", fontWeight: "bold", cursor: "pointer", fontSize: "12px", color: "#1a1a1a" },
  tickerContainer: { background: "#000", padding: "12px", borderRadius: "8px", marginBottom: "10px", overflow: "hidden" },
  tickerContent: { display: "flex", alignItems: "center", gap: "10px", animation: "slide 5s linear infinite" },
  successIcon: { fontSize: "20px" },
  successText: { color: "#FFD700", fontSize: "14px", fontWeight: "bold" },
  accuracySummary: { display: "flex", alignItems: "center", gap: "20px", marginBottom: "20px", padding: "15px", background: "#000", borderRadius: "12px" },
  accuracyCircle: { width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg,#FFD700,#FFA500)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" },
  accuracyPercentage: { fontSize: "24px", fontWeight: "bold", color: "#1a1a1a" },
  accuracyLabel: { fontSize: "10px", color: "#1a1a1a" },
  accuracyStats: { flex: 1 },
  accuracyStat: { color: "#fff", fontSize: "14px", marginBottom: "5px" },
  winCount: { color: "#00ffcc", fontWeight: "bold", fontSize: "18px" },
  totalCount: { color: "#FFD700", fontWeight: "bold", fontSize: "18px" },
  resultsList: { display: "flex", flexDirection: "column", gap: "12px", marginBottom: "15px" },
  resultItem: { background: "#000", padding: "12px", borderRadius: "8px", borderLeft: "3px solid #FFD700" },
  resultMatch: { display: "flex", justifyContent: "space-between", marginBottom: "8px", flexWrap: "wrap", gap: "5px", alignItems: "center" },
  resultTeams: { color: "#FFD700", fontWeight: "bold", fontSize: "14px" },
  resultDate: { color: "#666", fontSize: "11px" },
  resultDetails: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" },
  resultPrediction: { color: "#fff", fontSize: "12px" },
  resultActual: { color: "#aaa", fontSize: "11px" },
  resultWin: { color: "#00ffcc", fontWeight: "bold", fontSize: "12px", padding: "2px 8px", background: "rgba(0,255,204,0.1)", borderRadius: "12px" },
  resultLoss: { color: "#ff4d4d", fontWeight: "bold", fontSize: "12px", padding: "2px 8px", background: "rgba(255,77,77,0.1)", borderRadius: "12px" },
  resultConfidence: { color: "#FFD700", fontSize: "11px" },
  performanceGrid: { display: "flex", justifyContent: "space-around", marginBottom: "15px", flexWrap: "wrap", gap: "10px" },
  performanceItem: { textAlign: "center", flex: 1 },
  performanceValue: { fontSize: "24px", fontWeight: "bold", color: "#FFD700", display: "block" },
  performanceLabel: { fontSize: "11px", color: "#aaa" },
  accuracyBar: { width: "100%", height: "8px", background: "#333", borderRadius: "4px", overflow: "hidden" },
  accuracyFill: { height: "100%", background: "linear-gradient(90deg,#FFD700,#FFA500)", borderRadius: "4px" },
  quickActions: { marginBottom: "20px" },
  predictionsBtn: { width: "100%", padding: "16px", background: "linear-gradient(135deg,#FFD700,#FFA500)", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", fontSize: "16px", transition: "all 0.2s", color: "#1a1a1a" },
  filterHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", flexWrap: "wrap", gap: "10px" },
  filterDropdown: { display: "flex", alignItems: "center", gap: "10px" },
  filterLabel: { color: "#FFD700", fontSize: "13px", fontWeight: "bold" },
  filterSelect: { padding: "8px 12px", borderRadius: "8px", border: "1px solid #333", background: "#000", color: "#fff", cursor: "pointer", fontSize: "13px" },
  paginationContainer: { display: "flex", justifyContent: "center", alignItems: "center", gap: "15px", marginTop: "20px", marginBottom: "20px" },
  paginationBtn: { background: "#333", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", transition: "all 0.2s" },
  paginationInfo: { color: "#FFD700", fontSize: "13px" },
  itemsPerPageContainer: { display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "10px", marginTop: "10px", marginBottom: "20px" },
  itemsPerPageLabel: { color: "#aaa", fontSize: "12px" },
  itemsPerPageSelect: { padding: "6px 10px", borderRadius: "6px", border: "1px solid #333", background: "#000", color: "#fff", cursor: "pointer", fontSize: "12px" },
  matchHeader: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px", paddingBottom: "10px", borderBottom: "1px solid #222" },
  matchEmoji: { fontSize: "24px" },
  matchTitle: { color: "#FFD700", fontSize: "18px", fontWeight: "bold", flex: 1 },
  premiumLock: { color: "#ff4d4d", fontSize: "12px", fontWeight: "bold" },
  premiumBadgeSmall: { background: "#FFD700", color: "#1a1a1a", padding: "2px 8px", borderRadius: "12px", fontSize: "10px", fontWeight: "bold" },
  insightSection: { marginBottom: "15px" },
  sectionSubtitle: { color: "#FFD700", fontSize: "14px", marginBottom: "10px", fontWeight: "bold" },
  teamStrength: { background: "#000", padding: "10px", borderRadius: "8px", marginBottom: "8px" },
  teamWeakness: { background: "#000", padding: "10px", borderRadius: "8px", marginBottom: "8px" },
  teamName: { color: "#FFD700", fontSize: "13px", fontWeight: "bold", marginBottom: "5px" },
  strengthText: { color: "#00ffcc", fontSize: "12px", lineHeight: "1.4" },
  weaknessText: { color: "#ffaa66", fontSize: "12px", lineHeight: "1.4" },
  h2h: { background: "#000", padding: "10px", borderRadius: "8px" },
  h2hTitle: { color: "#FFD700", fontSize: "12px", fontWeight: "bold", marginBottom: "5px" },
  h2hText: { color: "#ccc", fontSize: "12px" },
  predictionSection: { marginBottom: "15px" },
  pickCard: { background: "#000", padding: "10px", borderRadius: "8px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  pickLabel: { color: "#aaa", fontSize: "12px" },
  pickValue: { color: "#FFD700", fontSize: "13px", fontWeight: "bold" },
  scoreSection: { background: "#000", padding: "12px", borderRadius: "8px", marginBottom: "15px", textAlign: "center" },
  scoreText: { color: "#FFD700", fontSize: "14px", fontWeight: "bold" },
  insightCard: { background: "#000", padding: "12px", borderRadius: "8px", marginBottom: "15px" },
  insightText: { color: "#ccc", fontSize: "12px", lineHeight: "1.5" },
  verdictCard: { background: "linear-gradient(135deg,#1a1a2e,#000)", padding: "15px", borderRadius: "8px", textAlign: "center", border: "1px solid #FFD700" },
  verdictText: { color: "#FFD700", fontSize: "16px", fontWeight: "bold", marginBottom: "10px" },
  confidenceBadge: { display: "inline-block", background: "#FFD700", color: "#1a1a1a", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" },
  benefitsGrid: { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "12px", marginBottom: "20px" },
  benefitItem: { display: "flex", alignItems: "center", gap: "8px", background: "#000", padding: "10px", borderRadius: "8px" },
  benefitIcon: { fontSize: "18px" },
  benefitText: { color: "#fff", fontSize: "12px", fontWeight: "500" },
  upgradeButton: { width: "100%", padding: "14px", background: "linear-gradient(135deg,#FFD700,#FFA500)", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer", transition: "all 0.2s", color: "#1a1a1a" },
  blurCardLarge: { position: "relative", background: "#111", padding: "20px", borderRadius: "12px", marginBottom: "20px", border: "1px solid #222", filter: "blur(4px)", opacity: 0.8, overflow: "hidden" },
  blurOverlayLarge: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "rgba(0,0,0,0.8)", color: "#FFD700", fontWeight: "bold", gap: "10px", filter: "none" },
  lockIconLarge: { fontSize: "32px" },
  unlockBtnLarge: { background: "#FFD700", border: "none", padding: "8px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "14px", marginTop: "5px", color: "#1a1a1a" },
  text: { color: "#fff", fontSize: "14px", margin: "5px 0" },
  username: { color: "#FFD700", fontSize: "12px", marginTop: "5px" },
  gold: { color: "#FFD700", marginBottom: "10px", fontSize: "18px" },
  button: { width: "100%", padding: "12px", background: "#FFD700", border: "none", borderRadius: "8px", cursor: "pointer", marginTop: "12px", fontWeight: "bold", fontSize: "14px", transition: "all 0.2s", color: "#1a1a1a" },
  logout: { width: "100%", padding: "12px", background: "linear-gradient(135deg,#ff4d4d,#cc0000)", border: "none", borderRadius: "8px", color: "#fff", cursor: "pointer", fontWeight: "bold", fontSize: "14px", marginTop: "10px", transition: "all 0.2s" },
  stickyUpgrade: { position: "fixed", bottom: "20px", left: "50%", transform: "translateX(-50%)", width: "90%", maxWidth: "400px", zIndex: 1000 },
  stickyButton: { width: "100%", padding: "14px", background: "linear-gradient(135deg,#FFD700,#FFA500)", border: "none", borderRadius: "12px", fontWeight: "bold", fontSize: "14px", cursor: "pointer", boxShadow: "0 4px 20px rgba(255,215,0,0.4)", animation: "pulse 2s infinite", color: "#1a1a1a" },
  skeletonHeader: { width: "200px", height: "32px", background: "linear-gradient(90deg,#222 25%,#333 50%,#222 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", borderRadius: "8px", margin: "0 auto 20px" },
  skeletonCard: { width: "100%", height: "150px", background: "linear-gradient(90deg,#111 25%,#222 50%,#111 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", borderRadius: "12px", marginBottom: "15px", padding: "20px" },
  skeletonTitle: { width: "60%", height: "20px", background: "linear-gradient(90deg,#222 25%,#333 50%,#222 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", borderRadius: "4px", marginBottom: "15px" },
  skeletonLine: { width: "100%", height: "12px", background: "linear-gradient(90deg,#222 25%,#333 50%,#222 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", borderRadius: "4px", marginBottom: "10px" },
};

// Inject animations
const addAnimations = () => {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes slide { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
    @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.02); } }
    @keyframes slideDown { from { opacity: 0; transform: translateX(-50%) translateY(-20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    button:hover:not(:disabled) { opacity: 0.9; transform: translateY(-2px); }
    .detailCard:hover, .card:hover { transform: translateY(-2px); border-color: #FFD700; }
    button:active { transform: translateY(0); }
    select:hover { border-color: #FFD700; }
  `;
  document.head.appendChild(style);
};
addAnimations();