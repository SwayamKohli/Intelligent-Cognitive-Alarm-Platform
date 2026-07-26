import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import api from '../lib/api';

export default function CoachScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const { data } = await api.get('/coach/users');
      setUsers(data);
    } catch (error: any) {
      console.error("Coach fetch error:", error);
      Alert.alert("Access Denied", "Could not load assigned clients.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('access_token');
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Loading Coach Portal...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={{ paddingBottom: 60 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchUsers(true)} tintColor="#FFD700" />}
    >
      <View style={styles.headerRow}>
        <Text style={styles.header}>🧘 Coach Portal</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subHeader}>Assigned Users & Sleep Adherence</Text>

      <View style={styles.tableCard}>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 2 }]}>Client</Text>
          <Text style={[styles.th, { flex: 2 }]}>Target Schedule</Text>
          <Text style={styles.th}>Score</Text>
        </View>

        {users.length === 0 ? (
          <Text style={styles.emptyText}>No assigned users available.</Text>
        ) : (
          users.map((user: any) => (
            <View key={user.id} style={styles.tableRow}>
              <View style={{ flex: 2 }}>
                <Text style={styles.clientName}>{user.full_name || 'User'}</Text>
                <Text style={styles.clientEmail}>{user.email}</Text>
              </View>

              <Text style={[styles.td, { flex: 2, fontSize: 13 }]}>
                {user.bedtime && user.wake_time ? `${user.bedtime} - ${user.wake_time}` : 'Not set'}
              </Text>

              <Text style={[styles.td, styles.scoreBadge]}>
                {user.habit_score ?? 0}%
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  centerContainer: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#888', marginTop: 15 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 10 },
  header: { fontSize: 26, fontWeight: 'bold', color: '#FFD700' },
  logoutText: { color: '#FF5252', fontWeight: 'bold', fontSize: 16 },
  subHeader: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginBottom: 15 },
  
  tableCard: { backgroundColor: '#1E1E1E', borderRadius: 12, borderWidth: 1, borderColor: '#333', padding: 15 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 10, marginBottom: 10 },
  th: { flex: 1, color: '#AAA', fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
  tableRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#222', alignItems: 'center' },
  td: { flex: 1, color: '#FFF', fontSize: 14, textAlign: 'center' },
  
  clientName: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  clientEmail: { color: '#888', fontSize: 12, marginTop: 2 },
  scoreBadge: { color: '#4CAF50', fontWeight: 'bold', fontSize: 16 },
  emptyText: { color: '#888', textAlign: 'center', marginVertical: 20 }
});