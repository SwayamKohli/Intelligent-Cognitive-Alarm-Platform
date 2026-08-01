import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, ActivityIndicator, Platform, Switch
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Moon, Sunrise, Download, FileText, Bell } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as SecureStore from 'expo-secure-store';
import api from '../lib/api';
import { colors, radius, spacing, typography } from '../theme';

const AVAILABLE_CHALLENGES = ['math', 'memory', 'pattern', 'logic', 'word_scramble', 'riddle', 'quiz'];
const DIFFICULTY_LEVELS = ['beginner', 'easy', 'medium', 'hard', 'expert'];
const TIMEZONES = [
  { label: 'IST (Kolkata)', value: 'Asia/Kolkata' },
  { label: 'UTC', value: 'UTC' },
  { label: 'EST (New York)', value: 'America/New_York' },
  { label: 'GMT (London)', value: 'Europe/London' },
];

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  const [fullName, setFullName] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [timezone, setTimezone] = useState('UTC');
  const [preferredChallenges, setPreferredChallenges] = useState<string[]>([]);

  const [bedtime, setBedtime] = useState(new Date());
  const [wakeTime, setWakeTime] = useState(new Date());
  const [showBedtimePicker, setShowBedtimePicker] = useState(false);
  const [showWakeTimePicker, setShowWakeTimePicker] = useState(false);

  // Notification Preferences State
  const [notifPrefs, setNotifPrefs] = useState({
    bedtime_warning_enabled: true,
    bedtime_warning_minutes: 30,
    morning_streak_alert: true,
    challenge_reminders: false,
    weekly_sleep_report: true,
  });

  useEffect(() => {
    fetchProfileAndSettings();
  }, []);

  const parseTimeStringToDate = (timeStr?: string, defaultHours = 22, defaultMins = 0) => {
    const d = new Date();
    if (!timeStr) {
      d.setHours(defaultHours, defaultMins, 0, 0);
      return d;
    }
    const [hours, minutes] = timeStr.split(':').map(Number);
    d.setHours(hours || defaultHours, minutes || defaultMins, 0, 0);
    return d;
  };

  const formatTimeDateToString = (dateObj: Date) => {
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const fetchProfileAndSettings = async () => {
    try {
      setLoading(true);
      
      // Fetch Profile and Notifications in parallel
      const [profileRes, notifRes] = await Promise.all([
        api.get('/users/profile'),
        api.get('/notifications/preferences').catch(() => ({ data: null })) // Graceful fail if new user
      ]);

      const data = profileRes.data;
      setFullName(data.full_name || '');
      setDifficulty(data.difficulty_preference || 'medium');
      setTimezone(data.timezone || 'UTC');
      setBedtime(parseTimeStringToDate(data.target_bedtime || data.bedtime, 22, 0));
      setWakeTime(parseTimeStringToDate(data.target_wake_time || data.wake_time, 6, 0));

      if (data.preferred_challenges) {
        setPreferredChallenges(data.preferred_challenges.split(','));
      } else {
        setPreferredChallenges([]);
      }

      if (notifRes.data) {
        setNotifPrefs({
          bedtime_warning_enabled: notifRes.data.bedtime_warning_enabled,
          bedtime_warning_minutes: notifRes.data.bedtime_warning_minutes,
          morning_streak_alert: notifRes.data.morning_streak_alert,
          challenge_reminders: notifRes.data.challenge_reminders,
          weekly_sleep_report: notifRes.data.weekly_sleep_report,
        });
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      Alert.alert('Error', 'Could not load profile settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const profilePayload = {
        full_name: fullName.trim(),
        difficulty_preference: difficulty,
        timezone,
        target_bedtime: formatTimeDateToString(bedtime),
        target_wake_time: formatTimeDateToString(wakeTime),
        preferred_challenges: preferredChallenges.length > 0 ? preferredChallenges.join(',') : null,
      };

      // Save both endpoints
      await Promise.all([
        api.put('/users/profile', profilePayload),
        api.put('/notifications/preferences', notifPrefs)
      ]);
      
      Alert.alert('Success', 'Profile and preferences updated.');
    } catch (error: any) {
      console.error('Failed to save profile:', error.response?.data || error.message);
      Alert.alert('Error', 'Could not save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  const downloadReport = async (type: 'pdf' | 'excel') => {
    try {
      if (type === 'pdf') setDownloadingPdf(true);
      else setDownloadingExcel(true);

      const token = await SecureStore.getItemAsync('access_token');
      if (!token) throw new Error("No auth token");

      const ext = type === 'pdf' ? 'pdf' : 'xlsx';
      const fileUri = `${FileSystem.documentDirectory}sleep_report_${Date.now()}.${ext}`;

      const { uri, status } = await FileSystem.downloadAsync(
        `${api.defaults.baseURL}/reports/export/${type}`,
        fileUri,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (status !== 200) throw new Error("Failed to generate report from server");

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Downloaded', `File saved to ${uri}`);
      }
    } catch (error: any) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download report.');
    } finally {
      setDownloadingPdf(false);
      setDownloadingExcel(false);
    }
  };

  const toggleChallenge = (challenge: string) => {
    setPreferredChallenges((prev) =>
      prev.includes(challenge) ? prev.filter((c) => c !== challenge) : [...prev, challenge]
    );
  };

  const togglePref = (key: keyof typeof notifPrefs) => {
    setNotifPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      <Text style={styles.header}>Profile Settings</Text>

      <Text style={styles.label}>Full Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your name"
        placeholderTextColor={colors.textDim}
        value={fullName}
        onChangeText={setFullName}
      />

      <Text style={styles.sectionTitle}>Target Sleep Schedule</Text>
      <View style={styles.timeRow}>
        <View style={styles.timeBox}>
          <Text style={styles.label}>Bedtime</Text>
          <TouchableOpacity style={styles.timeBtn} onPress={() => setShowBedtimePicker(true)}>
            <Moon color={colors.accent} size={16} />
            <Text style={styles.timeText}>{formatTimeDateToString(bedtime)}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.timeBox}>
          <Text style={styles.label}>Wake Time</Text>
          <TouchableOpacity style={styles.timeBtn} onPress={() => setShowWakeTimePicker(true)}>
            <Sunrise color={colors.accent} size={16} />
            <Text style={styles.timeText}>{formatTimeDateToString(wakeTime)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showBedtimePicker && (
        <DateTimePicker
          value={bedtime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(e, d) => {
            if (Platform.OS === 'android') setShowBedtimePicker(false);
            if (d) setBedtime(d);
          }}
        />
      )}

      {showWakeTimePicker && (
        <DateTimePicker
          value={wakeTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(e, d) => {
            if (Platform.OS === 'android') setShowWakeTimePicker(false);
            if (d) setWakeTime(d);
          }}
        />
      )}

      {/* Notification Settings */}
      <View style={styles.settingHeaderRow}>
        <Bell color={colors.textHigh} size={20} />
        <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>Notifications</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Bedtime Warning</Text>
          <Switch
            value={notifPrefs.bedtime_warning_enabled}
            onValueChange={() => togglePref('bedtime_warning_enabled')}
            trackColor={{ false: colors.border, true: colors.accentBg }}
            thumbColor={notifPrefs.bedtime_warning_enabled ? colors.accent : '#f4f3f4'}
          />
        </View>

        {notifPrefs.bedtime_warning_enabled && (
          <View style={styles.minutesRow}>
            <Text style={styles.minutesLabel}>Warn me before bedtime</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() =>
                  setNotifPrefs((prev) => ({
                    ...prev,
                    bedtime_warning_minutes: Math.max(5, prev.bedtime_warning_minutes - 5),
                  }))
                }
              >
                <Text style={styles.stepperBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{notifPrefs.bedtime_warning_minutes} min</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() =>
                  setNotifPrefs((prev) => ({
                    ...prev,
                    bedtime_warning_minutes: Math.min(120, prev.bedtime_warning_minutes + 5),
                  }))
                }
              >
                <Text style={styles.stepperBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Morning Streak Alert</Text>
          <Switch
            value={notifPrefs.morning_streak_alert}
            onValueChange={() => togglePref('morning_streak_alert')}
            trackColor={{ false: colors.border, true: colors.accentBg }}
            thumbColor={notifPrefs.morning_streak_alert ? colors.accent : '#f4f3f4'}
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Challenge Reminders</Text>
          <Switch
            value={notifPrefs.challenge_reminders}
            onValueChange={() => togglePref('challenge_reminders')}
            trackColor={{ false: colors.border, true: colors.accentBg }}
            thumbColor={notifPrefs.challenge_reminders ? colors.accent : '#f4f3f4'}
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Weekly Sleep Report</Text>
          <Switch
            value={notifPrefs.weekly_sleep_report}
            onValueChange={() => togglePref('weekly_sleep_report')}
            trackColor={{ false: colors.border, true: colors.accentBg }}
            thumbColor={notifPrefs.weekly_sleep_report ? colors.accent : '#f4f3f4'}
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Difficulty Preference</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {DIFFICULTY_LEVELS.map((level) => {
          const active = difficulty === level;
          return (
            <TouchableOpacity
              key={level}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setDifficulty(level)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{level.toUpperCase()}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={styles.sectionTitle}>Timezone</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {TIMEZONES.map((tz) => {
          const active = timezone === tz.value;
          return (
            <TouchableOpacity
              key={tz.value}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setTimezone(tz.value)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{tz.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={styles.sectionTitle}>Allowed Challenges</Text>
      <Text style={styles.subText}>Leave blank to allow all challenge types</Text>
      <View style={styles.grid}>
        {AVAILABLE_CHALLENGES.map((challenge) => {
          const active = preferredChallenges.includes(challenge);
          return (
            <TouchableOpacity
              key={challenge}
              style={[styles.gridChip, active && styles.chipActive]}
              onPress={() => toggleChallenge(challenge)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {challenge.replace('_', ' ').toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Profile'}</Text>
      </TouchableOpacity>

      {/* NEW: Reports & Exports Section */}
      <Text style={[styles.sectionTitle, { marginTop: 40 }]}>Data Exports</Text>
      <Text style={styles.subText}>Download your complete sleep and habit history</Text>
      
      <View style={styles.exportRow}>
        <TouchableOpacity 
          style={styles.exportBtn} 
          onPress={() => downloadReport('pdf')}
          disabled={downloadingPdf}
        >
          {downloadingPdf ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <>
              <FileText color={colors.accent} size={20} />
              <Text style={styles.exportBtnText}>Export PDF</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.exportBtn} 
          onPress={() => downloadReport('excel')}
          disabled={downloadingExcel}
        >
          {downloadingExcel ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <>
              <Download color={colors.accent} size={20} />
              <Text style={styles.exportBtnText}>Export Excel</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  centerContainer: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' },
  header: { ...typography.h1, marginTop: 40, marginBottom: spacing.lg },
  sectionTitle: { ...typography.h2, fontSize: 16, marginTop: spacing.lg, marginBottom: spacing.sm },
  label: { ...typography.caption, marginBottom: 6, fontWeight: '600' },
  subText: { ...typography.caption, marginBottom: spacing.sm },
  input: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    color: colors.textHigh,
    padding: 15,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
  },

  timeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
  timeBox: { flex: 1 },
  timeBtn: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 15,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  timeText: { color: colors.textHigh, fontSize: 18, fontWeight: '700' },

  settingHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.xl, marginBottom: spacing.sm },
  card: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
  switchLabel: { color: colors.textHigh, fontSize: 16, fontWeight: '500' },

  exportRow: { flexDirection: 'row', gap: 15, marginTop: 10, marginBottom: 20 },
  exportBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 15,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  exportBtnText: { color: colors.accent, fontSize: 14, fontWeight: '600' },

  chipScroll: { maxHeight: 50, marginBottom: 10 },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.accentBg, borderColor: colors.accentBorder },
  chipText: { color: colors.textDim, fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: colors.accent },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 5 },
  gridChip: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  saveBtn: {
    backgroundColor: colors.accent,
    padding: 18,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveBtnText: { color: '#0A0A0B', fontSize: 16, fontWeight: '700' },
  minutesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  minutesLabel: { color: colors.text, fontSize: 14 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  stepperBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.accentBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: { color: colors.accent, fontSize: 16, fontWeight: '700', lineHeight: 18 },
  stepperValue: { color: colors.textHigh, fontSize: 13, fontWeight: '700', minWidth: 52, textAlign: 'center' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 6 },
});