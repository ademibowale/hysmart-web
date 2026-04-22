
import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import axios from "axios";
import { LineChart, BarChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";

export default function AdminAnalytics(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    axios.get("http://localhost:5000/admin/analytics",{
      headers:{'x-user-id':'ADMIN_USER_ID'}
    }).then(res=>setData(res.data));
  },[]);

  if(!data) return <Text>Loading analytics...</Text>;

  const screenWidth = Dimensions.get("window").width;

  return(
    <View>
      <Text>Total Users: {data.totalUsers}</Text>
      <Text>Total Subscriptions: {data.totalSubscriptions}</Text>
      <Text>Total Predictions: {data.totalPredictions}</Text>

      <BarChart
        data={{
          labels:["Users","Subs","Predictions"],
          datasets:[{data:[data.totalUsers,data.totalSubscriptions,data.totalPredictions]}]
        }}
        width={screenWidth}
        height={220}
        chartConfig={{
          backgroundGradientFrom:"#fff",
          backgroundGradientTo:"#fff",
          color:(opacity=1)=>`rgba(0,0,0,${opacity})`
        }}
      />
    </View>
  );
}
