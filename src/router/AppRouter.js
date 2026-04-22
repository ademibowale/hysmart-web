import React, { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Lazy load screens (code splitting – reduces initial bundle size)
const AdminPanel = lazy(() => import("../screens/AdminPanel"));
const UpgradeScreen = lazy(() => import("../screens/subscription/UpgradeScreen"));
const PaymentMethodScreen = lazy(() => import("../screens/subscription/PaymentMethodScreen"));
const PaymentStatusScreen = lazy(() => import("../screens/subscription/PaymentStatusScreen"));
const Login = lazy(() => import("../screens/Login"));
const Signup = lazy(() => import("../screens/Signup"));
const ForgotPassword = lazy(() => import("../screens/ForgotPassword"));
const ResetPassword = lazy(() => import("../screens/ResetPassword"));
const Dashboard = lazy(() => import("../screens/Dashboard"));
const CommunityScreen = lazy(() => import("../screens/CommunityScreen"));
const PredictionsScreen = lazy(() => import("../screens/predictions/PredictionsScreen"));

// Fallback component while lazy loading
const Loader = () => (
  <div style={styles.loader}>
    <div style={styles.spinner}></div>
    <p>Loading...</p>
  </div>
);

/* ================= ROUTE GUARDS ================= */

// 🔒 Protected Route - Only accessible when logged in
const ProtectedRoute = ({ session, children, adminOnly = false }) => {
  if (!session) {
    return <Navigate to="/" replace />;
  }
  
  // Check if route requires admin access
  if (adminOnly) {
    const role = session.user?.user_metadata?.role || "user";
    if (role !== "admin") {
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  return children;
};

// 🔓 Public Route - Redirects to dashboard if already logged in
const PublicRoute = ({ session, children }) => {
  if (session) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

/* ================= ROUTER ================= */

const AppRouter = ({ session }) => {
  return (
    <div style={{ minHeight: "100vh", background: "#000" }}>
      <Router>
        <Suspense fallback={<Loader />}>
          <Routes>
            {/* ================= 🔓 PUBLIC ROUTES ================= */}
            <Route
              path="/"
              element={
                <PublicRoute session={session}>
                  <Login />
                </PublicRoute>
              }
            />

            <Route
              path="/signup"
              element={
                <PublicRoute session={session}>
                  <Signup />
                </PublicRoute>
              }
            />

            <Route
              path="/forgot-password"
              element={
                <PublicRoute session={session}>
                  <ForgotPassword />
                </PublicRoute>
              }
            />

            {/* Reset Password - Special case, can be accessed without session */}
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* ================= 🔒 PROTECTED ROUTES ================= */}
            
            {/* Dashboard - Main user dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute session={session}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Predictions - View match predictions */}
            <Route
              path="/predictions"
              element={
                <ProtectedRoute session={session}>
                  <PredictionsScreen />
                </ProtectedRoute>
              }
            />

            {/* Community - Social features */}
            <Route
              path="/community"
              element={
                <ProtectedRoute session={session}>
                  <CommunityScreen />
                </ProtectedRoute>
              }
            />

            {/* Subscription Routes */}
            <Route
              path="/upgrade"
              element={
                <ProtectedRoute session={session}>
                  <UpgradeScreen />
                </ProtectedRoute>
              }
            />

            <Route
              path="/payment-method"
              element={
                <ProtectedRoute session={session}>
                  <PaymentMethodScreen />
                </ProtectedRoute>
              }
            />

            <Route
              path="/payment-status"
              element={
                <ProtectedRoute session={session}>
                  <PaymentStatusScreen />
                </ProtectedRoute>
              }
            />

            {/* 👑 ADMIN ONLY ROUTE */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute session={session} adminOnly={true}>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />

            {/* 🔄 FALLBACK - Catch all undefined routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </div>
  );
};

const styles = {
  loader: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "#000",
    color: "#FFD700",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid rgba(255, 215, 0, 0.3)",
    borderTopColor: "#FFD700",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
};

// Inject keyframe animation for spinner
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
if (!document.querySelector("#router-styles")) {
  styleSheet.id = "router-styles";
  document.head.appendChild(styleSheet);
}

export default AppRouter;