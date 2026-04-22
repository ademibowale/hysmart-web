// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { supabase } from "../supabaseClient";

// export default function Upgrade() {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(true);
//   const [user, setUser] = useState(null);
//   const [currentPlan, setCurrentPlan] = useState("Free");

//   useEffect(() => {
//     const checkUser = async () => {
//       try {
//         const { data: { user: currentUser }, error } = await supabase.auth.getUser();
        
//         if (error || !currentUser) {
//           navigate("/");
//           return;
//         }

//         setUser(currentUser);
//         setCurrentPlan(currentUser.user_metadata?.plan || "Free");
        
//         if (currentUser.user_metadata?.plan === "Premium") {
//           navigate("/dashboard");
//         }
//       } catch (err) {
//         console.error("Error:", err);
//         navigate("/");
//       } finally {
//         setLoading(false);
//       }
//     };

//     checkUser();
//   }, [navigate]);

//   if (loading) {
//     return (
//       <div style={styles.loadingContainer}>
//         <div style={styles.spinner}></div>
//       </div>
//     );
//   }

//   return (
//     <div style={styles.page}>
//       <div style={styles.header}>
//         <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>
//           ← Back to Dashboard
//         </button>
//       </div>
      
//       <div style={styles.container}>
//         <div style={styles.pricingCard}>
//           <h2 style={styles.title}>Premium Plan</h2>
//           <div style={styles.price}>
//             <span style={styles.amount}>$9.99</span>
//             <span style={styles.period}>/month</span>
//           </div>
//           <ul style={styles.features}>
//             <li>✅ Unlimited predictions</li>
//             <li>✅ Premium match analysis</li>
//             <li>✅ Early access to predictions</li>
//             <li>✅ Exclusive betting tips</li>
//             <li>✅ Priority support</li>
//           </ul>
//           <button
//             style={styles.button}
//             onClick={() => alert("Payment integration coming soon!")}
//           >
//             Upgrade to Premium
//           </button>
//           <p style={styles.note}>Secure payment powered by Stripe</p>
//         </div>
//       </div>
//     </div>
//   );
// }

// const styles = {
//   page: {
//     minHeight: "100vh",
//     background: "linear-gradient(135deg, #000000 0%, #1a1a2e 100%)",
//     padding: "20px",
//   },
//   header: {
//     maxWidth: "1200px",
//     margin: "0 auto",
//     marginBottom: "40px",
//   },
//   backBtn: {
//     background: "#333",
//     color: "#fff",
//     border: "none",
//     padding: "10px 20px",
//     borderRadius: "8px",
//     cursor: "pointer",
//     fontSize: "14px",
//   },
//   container: {
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//     minHeight: "calc(100vh - 100px)",
//   },
//   pricingCard: {
//     background: "#111",
//     borderRadius: "16px",
//     padding: "40px",
//     maxWidth: "400px",
//     width: "100%",
//     border: "1px solid #FFD700",
//     boxShadow: "0 0 20px rgba(255, 215, 0, 0.1)",
//     textAlign: "center",
//   },
//   title: {
//     color: "#FFD700",
//     fontSize: "28px",
//     marginBottom: "20px",
//   },
//   price: {
//     marginBottom: "30px",
//   },
//   amount: {
//     color: "#fff",
//     fontSize: "48px",
//     fontWeight: "bold",
//   },
//   period: {
//     color: "#aaa",
//     fontSize: "18px",
//   },
//   features: {
//     listStyle: "none",
//     padding: 0,
//     marginBottom: "30px",
//     textAlign: "left",
//   },
//   button: {
//     width: "100%",
//     padding: "14px",
//     background: "#FFD700",
//     border: "none",
//     borderRadius: "8px",
//     fontSize: "16px",
//     fontWeight: "bold",
//     cursor: "pointer",
//     transition: "all 0.3s",
//   },
//   note: {
//     color: "#666",
//     fontSize: "12px",
//     marginTop: "15px",
//   },
//   loadingContainer: {
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//     height: "100vh",
//     background: "#000",
//   },
//   spinner: {
//     width: "40px",
//     height: "40px",
//     border: "3px solid rgba(255, 215, 0, 0.3)",
//     borderTopColor: "#FFD700",
//     borderRadius: "50%",
//     animation: "spin 1s linear infinite",
//   },
// };

// const addAnimation = () => {
//   const style = document.createElement('style');
//   style.textContent = `
//     @keyframes spin {
//       from { transform: rotate(0deg); }
//       to { transform: rotate(360deg); }
//     }
//     button:hover {
//       transform: translateY(-2px);
//       box-shadow: 0 5px 15px rgba(255, 215, 0, 0.3);
//     }
//   `;
//   document.head.appendChild(style);
// };
// addAnimation();