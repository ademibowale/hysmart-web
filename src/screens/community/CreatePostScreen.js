import React, { useState } from "react";
import {
 View,
 Text,
 TextInput,
 TouchableOpacity,
 StyleSheet,
 Alert,
 ActivityIndicator,
 KeyboardAvoidingView,
 Platform,
 ScrollView
} from "react-native";
import COLORS from '../../theme/colors';
import { createPost } from "../../services/communityService";

export default function CreatePostScreen({ navigation }) {

 const [match,setMatch] = useState("");
 const [prediction,setPrediction] = useState("");
 const [analysis,setAnalysis] = useState("");
 const [loading,setLoading] = useState(false);

 const handleSubmit = async ()=>{

  if(!match.trim() || !prediction.trim()){
   Alert.alert("Missing info","Please complete the form");
   return;
  }

  try{

   setLoading(true);

   await createPost({
    match,
    prediction,
    analysis
   });

   setMatch("");
   setPrediction("");
   setAnalysis("");

   Alert.alert("Success","Your tip has been posted");

   navigation.goBack();

  }catch(err){

   console.log("Post error:",err);

   Alert.alert(
    "Error",
    err?.response?.data?.message || "Failed to create post"
   );

  }finally{
   setLoading(false);
  }

 };

 return(

  <KeyboardAvoidingView
   style={{flex:1}}
   behavior={Platform.OS === "ios" ? "padding" : undefined}
  >

   <ScrollView
    contentContainerStyle={styles.container}
    keyboardShouldPersistTaps="handled"
   >

    <Text style={styles.header}>
     Post Community Tip
    </Text>

    <TextInput
     placeholder="Match (Team A vs Team B)"
     placeholderTextColor="#888"
     style={styles.input}
     value={match}
     onChangeText={setMatch}
    />

    <TextInput
     placeholder="Prediction (Example: Over 2.5 Goals)"
     placeholderTextColor="#888"
     style={styles.input}
     value={prediction}
     onChangeText={setPrediction}
    />

    <TextInput
     placeholder="Analysis (optional)"
     placeholderTextColor="#888"
     style={[styles.input,{height:120}]}
     value={analysis}
     multiline
     textAlignVertical="top"
     onChangeText={setAnalysis}
    />

    <TouchableOpacity
     style={[
      styles.button,
      loading && {opacity:0.7}
     ]}
     onPress={handleSubmit}
     disabled={loading}
    >

     {loading ? (
      <ActivityIndicator color="#000"/>
     ) : (
      <Text style={styles.buttonText}>
       Publish Tip
      </Text>
     )}

    </TouchableOpacity>

   </ScrollView>

  </KeyboardAvoidingView>

 );

}

const styles = StyleSheet.create({

 container:{
  flexGrow:1,
  padding:20,
  backgroundColor:COLORS.background
 },

 header:{
  fontSize:22,
  fontWeight:"bold",
  color:COLORS.gold,
  marginBottom:20
 },

 input:{
  backgroundColor:COLORS.card,
  padding:14,
  borderRadius:8,
  marginBottom:14,
  color:COLORS.text
 },

 button:{
  backgroundColor:COLORS.gold,
  padding:16,
  borderRadius:10,
  alignItems:"center",
  marginTop:10
 },

 buttonText:{
  fontWeight:"bold",
  color:"#000",
  fontSize:16
 }

});