// import React, { useContext, useEffect } from "react";
// import { AuthContext } from "./AuthContext";
// import {
//   ActivityIndicator,
//   View,
//   StyleSheet,
// } from "react-native";
// import { useNavigate } from "react-router-dom";

// export default function NavigationGuard({ children }) {
//   const { user, loading } = useContext(AuthContext);
//   const navigate = useNavigate(); // ✅ FIXED

//   // 🔐 Redirect if not authenticated
//   useEffect(() => {
//     if (!loading && !user) {
//       navigate("/"); // ✅ redirect to Login ("/")
//     }
//   }, [user, loading, navigate]);

//   // 🔄 Loading state (keep your UI)
//   if (loading) {
//     return (
//       <View style={styles.loaderContainer}>
//         <ActivityIndicator size="large" color="#FFD700" />
//       </View>
//     );
//   }

//   // 🚫 Prevent render until redirect happens
//   if (!user) {
//     return null;
//   }

//   // ✅ Authenticated → render protected content
//   return children;
// }

// const styles = StyleSheet.create({
//   loaderContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#000",
//   },
// });