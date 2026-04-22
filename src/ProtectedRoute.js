
import React, { useContext } from 'react';
import { AuthContext } from './AuthContext';
import { View, Text } from 'react-native';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <Text>Loading...</Text>;
  if (!user) return <Text>Unauthorized</Text>;

  return children;
}
