// src/screens/PredictionsScreen.js
import React, { useEffect, useState, useMemo, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import usePredictions from "../../hooks/usePredictions";

// ==================== HELPER COMPONENT ====================
const PredictionCard = memo(({ pred, hotPickId, isFullAccess, isTrial, isExpiredPlan, onToggleDetails, selectedId, navigate, getRiskLevel, getConfidenceBadge, getStatusBadge, formatMarketFields }) => {
  const now = new Date();
  const matchDateTime = new Date(`${pred.match_date}T${pred.match_time || '00:00'}`);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const isPastMatch = matchDateTime < twoHoursAgo;
  const isVip = pred.is_vip === true || pred.is_premium === true;
  const isVipLocked = isVip && !isFullAccess && !isPastMatch;
  const shouldLock = (pred) => {
    if (isExpiredPlan) return true;
    if (isFullAccess) return false;
    if (isTrial) {
      const risk = getRiskLevel(pred.confidence).level;
      return risk === "Low";
    }
    return true;
  };
  const isLocked = isVipLocked || shouldLock(pred);
  const statusBadge = getStatusBadge(pred);
  const risk = getRiskLevel(pred.confidence);
  const confidenceBadge = getConfidenceBadge(pred.confidence);
  const isHotPick = hotPickId === pred.id;
  const isExpanded = selectedId === pred.id;
  const { overUnder, btts, firstToScore, doubleChance } = formatMarketFields(pred);

  return (
    <div
      style={{
        ...styles.predictionCard,
        border: isHotPick ? "2px solid #FFD700" : "1px solid #222",
      }}
      onClick={() => { if (!isLocked) onToggleDetails(pred.id); }}
    >
      {isHotPick && <div style={styles.hotBadge}><span>🔥 HOT PICK 🔥</span></div>}
      <div style={styles.cardHeader}>
        <span style={styles.leagueBadge}>{pred.league || "Football"}</span>
        <span style={statusBadge.style}>{statusBadge.text}</span>
      </div>
      <div style={styles.teams}>
        <span style={styles.homeTeam}>{pred.home_team}</span>
        <span style={styles.vs}>vs</span>
        <span style={styles.awayTeam}>{pred.away_team}</span>
      </div>
      <p style={styles.date}>
        📅 {pred.match_date ? new Date(pred.match_date).toLocaleDateString() : "TBD"} • {pred.match_time || "TBD"}
        {statusBadge.actualResult && <span style={styles.actualResultTag}> • Result: {statusBadge.actualResult}</span>}
        {isPastMatch && isVip && !isFullAccess && <span style={styles.unlockedPastTag}> 🔓 Unlocked (Past Match)</span>}
      </p>
      <div style={styles.badgeContainer}>
        <span style={{ ...styles.riskBadge, backgroundColor: risk.color + "20", color: risk.color, border: `1px solid ${risk.color}` }}>
          {risk.icon} {risk.text}
        </span>
        <span style={{ ...styles.confidenceBadge, backgroundColor: confidenceBadge.color + "20", color: confidenceBadge.color }}>
          {confidenceBadge.icon} {confidenceBadge.text}
        </span>
        {isVip && <span style={isFullAccess || isPastMatch ? styles.premiumTagSmall : styles.lockedTagSmall}>
          {isFullAccess || isPastMatch ? "⭐ VIP" : "🔒 VIP"}
        </span>}
      </div>

      {isLocked ? (
        <div style={styles.lockedContainer}>
          <div style={styles.lockIcon}>🔒</div>
          <p style={styles.lockedText}>{shouldLock(pred) ? "Low‑Risk Prediction (Trial users)" : "VIP Prediction"}</p>
          <p style={styles.lockedSubtext}>Upgrade to unlock full analysis</p>
          <button style={styles.unlockBtn} onClick={(e) => { e.stopPropagation(); navigate("/upgrade"); }}>Upgrade Now</button>
        </div>
      ) : (
        <div style={styles.predictionDetails}>
          <div style={styles.predictionRow}>
            <span style={styles.predictionLabel}>Prediction:</span>
            <span style={styles.predictionValue}>{pred.prediction}</span>
          </div>
          <div style={styles.predictionRow}>
            <span style={styles.predictionLabel}>Confidence:</span>
            <div style={styles.confidenceWrapper}>
              <div style={styles.confidenceBar}>
                <div style={{ ...styles.confidenceFill, width: `${pred.confidence || 70}%` }} />
              </div>
              <span style={styles.confidenceValue}>{pred.confidence || 70}%</span>
            </div>
          </div>

          {/* Always visible strong markets */}
          <div style={styles.marketRow}>
            <span>⚽ Over/Under 2.5: <strong>{overUnder}</strong></span>
          </div>
          <div style={styles.marketRow}>
            <span>🤝 BTTS: <strong>{btts === "Yes" ? "✅ Yes" : "❌ No"}</strong></span>
          </div>
          {pred.safe_pick && (
            <div style={styles.marketRow}>
              <span>🛡️ Safe pick: <strong>{pred.safe_pick}</strong></span>
            </div>
          )}

          <button style={styles.expandBtn} onClick={(e) => { e.stopPropagation(); onToggleDetails(pred.id); }}>
            {isExpanded ? "Show Less ▲" : "Show Full Story ▼"}
          </button>

          {isExpanded && (
            <div style={styles.analysisBox} onClick={(e) => e.stopPropagation()}>
              {/* Full analysis – always visible */}
              <div style={styles.storySection}>
                <h3 style={styles.storyTitle}>📊 Match Insight</h3>
                <p><strong>🏆 {pred.home_team}</strong></p>
                {Array.isArray(pred.home_insight) && pred.home_insight.length ? pred.home_insight.map((item, i) => <p key={i} style={styles.whiteText}>• {item}</p>) : <p style={styles.whiteText}>• Strong home team with solid defensive record</p>}
                <p><strong>📉 {pred.away_team}</strong></p>
                {Array.isArray(pred.away_insight) && pred.away_insight.length ? pred.away_insight.map((item, i) => <p key={i} style={styles.whiteText}>• {item}</p>) : <p style={styles.whiteText}>• Struggles away from home</p>}
                <p><strong>📊 Head-to-head</strong></p>
                {Array.isArray(pred.h2h_insight) && pred.h2h_insight.length ? pred.h2h_insight.map((item, i) => <p key={i} style={styles.whiteText}>• {item}</p>) : <p style={styles.whiteText}>• Recent meetings favor the home side</p>}
              </div>
              <div style={styles.storySection}>
                <h3 style={styles.storyTitle}>🔮 My Prediction</h3>
                <p style={styles.whiteText}>✅ <strong>{pred.prediction}</strong></p>
                {pred.safe_pick && <p style={styles.whiteText}>👉 Safer: {pred.safe_pick}</p>}
                {pred.goals_market && <p style={styles.whiteText}>👉 Goals: {pred.goals_market}</p>}
              </div>
              <div style={styles.storySection}>
                <h3 style={styles.storyTitle}>🎯 Correct Score Prediction</h3>
                <p style={styles.whiteText}><strong>{pred.score_prediction || "2-0 or 2-1"}</strong></p>
              </div>
              <div style={styles.aiSection}>
                <h3 style={styles.storyTitle}>🤖 AI Reasoning</h3>
                <p style={styles.whiteText}>{pred.ai_reasoning || `Based on statistical analysis, ${pred.home_team} shows strong form with ${pred.confidence}% confidence.`}</p>
              </div>
              <div style={styles.storySection}>
                <h3 style={styles.storyTitle}>💡 Betting Insight</h3>
                <p style={styles.whiteText}>{pred.insight_text || `Consider ${pred.home_team}'s recent form and head-to-head record before placing your bet.`}</p>
              </div>

              {/* VIP-only markets */}
              {isFullAccess ? (
                <div style={styles.vipMarkets}>
                  <div style={styles.marketRow}>🎯 Correct Score: <strong>{pred.score_prediction}</strong></div>
                  <div style={styles.marketRow}>🥇 First to Score: <strong>{firstToScore === "Home" ? "🏠 Home" : firstToScore === "Away" ? "✈️ Away" : "❌ None"}</strong></div>
                  <div style={styles.marketRow}>🔄 Double Chance: <strong>{doubleChance}</strong></div>
                  <div style={styles.marketRow}>📊 BTTS Probability: <strong>{pred.btts_probability || 0}%</strong></div>
                </div>
              ) : (
                <button style={styles.unlockVipBtn} onClick={() => navigate("/upgrade")}>
                  🔓 Upgrade to VIP to see all markets
                </button>
              )}

              <div style={styles.verdictBox}>
                <h3 style={styles.storyTitle}>🔥 Final Verdict</h3>
                <p style={styles.whiteText}><strong>{pred.verdict || pred.prediction}</strong></p>
                {pred.goals_market && <p style={styles.whiteText}>🎯 Also consider: {pred.goals_market}</p>}
              </div>
              <button style={styles.shareBtn} onClick={(e) => {
                e.stopPropagation();
                const shareText = `🔥 ${pred.home_team} vs ${pred.away_team}\n\nPrediction: ${pred.prediction}\nConfidence: ${pred.confidence}%\nRisk: ${risk.text}\nVerdict: ${pred.verdict || pred.prediction}`;
                navigator.clipboard.writeText(shareText);
                alert("Copied to clipboard!");
              }}>📤 Share Prediction</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// ==================== MAIN COMPONENT ====================
export default function PredictionsScreen() {
  const navigate = useNavigate();

  // 🔥 USE THE HOOK – fast loading, offline support, cached data
  const { data: allPredictions, loading: predictionsLoading, offline, lastUpdated: predictionsLastUpdated } = usePredictions();

  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState("Expired");
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Data states (derived from hook)
  const [hotPick, setHotPick] = useState(null);
  const [availableLeagues, setAvailableLeagues] = useState([]);
  const [leagueStats, setLeagueStats] = useState([]);

  // Filter states
  const [filter, setFilter] = useState("all");
  const [league, setLeague] = useState("all");
  const [dayFilter, setDayFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [showFilters, setShowFilters] = useState(false);
  const [showPastMatches, setShowPastMatches] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Reset filters on mount
  useEffect(() => {
    setFilter("all");
    setLeague("all");
    setDayFilter("all");
    setSearch("");
    setSortBy("date");
    setShowPastMatches(false);
  }, []);

  // ==================== UTILITIES ====================
  const getRiskLevel = useCallback((confidence) => {
    if (confidence >= 85) return { level: "Low", color: "#00ffcc", icon: "🟢", text: "Low Risk" };
    if (confidence >= 70) return { level: "Medium", color: "#ffaa00", icon: "🟡", text: "Medium Risk" };
    return { level: "High", color: "#ff4d4d", icon: "🔴", text: "High Risk" };
  }, []);

  const getConfidenceBadge = useCallback((confidence) => {
    if (confidence >= 85) return { text: "🔥 Strong Pick", color: "#00ffcc", icon: "🔥" };
    if (confidence >= 70) return { text: "⚠️ Good Pick", color: "#ffaa00", icon: "⚠️" };
    return { text: "❌ Risky", color: "#ff4d4d", icon: "❌" };
  }, []);

  const getStatusBadge = useCallback((prediction) => {
    const today = new Date().toISOString().split('T')[0];
    const matchDate = prediction.match_date;
    const isPastMatch = matchDate < today;
    const result = prediction.result || prediction.status;
    if (result === 'won' || result === 'win' || result === 'WIN') {
      return { style: styles.winBadge, text: '✅ WON', actualResult: prediction.actual_result };
    }
    if (result === 'lost' || result === 'loss' || result === 'LOSS' || result === 'LOSE') {
      return { style: styles.lossBadge, text: '❌ LOST', actualResult: prediction.actual_result };
    }
    if (isPastMatch) {
      return { style: styles.voidBadge, text: '📊 RESULT PENDING', actualResult: null };
    }
    return { style: styles.pendingBadge, text: '⏳ UPCOMING', actualResult: null };
  }, []);

  const filterByDay = useCallback((matchDate, dayFilterType) => {
    const today = new Date(); today.setHours(0,0,0,0);
    const matchDateObj = new Date(matchDate); matchDateObj.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 7);
    switch(dayFilterType) {
      case "today": return matchDateObj.getTime() === today.getTime();
      case "tomorrow": return matchDateObj.getTime() === tomorrow.getTime();
      case "week": return matchDateObj >= today && matchDateObj <= nextWeek;
      default: return true;
    }
  }, []);

  const formatMarketFields = useCallback((pred) => {
    let overUnder = "Under 2.5";
    if (pred.over_under) overUnder = pred.over_under;
    else if (pred.over_2_5 === true) overUnder = "Over 2.5";
    else if (pred.over_2_5 === false) overUnder = "Under 2.5";

    let btts = "No";
    if (pred.btts === "Yes") btts = "Yes";
    else if (pred.btts === "No") btts = "No";
    else if (pred.btts_yes === true) btts = "Yes";
    else if (pred.btts_yes === false) btts = "No";

    let firstToScore = "None";
    const fts = pred.first_team_to_score;
    if (fts === "home" || fts === "Home") firstToScore = "Home";
    else if (fts === "away" || fts === "Away") firstToScore = "Away";

    let doubleChance = "Home/Draw";
    const dc = pred.double_chance;
    if (dc === "away_draw") doubleChance = "Away/Draw";
    else if (dc === "home_away") doubleChance = "Home/Away";
    else if (dc === "home_draw") doubleChance = "Home/Draw";

    return { overUnder, btts, firstToScore, doubleChance };
  }, []);

  // ==================== FETCH USER PLAN & HOT PICK ====================
  const fetchUserPlan = useCallback(async (userId) => {
    try {
      const { data: userRecord, error: userError } = await supabase
        .from("users")
        .select("plan, subscription_end")
        .eq("id", userId)
        .maybeSingle();
      if (userError) console.error("Users table fetch error:", userError);
      if (userRecord && userRecord.plan) {
        const isPaidPlan = ["Gold Plan", "Premium Plan", "VIP Plan"].includes(userRecord.plan);
        if (isPaidPlan && userRecord.subscription_end && new Date(userRecord.subscription_end) < new Date()) {
          return "Expired";
        }
        return userRecord.plan;
      }
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", userId)
        .maybeSingle();
      if (profileError) console.error("Profile fetch error:", profileError);
      if (!profile) {
        const { data: { user } } = await supabase.auth.getUser();
        return user?.user_metadata?.plan || "Expired";
      }
      return profile.plan || "Expired";
    } catch (err) {
      console.error("Error fetching plan:", err);
      return "Expired";
    }
  }, []);

  const fetchHotPick = useCallback(async () => {
    try {
      if (offline) return;
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) return;
      const response = await fetch("/api/predictions/hot-pick", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setHotPick(data.data);
    } catch (err) {
      console.error("Error fetching hot pick:", err);
    }
  }, [offline]);

  const refreshUserPlan = useCallback(async () => {
    if (user) {
      const newPlan = await fetchUserPlan(user.id);
      setPlan(newPlan);
      console.log("🔄 User plan refreshed:", newPlan);
    }
  }, [user, fetchUserPlan]);

  // ==================== USER & AUTH ====================
  const fetchUser = useCallback(async () => {
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      if (error || !authUser) {
        navigate("/");
        return;
      }
      setUser(authUser);
      const userPlan = await fetchUserPlan(authUser.id);
      setPlan(userPlan);
      console.log("✅ User Plan:", userPlan);
      setLoadingAuth(false);
    } catch (err) {
      console.error("Error fetching user:", err);
      navigate("/");
    }
  }, [navigate, fetchUserPlan]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        console.log("🔄 Auth event detected, refreshing user plan...");
        if (session?.user) {
          const newPlan = await fetchUserPlan(session.user.id);
          setPlan(newPlan);
          setUser(session.user);
        }
      }
    });
    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, [fetchUserPlan]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        refreshUserPlan();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [user, refreshUserPlan]);

  useEffect(() => {
    if (user && plan !== "Expired") {
      fetchHotPick();
    }
  }, [user, plan, fetchHotPick]);

  // ==================== FILTERING & PAGINATION ====================
  const filteredPredictions = useMemo(() => {
    let data = [...(allPredictions || [])];
    const now = new Date();
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    if (!showPastMatches) {
      data = data.filter(pred => {
        const matchDate = new Date(pred.match_date);
        const [hours, minutes] = (pred.match_time || "23:59").split(':');
        const matchDateTime = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate(), parseInt(hours), parseInt(minutes));
        return matchDateTime > fourHoursAgo;
      });
    }
    if (dayFilter !== "all") {
      data = data.filter(pred => filterByDay(pred.match_date, dayFilter));
    }
    if (filter === "free") {
      data = data.filter(p => !p.is_vip && !p.is_premium);
    }
    if (filter === "premium") {
      data = data.filter(p => p.is_vip || p.is_premium);
    }
    if (league !== "all") {
      data = data.filter(p => p.league === league);
    }
    if (search) {
      data = data.filter(p => `${p.home_team} ${p.away_team} ${p.league || ''}`.toLowerCase().includes(search.toLowerCase()));
    }
    if (sortBy === "confidence") {
      data.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    } else if (sortBy === "date") {
      data.sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
    } else if (sortBy === "league") {
      data.sort((a, b) => (a.league || "").localeCompare(b.league || ""));
    }
    // Deduplication
    const finalUnique = [];
    const seen = new Set();
    for (const item of data) {
      const key = `${item.home_team}-${item.away_team}-${item.match_date}-${item.match_time}`;
      if (!seen.has(key)) {
        seen.add(key);
        finalUnique.push(item);
      }
    }
    return finalUnique;
  }, [allPredictions, filter, league, search, sortBy, dayFilter, showPastMatches, filterByDay]);

  useEffect(() => {
    const leagueCounts = {};
    filteredPredictions.forEach(pred => {
      const leagueName = pred.league || "Other";
      leagueCounts[leagueName] = (leagueCounts[leagueName] || 0) + 1;
    });
    setLeagueStats(Object.entries(leagueCounts).map(([name, count]) => ({ name, count })));
    const uniqueLeagues = [...new Set(filteredPredictions.map(p => p.league).filter(Boolean))];
    setAvailableLeagues(uniqueLeagues);
  }, [filteredPredictions]);

  const totalCount = filteredPredictions.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const paginatedPredictions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredPredictions.slice(start, end);
  }, [filteredPredictions, currentPage, itemsPerPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount);

  useEffect(() => { setCurrentPage(1); }, [filter, league, search, sortBy, dayFilter, showPastMatches]);
  useEffect(() => {
    if (league !== "all" && !availableLeagues.includes(league)) {
      setLeague("all");
    }
  }, [availableLeagues, league]);

  // ==================== HANDLERS ====================
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setCurrentPage(1);
    // Force refetch – the hook may have its own refresh method; we just rely on its cache invalidation.
    // For simplicity, we reload the page or refetch user plan and hot pick.
    refreshUserPlan();
    fetchHotPick();
    setTimeout(() => setRefreshing(false), 1000);
  }, [refreshUserPlan, fetchHotPick]);

  const togglePredictionDetails = useCallback((predId) => {
    setSelectedPrediction(prev => (prev === predId ? null : predId));
  }, []);

  const toggleShowPastMatches = useCallback(() => {
    setShowPastMatches(prev => !prev);
    setCurrentPage(1);
  }, []);

  const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  }, []);

  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  }, [totalPages]);

  const getPageNumbers = useCallback(() => {
    const pageNumbers = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pageNumbers.push(i);
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pageNumbers.push(i);
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pageNumbers.push(i);
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    return pageNumbers;
  }, [currentPage, totalPages]);

  // Access rules
  const normalizedPlan = (plan || "").toLowerCase();
  const isFullAccess = ["premium", "vip", "gold", "premium plan", "vip plan", "gold plan"].includes(normalizedPlan);
  const isTrial = normalizedPlan === "trial";
  const isExpiredPlan = normalizedPlan === "expired";

  const isLoading = loadingAuth || predictionsLoading;
  const displayLastUpdated = predictionsLastUpdated || lastUpdated;

  if (isLoading && (!allPredictions || allPredictions.length === 0)) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Loading predictions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isExpiredPlan) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.expiredContainer}>
            <div style={styles.expiredIcon}>⏰</div>
            <h2 style={styles.expiredTitle}>Your Subscription Has Expired</h2>
            <p style={styles.expiredText}>Upgrade to continue accessing accurate predictions and analysis.</p>
            <button style={styles.upgradeNowBtn} onClick={() => navigate("/upgrade")}>Upgrade Now</button>
            <button style={styles.goBackBtn} onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>← Back to Dashboard</button>
          <div style={styles.headerRow}>
            <h1 style={styles.title}>🔮 Match Predictions</h1>
            <div style={styles.headerButtons}>
              <button style={styles.pastMatchesBtn} onClick={toggleShowPastMatches}>
                {showPastMatches ? "📅 Hide Past" : "📅 Show Past"}
              </button>
              <button style={styles.refreshBtn} onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? "⏳" : "🔄"}
              </button>
            </div>
          </div>
          <p style={styles.subtitle}>AI-powered analysis from HySmartPrediction API</p>
          {displayLastUpdated && <p style={styles.lastUpdated}>📅 Predictions updated: {displayLastUpdated}</p>}
          {offline && <div style={styles.offlineBanner}>⚠️ You are offline – showing cached predictions</div>}
          {error && (
            <div style={styles.errorBanner}>
              <span>⚠️</span>
              <p>{error}</p>
              <button onClick={handleRefresh}>Retry</button>
            </div>
          )}
        </div>

        {/* Day filter */}
        <div style={styles.dayFilterContainer}>
          <button style={{...styles.dayFilterBtn, ...(dayFilter === "all" ? styles.activeDayFilter : {})}} onClick={() => { setDayFilter("all"); setCurrentPage(1); }}>📅 All Matches</button>
          <button style={{...styles.dayFilterBtn, ...(dayFilter === "today" ? styles.activeDayFilter : {})}} onClick={() => { setDayFilter("today"); setCurrentPage(1); }}>📆 Today</button>
          <button style={{...styles.dayFilterBtn, ...(dayFilter === "tomorrow" ? styles.activeDayFilter : {})}} onClick={() => { setDayFilter("tomorrow"); setCurrentPage(1); }}>📅 Tomorrow</button>
          <button style={{...styles.dayFilterBtn, ...(dayFilter === "week" ? styles.activeDayFilter : {})}} onClick={() => { setDayFilter("week"); setCurrentPage(1); }}>📊 This Week</button>
        </div>

        {/* League stats */}
        {leagueStats.length > 0 && !error && (
          <div style={styles.leagueStatsContainer}>
            <h3 style={styles.leagueStatsTitle}>📊 League Coverage</h3>
            <div style={styles.leagueStatsGrid}>
              {leagueStats.map((stat, idx) => (
                <div key={idx} style={styles.leagueStatCard} onClick={() => { setLeague(stat.name); setCurrentPage(1); }}>
                  <span style={styles.leagueStatName}>{stat.name}</span>
                  <span style={styles.leagueStatCount}>{stat.count} matches</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hot pick */}
        {hotPick && !error && (
          <div style={styles.hotPickCard}>
            <div style={styles.hotPickHeader}>
              <span style={styles.hotPickIcon}>🔥</span>
              <span style={styles.hotPickTitle}>HOT PICK OF THE DAY</span>
              <span style={styles.hotPickIcon}>🔥</span>
            </div>
            <div style={styles.hotPickContent}>
              <div style={styles.hotPickTeams}>
                <span style={styles.hotPickHome}>{hotPick.home_team}</span>
                <span style={styles.hotPickVs}>vs</span>
                <span style={styles.hotPickAway}>{hotPick.away_team}</span>
              </div>
              <div style={styles.hotPickPrediction}>
                <span style={styles.hotPickLabel}>Prediction:</span>
                <span style={styles.hotPickValue}>{hotPick.prediction}</span>
              </div>
              <div style={styles.hotPickConfidence}>
                <span style={styles.hotPickLabel}>Confidence:</span>
                <span style={styles.hotPickConfidenceValue}>{hotPick.confidence}%</span>
              </div>
              <div style={styles.hotPickRisk}>
                <span style={styles.hotPickLabel}>Risk Level:</span>
                <span style={{...styles.hotPickRiskValue, color: getRiskLevel(hotPick.confidence).color}}>
                  {getRiskLevel(hotPick.confidence).icon} {getRiskLevel(hotPick.confidence).text}
                </span>
              </div>
              <p style={styles.hotPickInsight}>{hotPick.insight_text || "Expert analysis suggests this is a high-value opportunity."}</p>
            </div>
          </div>
        )}

        {/* Stats summary */}
        {!error && totalCount > 0 && (
          <div style={styles.statsSummary}>
            <div style={styles.statCard}><span style={styles.statValue}>{totalCount}</span><span style={styles.statLabel}>Total Matches</span></div>
            <div style={styles.statCard}><span style={styles.statValue}>{paginatedPredictions.length}</span><span style={styles.statLabel}>Showing</span></div>
            <div style={styles.statCard}><span style={styles.statValue}>{paginatedPredictions.filter(p => !p.is_vip && !p.is_premium).length}</span><span style={styles.statLabel}>Free</span></div>
            <div style={styles.statCard}><span style={styles.statValue}>{paginatedPredictions.length > 0 ? Math.round(paginatedPredictions.reduce((sum, p) => sum + (p.confidence || 0), 0) / paginatedPredictions.length) : 0}%</span><span style={styles.statLabel}>Avg Conf</span></div>
          </div>
        )}

        {/* Search */}
        <div style={styles.searchContainer}>
          <input type="text" style={styles.searchInput} placeholder="🔍 Search by team name or league..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {/* Filters */}
        <button style={styles.mobileFilterBtn} onClick={() => setShowFilters(!showFilters)}>{showFilters ? "▲ Hide Filters" : "▼ Show Filters"}</button>
        <div style={{...styles.filtersSection, display: showFilters ? 'block' : 'none'}}>
          <div style={styles.filterTabs}>
            <button style={{...styles.filterTab, ...(filter === "all" ? styles.activeFilter : {})}} onClick={() => { setFilter("all"); setCurrentPage(1); }}>All</button>
            <button style={{...styles.filterTab, ...(filter === "free" ? styles.activeFilter : {})}} onClick={() => { setFilter("free"); setCurrentPage(1); }}>Free</button>
            <button style={{...styles.filterTab, ...(filter === "premium" ? styles.activeFilter : {})}} onClick={() => { setFilter("premium"); setCurrentPage(1); }}>VIP {!isFullAccess && "🔒"}</button>
          </div>
          <div style={styles.filterRow}>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>League</label>
              <select style={styles.filterSelect} value={league} onChange={(e) => { setLeague(e.target.value); setCurrentPage(1); }}>
                <option value="all">All Leagues</option>
                {availableLeagues.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Sort by</label>
              <select style={styles.filterSelect} value={sortBy} onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}>
                <option value="date">Date</option>
                <option value="confidence">Confidence</option>
                <option value="league">League</option>
              </select>
            </div>
          </div>
        </div>

        {/* Items per page */}
        {totalCount > 0 && (
          <div style={styles.itemsPerPageContainer}>
            <label style={styles.itemsPerPageLabel}>Show per page:</label>
            <select value={itemsPerPage} onChange={(e) => handleItemsPerPageChange(Number(e.target.value))} style={styles.itemsPerPageSelect}>
              <option value={10}>10</option><option value={20}>20</option><option value={30}>30</option><option value={50}>50</option><option value={100}>100</option>
            </select>
            <span style={styles.itemsPerPageInfo}>Showing {startIndex + 1}-{endIndex} of {totalCount} matches</span>
          </div>
        )}

        {/* Predictions grid */}
        <div style={styles.predictionsContainer}>
          {paginatedPredictions.length === 0 && !error ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🔮</div>
              <h3 style={styles.emptyTitle}>No Predictions Available</h3>
              <p style={styles.emptyText}>Try changing your filters or search terms.</p>
              <button style={styles.refreshBtnEmpty} onClick={handleRefresh}>🔄 Refresh</button>
            </div>
          ) : (
            paginatedPredictions.map(pred => (
              <PredictionCard
                key={`${pred.home_team}-${pred.away_team}-${pred.match_date}-${pred.match_time}-${pred.id}`}
                pred={pred}
                hotPickId={hotPick?.id}
                isFullAccess={isFullAccess}
                isTrial={isTrial}
                isExpiredPlan={isExpiredPlan}
                onToggleDetails={togglePredictionDetails}
                selectedId={selectedPrediction}
                navigate={navigate}
                getRiskLevel={getRiskLevel}
                getConfidenceBadge={getConfidenceBadge}
                getStatusBadge={getStatusBadge}
                formatMarketFields={formatMarketFields}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={styles.paginationWrapper}>
            <div style={styles.paginationContainer}>
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} style={{...styles.paginationBtn, ...(currentPage === 1 ? styles.paginationBtnDisabled : {})}}>← Previous</button>
              <div style={styles.paginationNumbers}>
                {getPageNumbers().map((pageNum, idx) => pageNum === '...' ? <span key={`ellipsis-${idx}`} style={styles.paginationEllipsis}>...</span> : (
                  <button key={pageNum} onClick={() => goToPage(pageNum)} style={{...styles.pageNumberBtn, ...(currentPage === pageNum ? styles.activePageNumber : {})}}>{pageNum}</button>
                ))}
              </div>
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} style={{...styles.paginationBtn, ...(currentPage === totalPages ? styles.paginationBtnDisabled : {})}}>Next →</button>
            </div>
            <div style={styles.pageInfo}>Page {currentPage} of {totalPages} ({totalCount} total matches)</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== STYLES (unchanged, kept as in your original) ====================
const styles = {
  page: { minHeight: "100vh", background: "#000", display: "flex", justifyContent: "center", paddingTop: "40px", paddingBottom: "100px" },
  container: { width: "90%", maxWidth: "1000px", margin: "0 auto" },
  header: { marginBottom: "30px" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px", marginBottom: "10px" },
  headerButtons: { display: "flex", gap: "10px", alignItems: "center" },
  backBtn: { background: "#333", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", marginBottom: "20px" },
  title: { color: "#FFD700", fontSize: "28px", fontWeight: "bold", margin: 0 },
  subtitle: { color: "#aaa", fontSize: "14px" },
  lastUpdated: { color: "#666", fontSize: "11px", marginTop: "5px" },
  offlineBanner: { background: "rgba(255, 170, 0, 0.2)", border: "1px solid #ffaa00", borderRadius: "8px", padding: "10px", textAlign: "center", color: "#ffaa00", fontSize: "13px", marginTop: "10px" },
  errorBanner: { display: "flex", alignItems: "center", gap: "10px", background: "rgba(255, 77, 77, 0.1)", border: "1px solid #ff4d4d", borderRadius: "8px", padding: "12px", marginTop: "15px" },
  refreshBtn: { background: "#333", color: "#FFD700", border: "1px solid #FFD700", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "bold", transition: "all 0.2s" },
  pastMatchesBtn: { background: "#333", color: "#FFD700", border: "1px solid #FFD700", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "bold", transition: "all 0.2s" },
  refreshBtnEmpty: { background: "#FFD700", color: "#000", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "bold", marginTop: "20px" },
  actualResultTag: { color: "#00ffcc", fontSize: "11px", marginLeft: "8px" },
  unlockedPastTag: { color: "#00ffcc", fontSize: "10px", fontStyle: "italic" },
  voidBadge: { background: "#ffaa00", color: "#000", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" },
  expiredContainer: { textAlign: "center", padding: "60px 20px", background: "#111", borderRadius: "12px", marginTop: "40px" },
  expiredIcon: { fontSize: "64px", marginBottom: "20px" },
  expiredTitle: { color: "#FFD700", fontSize: "28px", marginBottom: "10px" },
  expiredText: { color: "#aaa", fontSize: "16px", marginBottom: "30px" },
  upgradeNowBtn: { background: "#FFD700", color: "#000", border: "none", padding: "12px 30px", borderRadius: "8px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", marginRight: "10px" },
  goBackBtn: { background: "#333", color: "#fff", border: "none", padding: "12px 30px", borderRadius: "8px", fontSize: "16px", cursor: "pointer" },
  dayFilterContainer: { display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", justifyContent: "center" },
  dayFilterBtn: { background: "#222", color: "#aaa", border: "1px solid #444", padding: "8px 20px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "bold", transition: "all 0.2s" },
  activeDayFilter: { background: "#FFD700", color: "#000", borderColor: "#FFD700" },
  leagueStatsContainer: { background: "#111", padding: "15px", borderRadius: "12px", marginBottom: "20px", border: "1px solid #222" },
  leagueStatsTitle: { color: "#FFD700", fontSize: "14px", marginBottom: "12px", fontWeight: "bold" },
  leagueStatsGrid: { display: "flex", flexWrap: "wrap", gap: "10px" },
  leagueStatCard: { background: "#000", padding: "6px 12px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "8px", border: "1px solid #333", cursor: "pointer", transition: "all 0.2s" },
  leagueStatName: { color: "#fff", fontSize: "12px" },
  leagueStatCount: { color: "#FFD700", fontSize: "11px", fontWeight: "bold" },
  hotPickCard: { background: "linear-gradient(135deg, #1a1a2e, #000)", padding: "20px", borderRadius: "12px", marginBottom: "20px", border: "2px solid #FFD700", boxShadow: "0 0 20px rgba(255, 215, 0, 0.3)" },
  hotPickHeader: { display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", marginBottom: "15px" },
  hotPickIcon: { fontSize: "24px" },
  hotPickTitle: { color: "#FFD700", fontSize: "18px", fontWeight: "bold", letterSpacing: "2px" },
  hotPickContent: { textAlign: "center" },
  hotPickTeams: { display: "flex", justifyContent: "center", alignItems: "center", gap: "15px", marginBottom: "15px" },
  hotPickHome: { color: "#FFD700", fontSize: "20px", fontWeight: "bold" },
  hotPickVs: { color: "#666", fontSize: "14px" },
  hotPickAway: { color: "#FFD700", fontSize: "20px", fontWeight: "bold" },
  hotPickPrediction: { marginBottom: "8px" },
  hotPickLabel: { color: "#aaa", fontSize: "13px" },
  hotPickValue: { color: "#FFD700", fontSize: "16px", fontWeight: "bold", marginLeft: "8px" },
  hotPickConfidence: { marginBottom: "8px" },
  hotPickConfidenceValue: { color: "#00ffcc", fontSize: "18px", fontWeight: "bold", marginLeft: "8px" },
  hotPickRisk: { marginBottom: "12px" },
  hotPickRiskValue: { fontSize: "14px", fontWeight: "bold", marginLeft: "8px" },
  hotPickInsight: { color: "#ccc", fontSize: "13px", lineHeight: "1.5", marginTop: "10px" },
  statsSummary: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" },
  statCard: { background: "#111", padding: "15px", borderRadius: "12px", textAlign: "center", border: "1px solid #222" },
  statValue: { display: "block", fontSize: "24px", fontWeight: "bold", color: "#FFD700" },
  statLabel: { fontSize: "11px", color: "#aaa" },
  searchContainer: { marginBottom: "20px" },
  searchInput: { width: "100%", padding: "12px 16px", borderRadius: "8px", border: "1px solid #333", background: "#111", color: "#fff", fontSize: "14px", outline: "none" },
  mobileFilterBtn: { display: "none", width: "100%", padding: "10px", background: "#222", border: "1px solid #333", borderRadius: "8px", color: "#FFD700", cursor: "pointer", fontSize: "14px", marginBottom: "15px" },
  filtersSection: { marginBottom: "20px" },
  filterTabs: { display: "flex", gap: "10px", marginBottom: "15px" },
  filterTab: { flex: 1, padding: "10px", background: "#111", border: "1px solid #333", borderRadius: "8px", color: "#fff", cursor: "pointer", fontSize: "14px", textAlign: "center" },
  activeFilter: { background: "#FFD700", color: "#000", borderColor: "#FFD700" },
  filterRow: { display: "flex", gap: "15px" },
  filterGroup: { flex: 1, display: "flex", flexDirection: "column", gap: "8px" },
  filterLabel: { color: "#FFD700", fontSize: "13px", fontWeight: "bold" },
  filterSelect: { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #333", background: "#000", color: "#fff", cursor: "pointer", fontSize: "14px" },
  itemsPerPageContainer: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "15px", marginBottom: "15px", flexWrap: "wrap" },
  itemsPerPageLabel: { color: "#aaa", fontSize: "12px" },
  itemsPerPageSelect: { padding: "6px 10px", borderRadius: "6px", border: "1px solid #333", background: "#000", color: "#fff", cursor: "pointer", fontSize: "12px" },
  itemsPerPageInfo: { color: "#FFD700", fontSize: "12px" },
  predictionsContainer: { display: "flex", flexDirection: "column", gap: "20px" },
  predictionCard: { background: "#111", borderRadius: "12px", padding: "20px", border: "1px solid #222", transition: "all 0.2s", cursor: "pointer", position: "relative" },
  hotBadge: { position: "absolute", top: "-10px", right: "20px", background: "#FFD700", color: "#000", padding: "4px 12px", borderRadius: "20px", fontSize: "10px", fontWeight: "bold", zIndex: 10 },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" },
  leagueBadge: { background: "#FFD700", color: "#000", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" },
  winBadge: { background: "#00ffcc", color: "#000", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" },
  lossBadge: { background: "#ff4d4d", color: "#fff", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" },
  pendingBadge: { background: "#ffaa00", color: "#000", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" },
  teams: { display: "flex", alignItems: "center", justifyContent: "center", gap: "15px", marginBottom: "10px" },
  homeTeam: { color: "#FFD700", fontSize: "20px", fontWeight: "bold" },
  vs: { color: "#666", fontSize: "14px" },
  awayTeam: { color: "#FFD700", fontSize: "20px", fontWeight: "bold" },
  date: { color: "#666", fontSize: "12px", textAlign: "center", marginTop: "8px" },
  badgeContainer: { display: "flex", justifyContent: "center", gap: "10px", marginTop: "10px", flexWrap: "wrap" },
  riskBadge: { padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold" },
  confidenceBadge: { padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold" },
  premiumTagSmall: { background: "#FFD700", color: "#000", padding: "2px 8px", borderRadius: "12px", fontSize: "10px", fontWeight: "bold" },
  lockedTagSmall: { background: "#ff4d4d", color: "#fff", padding: "2px 8px", borderRadius: "12px", fontSize: "10px", fontWeight: "bold" },
  lockedContainer: { textAlign: "center", padding: "30px", background: "#000", borderRadius: "8px", marginTop: "15px" },
  lockIcon: { fontSize: "48px", marginBottom: "10px" },
  lockedText: { color: "#ff4d4d", fontSize: "16px", fontWeight: "bold", marginBottom: "5px" },
  lockedSubtext: { color: "#aaa", fontSize: "12px", marginBottom: "15px" },
  unlockBtn: { background: "#FFD700", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" },
  predictionDetails: { display: "flex", flexDirection: "column", gap: "12px", marginTop: "15px" },
  predictionRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  predictionLabel: { color: "#aaa", fontSize: "14px" },
  predictionValue: { color: "#FFD700", fontSize: "16px", fontWeight: "bold" },
  confidenceWrapper: { display: "flex", alignItems: "center", gap: "10px", flex: 1 },
  confidenceBar: { flex: 1, height: "6px", background: "#333", borderRadius: "3px", overflow: "hidden" },
  confidenceFill: { height: "100%", background: "#FFD700", borderRadius: "3px" },
  confidenceValue: { color: "#00ffcc", fontSize: "14px", fontWeight: "bold" },
  marketRow: { marginTop: "8px", fontSize: "13px", color: "#ccc" },
  expandBtn: { background: "none", border: "none", color: "#FFD700", cursor: "pointer", fontSize: "12px", padding: "5px", marginTop: "5px", alignSelf: "center" },
  analysisBox: { marginTop: "15px", padding: "15px", background: "#000", borderRadius: "8px" },
  storySection: { marginBottom: "20px", padding: "12px", background: "#111", borderRadius: "8px" },
  aiSection: { marginBottom: "20px", padding: "12px", background: "rgba(255, 215, 0, 0.1)", borderRadius: "8px" },
  storyTitle: { color: "#FFD700", fontSize: "16px", fontWeight: "bold", marginBottom: "12px", borderLeft: "3px solid #FFD700", paddingLeft: "10px" },
  whiteText: { color: "#ffffff", fontSize: "13px", lineHeight: "1.5", marginBottom: "4px" },
  verdictBox: { marginBottom: "20px", padding: "15px", background: "linear-gradient(135deg, #1a1a2e, #000)", borderRadius: "8px", border: "1px solid #FFD700", textAlign: "center" },
  shareBtn: { width: "100%", background: "#333", border: "none", color: "#fff", cursor: "pointer", fontSize: "12px", padding: "10px", borderRadius: "6px", marginTop: "10px" },
  vipMarkets: { marginBottom: "20px", padding: "12px", background: "#0a0a0a", borderRadius: "8px", borderLeft: "3px solid #FFD700" },
  unlockVipBtn: { width: "100%", background: "#FFD700", color: "#000", border: "none", padding: "10px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "14px", marginTop: "10px" },
  paginationWrapper: { marginTop: "30px", marginBottom: "20px" },
  paginationContainer: { display: "flex", justifyContent: "center", alignItems: "center", gap: "15px", flexWrap: "wrap" },
  paginationBtn: { background: "#333", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "bold", transition: "all 0.2s" },
  paginationBtnDisabled: { opacity: 0.4, cursor: "not-allowed" },
  paginationNumbers: { display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" },
  pageNumberBtn: { background: "#333", color: "#fff", border: "none", minWidth: "40px", height: "40px", padding: "0 12px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "bold", transition: "all 0.2s" },
  activePageNumber: { background: "#FFD700", color: "#000" },
  paginationEllipsis: { color: "#aaa", fontSize: "16px", padding: "0 4px" },
  pageInfo: { textAlign: "center", color: "#FFD700", fontSize: "13px", marginTop: "15px" },
  emptyState: { textAlign: "center", padding: "60px 20px", background: "#111", borderRadius: "12px" },
  emptyIcon: { fontSize: "48px", marginBottom: "20px" },
  emptyTitle: { color: "#FFD700", fontSize: "24px", marginBottom: "10px" },
  emptyText: { color: "#aaa", fontSize: "14px" },
  loadingContainer: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" },
  spinner: { width: "50px", height: "50px", border: "3px solid rgba(255, 215, 0, 0.2)", borderTopColor: "#FFD700", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginBottom: "20px" },
  loadingText: { color: "#FFD700", fontSize: "14px" },
};

// ==================== ANIMATIONS ====================
const addAnimations = () => {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    button:hover:not(:disabled) { transform: translateY(-2px); }
    .refresh-btn:hover { background: #FFD700 !important; color: #000 !important; }
    .past-matches-btn:hover { background: #FFD700 !important; color: #000 !important; }
    .day-filter-btn:hover { background: #FFD700 !important; color: #000 !important; }
    .active-day-filter { background: #FFD700 !important; color: #000 !important; border-color: #FFD700 !important; }
    .pagination-btn:hover:not(:disabled) { background: #FFD700 !important; color: #000 !important; }
    .page-number-btn:hover { background: #555 !important; }
    .active-page { background: #FFD700 !important; color: #000 !important; }
    .predictionCard:hover { transform: translateY(-2px); border-color: #FFD700; }
    .league-stat-clickable:hover { border-color: #FFD700; transform: translateY(-2px); }
    input:focus, select:focus { outline: none; border-color: #FFD700; box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.1); }
    @media (max-width: 768px) {
      .mobile-filter-btn { display: block; }
      .filters-section { display: none; }
      .filters-section.show { display: block; }
      .filter-tabs { flex-direction: column; }
      .filter-row { flex-direction: column; }
      .statsSummary { gridTemplateColumns: repeat(2, 1fr); }
      .teams { flex-direction: column; gap: 8px; }
      .predictionRow { flex-direction: column; align-items: flex-start; }
      .confidenceWrapper { width: 100%; }
      .cardHeader { flex-direction: column; align-items: flex-start; gap: 8px; }
      .badgeContainer { flex-direction: column; align-items: center; }
      .leagueStatsGrid { flex-direction: column; }
      .itemsPerPageContainer { flex-direction: column; align-items: flex-start; gap: 10px; }
      .paginationContainer { flex-direction: column; align-items: center; }
      .paginationNumbers { justify-content: center; }
      .dayFilterContainer { justify-content: center; }
      .headerRow { flex-direction: column; align-items: flex-start; }
      .headerButtons { width: 100%; justify-content: flex-start; }
      .marketGrid { grid-template-columns: 1fr; }
    }
    @media (min-width: 769px) {
      .mobile-filterBtn { display: none; }
      .filters-section { display: block !important; }
    }
  `;
  document.head.appendChild(style);
};
addAnimations();