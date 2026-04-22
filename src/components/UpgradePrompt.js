import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import COLORS from '../../theme/colors';

export default function UpgradePrompt() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔒</Text>

      <Text style={styles.title}>Premium Content Locked</Text>

      <Text style={styles.description}>
        Upgrade to unlock AI reasoning, advanced statistics,
        high-confidence predictions and VIP markets.
      </Text>

      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.8}
        onPress={() => navigation.navigate("PlanSelection")}
      >
        <Text style={styles.buttonText}>Upgrade Now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    padding: 18,
    backgroundColor: "#111",
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  icon: {
    fontSize: 24,
    marginBottom: 8,
  },
  title: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },
  description: {
    color: COLORS.text,
    textAlign: "center",
    fontSize: 13,
    marginBottom: 14,
    lineHeight: 18,
  },
  button: {
    backgroundColor: COLORS.gold,
    paddingVertical: 10,
    paddingHorizontal: 26,
    borderRadius: 10,
  },
  buttonText: {
    fontWeight: "bold",
    color: "#000",
  },
});