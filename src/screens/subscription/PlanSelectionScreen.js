// import React, { useEffect, useState } from "react";
// import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
// import { getPlans } from "../../services/subscriptionApi";

// export default function PlanSelectionScreen({ navigation }) {
//   const [plans, setPlans] = useState([]);
//   const [selected, setSelected] = useState(null);

//   useEffect(() => {
//     const loadPlans = async () => {
//       const data = await getPlans();
//       setPlans(data);
//     };
//     loadPlans();
//   }, []);

//   return (
//     <View style={styles.container}>
//       <Text style={styles.header}>Choose Plan</Text>

//       <FlatList
//         data={plans}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => (
//           <TouchableOpacity
//             style={[
//               styles.card,
//               selected === item.id && styles.selectedCard,
//             ]}
//             onPress={() => setSelected(item.id)}
//           >
//             <Text style={styles.planName}>{item.name}</Text>
//             <Text style={styles.price}>${item.price}</Text>
//           </TouchableOpacity>
//         )}
//       />

//       {selected && (
//         <TouchableOpacity
//           style={styles.button}
//           onPress={() =>
//             navigation.navigate("PaymentMethod", { planId: selected })
//           }
//         >
//           <Text style={styles.buttonText}>Continue</Text>
//         </TouchableOpacity>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#000", padding: 20 },
//   header: { color: "#D4AF37", fontSize: 20, marginBottom: 20 },
//   card: {
//     backgroundColor: "#111",
//     padding: 20,
//     borderRadius: 12,
//     marginBottom: 15,
//   },
//   selectedCard: { borderWidth: 2, borderColor: "#D4AF37" },
//   planName: { color: "#fff", fontSize: 16 },
//   price: { color: "#D4AF37", marginTop: 5 },
//   button: {
//     backgroundColor: "#D4AF37",
//     padding: 15,
//     borderRadius: 12,
//     marginTop: 20,
//   },
//   buttonText: { textAlign: "center", fontWeight: "bold" },
// });