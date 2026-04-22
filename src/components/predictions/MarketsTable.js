import React from "react";
import { View, Text, StyleSheet } from "react-native";
import COLORS from '../../theme/colors';

export default function MarketsTable({ markets }) {
  return (
    <View style={styles.table}>
      {Object.entries(markets).map(([market, value]) => (
        <View key={market} style={styles.row}>
          <Text style={styles.market}>
            {market.replace(/([A-Z])/g, " $1").toUpperCase()}
          </Text>
          <Text style={styles.value}>{value.toString()}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    marginTop: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  market: { color: COLORS.gold, fontWeight: "600" },
  value: { color: COLORS.text },
});