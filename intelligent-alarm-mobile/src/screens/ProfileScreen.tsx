import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, ActivityIndicator, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Moon, Sunrise } from 'lucide-react-native';
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

  const [fullName, setFullName] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [timezone, setTimezone] = useState('UTC');
  const [preferredChallenges, setPreferredChallenges] = useState<string[]>([]);

  const [bedtime, setBedtime] = useState(new Date());
  const [wakeTime, setWakeTime] = useState(new Date());
  const [showBedtimePicker, setShowBedtimePicker] = useState(false);
  const [showWakeTimePicker, setShowWakeTimePicker] = useState(false);

  useEffect(() => {
    fetchProfile();
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

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/users/profile');

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
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      Alert.alert('Error', 'Could not load profile settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        full_name: fullName.trim(),
        difficulty_preference: difficulty,
        timezone,
        target_bedtime: formatTimeDateToString(bedtime),
        target_wake_time: formatTimeDateToString(wakeTime),
        preferred_challenges: preferredChallenges.length > 0 ? preferredChallenges.join(',') : null,
      };

      await api.put('/users/profile', payload);
      Alert.alert('Success', 'Profile updated.');
    } catch (error: any) {
      console.error('Failed to save profile:', error.response?.data || error.message);
      Alert.alert('Error', 'Could not save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  const toggleChallenge = (challenge: string) => {
    setPreferredChallenges((prev) =>
      prev.includes(challenge) ? prev.filter((c) => c !== challenge) : [...prev, challenge]
    );
  };

  const onChangeBedtime = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowBedtimePicker(false);
    if (selectedDate) setBedtime(selectedDate);
  };

  const onChangeWakeTime = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowWakeTimePicker(false);
    if (selectedDate) setWakeTime(selectedDate);
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
          onChange={onChangeBedtime}
        />
      )}

      {showWakeTimePicker && (
        <DateTimePicker
          value={wakeTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChangeWakeTime}
        />
      )}

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
});