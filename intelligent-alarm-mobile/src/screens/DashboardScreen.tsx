import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { LogOut, Plus, Play, Trash2 } from 'lucide-react-native';
import api from '../lib/api';
import * as SecureStore from 'expo-secure-store';
import { colors, radius, spacing, typography } from '../theme';

export default function DashboardScreen({ navigation }: any) {
  const [alarms, setAlarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlarms = async () => {
    try {
      setLoading(true);
      const response = await api.get('/alarms/');
      setAlarms(response.data);
    } catch (error) {
      console.error('Failed to fetch alarms:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAlarms();
    });
    return unsubscribe;
  }, [navigation]);

  // Checks every 10s whether any active alarm matches the current time
  useEffect(() => {
    const interval = setInterval(() => {
      if (alarms.length === 0) return;

      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      const match = alarms.find((alarm) => {
        if (!alarm.is_active || !alarm.time) return false;
        const [alarmHour, alarmMinute] = alarm.time.split(':').map(Number);
        return currentHour === alarmHour && currentMinute === alarmMinute;
      });

      if (match) {
        // Immutable update — disable locally so it doesn't re-fire within the same minute
        setAlarms((prev) =>
          prev.map((a) => (a.id === match.id ? { ...a, is_active: false } : a))
        );
        navigation.navigate('Ringing', { alarmId: match.id, label: match.label });
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [alarms, navigation]);

  const handleDelete = async (alarmId: string) => {
    try {
      await api.delete(`/alarms/${alarmId}`);
      setAlarms((prev) => prev.filter((a) => a.id !== alarmId));
    } catch (error) {
      console.error('Failed to delete:', error);
      Alert.alert('Error', 'Could not delete this alarm.');
    }
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('access_token');
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const renderAlarm = ({ item }: { item: any }) => {
    const timeStringRaw = item.time || '00:00:00';
    const [hourStr, minStr] = timeStringRaw.split(':');
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    const formattedTime = `${hour}:${minStr} ${ampm}`;

    return (
      <View style={styles.alarmCard}>
        <View style={styles.alarmInfo}>
          <Text style={styles.alarmTime}>{formattedTime}</Text>
          <Text style={styles.alarmLabel}>{item.label || 'Cognitive Alarm'}</Text>
          {item.preferred_challenges ? (
            <Text style={styles.challengeTypeLabel}>
              {item.preferred_challenges.split(',').join(' · ')}
            </Text>
          ) : (
            <Text style={styles.challengeTypeLabel}>All challenge types</Text>
          )}
        </View>

        <View style={styles.actionColumn}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: item.is_active ? colors.accentBg : 'rgba(255,255,255,0.05)' },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: item.is_active ? colors.accent : colors.textDim },
              ]}
            />
            <Text style={[styles.statusText, { color: item.is_active ? colors.accent : colors.textDim }]}>
              {item.is_active ? 'ON' : 'OFF'}
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('Ringing', { alarmId: item.id, label: item.label })}
            >
              <Play color={colors.success} size={15} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButtonDanger} onPress={() => handleDelete(item.id)}>
              <Trash2 color={colors.ember} size={15} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>My Alarms</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut color={colors.ember} size={18} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 50 }} />
      ) : alarms.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No alarms set</Text>
          <Text style={styles.emptyStateSubText}>Tap below to create one</Text>
        </View>
      ) : (
        <FlatList
          data={alarms}
          keyExtractor={(item: any) => item.id.toString()}
          renderItem={renderAlarm}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateAlarm')} activeOpacity={0.85}>
        <Plus color="#0A0A0B" size={18} strokeWidth={2.5} />
        <Text style={styles.fabText}>New Alarm</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 60,
    marginBottom: spacing.lg,
  },
  header: { ...typography.h1 },
  logoutBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.emberBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  alarmCard: {
    backgroundColor: colors.bgCard,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm + 3,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  alarmInfo: { flex: 1 },
  alarmTime: { fontSize: 24, fontWeight: '700', color: colors.textHigh },
  alarmLabel: { fontSize: 14, color: colors.text, marginTop: 4 },
  challengeTypeLabel: { fontSize: 12, color: colors.textDim, marginTop: 4, textTransform: 'capitalize' },

  actionColumn: { alignItems: 'flex-end', justifyContent: 'space-between' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginBottom: 10,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },

  buttonRow: { flexDirection: 'row', gap: 8 },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonDanger: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.emberBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyStateText: { ...typography.h2 },
  emptyStateSubText: { ...typography.caption, marginTop: 8 },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: spacing.lg,
    left: spacing.lg,
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  fabText: { color: '#0A0A0B', fontSize: 15, fontWeight: '700' },
});