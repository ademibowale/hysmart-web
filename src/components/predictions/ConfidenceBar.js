import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import COLORS from '../../theme/colors';

export default function ConfidenceBar({ value = 0 }) {

  // ensure valid number
  const confidence = Math.max(0, Math.min(Number(value) || 0, 100));

  const width = `${confidence}%`;

  /* =========================
     RISK LEVEL
  ========================== */

  const riskLevel = useMemo(() => {

    if (confidence >= 80) return "Low Risk";
    if (confidence >= 60) return "Medium Risk";
    return "High Risk";

  }, [confidence]);

  const riskColor = useMemo(() => {

    if (confidence >= 80) return "#00C853"; // green
    if (confidence >= 60) return "#FFB300"; // amber
    return "#FF5252"; // red

  }, [confidence]);

  return (

    <View style={styles.container}>

      <Text style={styles.label}>
        AI Confidence
      </Text>

      <View style={styles.bar}>

        <View
          style={[
            styles.fill,
            { width }
          ]}
        />

      </View>

      <Text style={styles.percent}>
        {confidence}%
      </Text>

      <Text style={[styles.risk,{ color:riskColor }]}>
        Risk Level: {riskLevel}
      </Text>

    </View>

  );

}

const styles = StyleSheet.create({

  container:{
    marginTop:10
  },

  label:{
    color:COLORS.gold,
    marginBottom:6
  },

  bar:{
    height:8,
    backgroundColor:"#222",
    borderRadius:10,
    overflow:"hidden"
  },

  fill:{
    height:"100%",
    backgroundColor:COLORS.success
  },

  percent:{
    color:COLORS.text,
    marginTop:6,
    fontWeight:"bold"
  },

  risk:{
    marginTop:6,
    fontWeight:"600"
  }

});