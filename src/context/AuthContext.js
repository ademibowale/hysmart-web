// // src/context/AuthContext.js
// import React, { createContext, useContext, useState, useEffect } from 'react';
// import { supabase } from '../supabaseClient'; // Fixed: Go up one level to src folder

// const AuthContext = createContext({});

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within AuthProvider');
//   }
//   return context;
// };

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [session, setSession] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [token, setToken] = useState(null);

//   useEffect(() => {
//     // Get initial session
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       setSession(session);
//       setUser(session?.user ?? null);
//       setToken(session?.access_token ?? null);
//       setLoading(false);
//     });

//     // Listen for auth changes
//     const { data: { subscription } } = supabase.auth.onAuthStateChange(
//       (_event, session) => {
//         setSession(session);
//         setUser(session?.user ?? null);
//         setToken(session?.access_token ?? null);
//         setLoading(false);
//       }
//     );

//     return () => subscription.unsubscribe();
//   }, []);

//   const signIn = async (email, password) => {
//     const { data, error } = await supabase.auth.signInWithPassword({
//       email,
//       password,
//     });
//     return { data, error };
//   };

//   const signOut = async () => {
//     const { error } = await supabase.auth.signOut();
//     return { error };
//   };

//   const signUp = async (email, password, metadata = {}) => {
//     const { data, error } = await supabase.auth.signUp({
//       email,
//       password,
//       options: {
//         data: metadata,
//       },
//     });
//     return { data, error };
//   };

//   const value = {
//     user,
//     session,
//     token,
//     loading,
//     signIn,
//     signOut,
//     signUp,
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// };