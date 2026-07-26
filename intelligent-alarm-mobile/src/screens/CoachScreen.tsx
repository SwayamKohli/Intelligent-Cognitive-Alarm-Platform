import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { LogOut } from 'lucide-react-native';
import api from '../lib/api';
import { colors, radius, spacing, typography } from '../theme';

function initials(name?: string) {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0].toUpperCase()).join('');
}

function scoreTier(score: number) {
  if (score >= 80) return { bg: colors.successBg, text: colors.success };
  if (score >= 50) return { bg: colors.accentBg, text: colors.accent };
  return { bg: colors.emberBg, text: colors.ember };
}

export default function CoachScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const { data } = await api.get('/coach/users');
      setUsers(data);
    } catch (error) {
      console.error('Coach fetch error:', error);
      Alert.alert('Access Denied', 'Could not load assigned clients.');
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
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading coach portal…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 60 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchUsers(true)} tintColor={colors.accent} />}
    >
      <View style={styles.headerRow}>
        <Text style={styles.header}>Coach Portal</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut color={colors.ember} size={18} />
        </TouchableOpacity>
      </View>

      <Text style={styles.subHeader}>Assigned users and sleep adherence</Text>

      <View style={styles.tableCard}>
        {users.length === 0 ? (
          <Text style={styles.emptyText}>No assigned users yet.</Text>
        ) : (
          users.map((user) => {
            const score = user.habit_score ?? 0;
            const tier = scoreTier(score);
            return (
              <View key={user.id} style={styles.userRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials(user.full_name)}</Text>
                </View>

                <View style={styles.userInfo}>
                  <Text style={styles.clientName}>{user.full_name || 'User'}</Text>
                  <Text style={styles.clientEmail}>{user.email}</Text>
                  <Text style={styles.clientSchedule}>
                    {user.bedtime && user.wake_time ? `${user.bedtime} – ${user.wake_time}` : 'Schedule not set'}
                  </Text>
                </View>

                <View style={[styles.scoreBadge, { backgroundColor: tier.bg }]}>
                  <Text style={[styles.scoreBadgeText, { color: tier.text }]}>{score}%</Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  centerContainer: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' },
  loadingText: { ...typography.caption, marginTop: 15 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 10 },
  header: { ...typography.h1, fontSize: 24 },
  logoutBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.emberBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subHeader: { ...typography.caption, marginBottom: spacing.md },

  tableCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm + 4,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentBg,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  userInfo: { flex: 1 },
  clientName: { color: colors.textHigh, fontWeight: '700', fontSize: 14 },
  clientEmail: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  clientSchedule: { color: colors.text, fontSize: 12, marginTop: 2 },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  scoreBadgeText: { fontSize: 13, fontWeight: '700' },
  emptyText: { color: colors.textDim, textAlign: 'center', marginVertical: 20 },
});