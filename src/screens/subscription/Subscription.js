
import React,{useEffect,useState} from "react";
import {View,Text} from "react-native";
import axios from "axios";

export default function Subscription(){
  const [plans,setPlans]=useState(null);

  useEffect(()=>{
    axios.get("http://localhost:5000/geo-price")
      .then(res=>setPlans(res.data))
      .catch(()=>{});
  },[]);

  if(!plans) return <Text>Loading pricing...</Text>;

  return(
    <View>
      <Text>Currency: {plans.currency}</Text>
      <Text>1 Month: {plans.plans.month}</Text>
      <Text>3 Months: {plans.plans.three}</Text>
      <Text>1 Year: {plans.plans.year}</Text>
    </View>
  );
}
