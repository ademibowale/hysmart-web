import React from "react";
import { useSubscription } from "../context/SubscriptionContext";
import UpgradeScreen from "../app/subscriptions";

// Helper function (can also be moved to shared file)
function canAccessPredictions(subscription, createdAt) {
  // ✅ Paid user
  if (subscription?.status === "active") return true;

  // ✅ Free trial (3 days)
  if (createdAt) {
    const created = new Date(createdAt);
    const now = new Date();
    const diffDays = (now - created) / (1000 * 60 * 60 * 24);

    if (diffDays <= 3) return true;
  }

  // ❌ No access
  return false;
}

export default function PremiumGuard({ children, user }) {
  const { subscription, loading } = useSubscription();

  if (loading) return null;

  const createdAt = user?.created_at;

  const allowed = canAccessPredictions(subscription, createdAt);

  if (!allowed) {
    return <UpgradeScreen />;
  }

  return children;
}