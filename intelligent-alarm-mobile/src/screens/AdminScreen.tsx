import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import api from '../lib/api';

export default function AdminScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const { data } = await api.get('/admin/metrics');
      setMetrics(data);
    } catch (error: any) {
      console.error("Admin fetch error:", error);
      Alert.alert("Access Denied", "Could not load admin metrics.");
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
        <Text style={styles.loadingText}>Loading Admin Console...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={{ paddingBottom: 60 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchMetrics(true)} tintColor="#FFD700" />}
    >
      <View style={styles.headerRow}>
        <Text style={styles.header}>⏰ Admin Console</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subHeader}>Platform Overview</Text>

      {/* KPI STAT CARDS */}
      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.cardIcon}>◆</Text>
          <Text style={styles.cardLabel}>Total Registered Users</Text>
          <Text style={styles.cardValue}>{metrics?.user_growth?.total_registered ?? 0}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardIcon}>▲</Text>
          <Text style={styles.cardLabel}>Daily Active Users</Text>
          <Text style={styles.cardValue}>{metrics?.user_growth?.active_daily ?? 0}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardIcon}>⏸</Text>
          <Text style={styles.cardLabel}>Average Active Snoozes</Text>
          <Text style={styles.cardValue}>{metrics?.global_snooze?.average_active_snoozes ?? 0}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardIcon}>⏰</Text>
          <Text style={styles.cardLabel}>Total Active Alarms</Text>
          <Text style={styles.cardValue}>{metrics?.global_snooze?.total_active_alarms ?? 0}</Text>
        </View>
      </View>

      {/* ENGINE FAILURE TABLE */}
      <Text style={[styles.subHeader, { marginTop: 25 }]}>Engine Failure Rates</Text>
      <View style={styles.tableCard}>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 2 }]}>Engine</Text>
          <Text style={styles.th}>Att</Text>
          <Text style={styles.th}>Fail</Text>
          <Text style={styles.th}>Rate</Text>
        </View>

        {metrics?.engine_failure_rates?.length === 0 ? (
          <Text style={styles.emptyText}>No engine telemetry available.</Text>
        ) : (
          metrics?.engine_failure_rates?.map((e: any, index: number) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.td, { flex: 2, fontWeight: 'bold' }]}>{e.engine}</Text>
              <Text style={styles.td}>{e.attempts}</Text>
              <Text style={styles.td}>{e.failures}</Text>
              <Text style={[styles.td, styles.rateBadge]}>{e.failure_rate_percentage}%</Text>
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
  subHeader: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 15 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  card: { width: '48%', backgroundColor: '#1E1E1E', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#333' },
  cardIcon: { fontSize: 20, color: '#FFD700', marginBottom: 5 },
  cardLabel: { color: '#AAA', fontSize: 12, marginBottom: 8 },
  cardValue: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },

  tableCard: { backgroundColor: '#1E1E1E', borderRadius: 12, borderWidth: 1, borderColor: '#333', padding: 15 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 10, marginBottom: 10 },
  th: { flex: 1, color: '#AAA', fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
  tableRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#222', alignItems: 'center' },
  td: { flex: 1, color: '#FFF', fontSize: 14, textAlign: 'center', textTransform: 'capitalize' },
  rateBadge: { color: '#FFD700', fontWeight: 'bold' },
  emptyText: { color: '#888', textAlign: 'center', marginVertical: 20 }
});