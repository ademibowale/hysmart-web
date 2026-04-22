import React from "react";
import { Routes, Route } from "react-router-dom";

// SCREENS
import CommunityScreen from "./screens/CommunityScreen";
import Login from "./screens/Login";
import Signup from "./screens/Signup";
import ForgotPassword from "./ForgotPassword";
import Dashboard from "./screens/Dashboard";
import AdminPanel from "./AdminPanel";

export default function AppNavigator() {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot" element={<ForgotPassword />} />

      {/* PROTECTED */}
      <Route path="/dashboard" element={<Dashboard />} />
     <Route path="/admin" element={<AdminPanel />} />
      <Route path="/community" element={<CommunityScreen />} />
    </Routes>
  );
}



// import React from "react";
// import { Routes, Route } from "react-router-dom";

// import Login from "./Login";
// import Signup from "./Signup";
// import Dashboard from "./Dashboard";
// import ForgotPassword from "./ForgotPassword";
// import CommunityScreen from "./CommunityScreen";

// export default function AppNavigator() {
//   return (
//     <Routes>
//       <Route path="/" element={<Login />} />
//       <Route path="/signup" element={<Signup />} />
//       <Route path="/dashboard" element={<Dashboard />} />
//       <Route path="/forgot" element={<ForgotPassword />} />
//       <Route path="/community" element={<CommunityScreen />} />
//     </Routes>
//   );
// }