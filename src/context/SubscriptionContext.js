import React, { createContext, useContext, useState, useEffect } from "react";
import { getProfile } from "../services/subscriptionApi";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshSubscription = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const user = await getProfile(token);
      setSubscription(user.subscription);
    } catch (err) {
      console.log("Subscription refresh error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSubscription();
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{ subscription, refreshSubscription, loading }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => useContext(SubscriptionContext);