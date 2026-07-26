import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Alert, ScrollView, ActivityIndicator, Platform 
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../lib/api';

const AVAILABLE_CHALLENGES = [
  'math', 'memory', 'pattern', 'logic', 'word_scramble', 'riddle', 'quiz'
];

const DIFFICULTY_LEVELS = ['beginner', 'easy', 'medium', 'hard', 'expert'];
const TIMEZONES = [
  { label: 'IST (Kolkata)', value: 'Asia/Kolkata' },
  { label: 'UTC', value: 'UTC' },
  { label: 'EST (New York)', value: 'America/New_York' },
  { label: 'GMT (London)', value: 'Europe/London' }
];

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [timezone, setTimezone] = useState('UTC');
  const [preferredChallenges, setPreferredChallenges] = useState<string[]>([]);

  // Time Picker State (storing Date objects for the native picker)
  const [bedtime, setBedtime] = useState(new Date());
  const [wakeTime, setWakeTime] = useState(new Date());
  const [showBedtimePicker, setShowBedtimePicker] = useState(false);
  const [showWakeTimePicker, setShowWakeTimePicker] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  // Helper: Convert "HH:MM" or "HH:MM:SS" string from backend into a JS Date object
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

  // Helper: Format JS Date object to "HH:MM" string for Pydantic backend
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
      
      // Parse Bedtime & Wake Time
      setBedtime(parseTimeStringToDate(data.target_bedtime || data.bedtime, 22, 0));
      setWakeTime(parseTimeStringToDate(data.target_wake_time || data.wake_time, 6, 0));

      // Parse comma-separated preferred challenges
      if (data.preferred_challenges) {
        setPreferredChallenges(data.preferred_challenges.split(','));
      } else {
        setPreferredChallenges([]);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      Alert.alert("Error", "Could not load profile settings.");
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
        timezone: timezone,
        target_bedtime: formatTimeDateToString(bedtime),
        target_wake_time: formatTimeDateToString(wakeTime),
        preferred_challenges: preferredChallenges.length > 0 ? preferredChallenges.join(',') : null
      };

      await api.put('/users/profile', payload);
      Alert.alert("Success", "Profile and target sleep schedule updated!");
    } catch (error: any) {
      console.error("Failed to save profile:", error.response?.data || error.message);
      Alert.alert("Error", "Could not save profile changes.");
    } finally {
      setSaving(false);
    }
  };

  const toggleChallenge = (challenge: string) => {
    setPreferredChallenges((prev) => 
      prev.includes(challenge) 
        ? prev.filter((c) => c !== challenge) 
        : [...prev, challenge]
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
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      <Text style={styles.header}>Profile Settings</Text>

      {/* Full Name */}
      <Text style={styles.label}>Full Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your name"
        placeholderTextColor="#666"
        value={fullName}
        onChangeText={setFullName}
      />

      {/* Target Sleep Schedule (Bedtime & Wake Time) */}
      <Text style={styles.sectionTitle}>Target Sleep Schedule</Text>
      <View style={styles.timeRow}>
        <View style={styles.timeBox}>
          <Text style={styles.label}>Target Bedtime</Text>
          <TouchableOpacity style={styles.timeBtn} onPress={() => setShowBedtimePicker(true)}>
            <Text style={styles.timeText}>{formatTimeDateToString(bedtime)}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.timeBox}>
          <Text style={styles.label}>Target Wake Time</Text>
          <TouchableOpacity style={styles.timeBtn} onPress={() => setShowWakeTimePicker(true)}>
            <Text style={styles.timeText}>{formatTimeDateToString(wakeTime)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {(showBedtimePicker || Platform.OS === 'ios') && showBedtimePicker && (
        <DateTimePicker
          value={bedtime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChangeBedtime}
        />
      )}

      {(showWakeTimePicker || Platform.OS === 'ios') && showWakeTimePicker && (
        <DateTimePicker
          value={wakeTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChangeWakeTime}
        />
      )}

      {/* Difficulty Preference */}
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
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {level.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Timezone */}
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

      {/* Allowed Challenges */}
      <Text style={styles.sectionTitle}>Allowed Challenges (Global)</Text>
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

      {/* Save Button */}
      <TouchableOpacity 
        style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
        onPress={handleSave} 
        disabled={saving}
      >
        <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save Profile"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  centerContainer: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 32, fontWeight: 'bold', color: '#FFD700', marginTop: 40, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginTop: 20, marginBottom: 10 },
  label: { fontSize: 14, color: '#AAA', marginBottom: 6, fontWeight: '600' },
  subText: { fontSize: 12, color: '#666', marginBottom: 10 },
  input: { backgroundColor: '#1E1E1E', color: '#FFF', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#333', fontSize: 16 },
  
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
  timeBox: { flex: 1 },
  timeBtn: { backgroundColor: '#1E1E1E', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  timeText: { color: '#FFD700', fontSize: 20, fontWeight: 'bold' },

  chipScroll: { maxHeight: 50, marginBottom: 10 },
  chip: { backgroundColor: '#1E1E1E', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#333', justifyContent: 'center' },
  chipActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  chipText: { color: '#AAA', fontSize: 12, fontWeight: 'bold' },
  chipTextActive: { color: '#000' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 5 },
  gridChip: { backgroundColor: '#1E1E1E', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: '#333' },

  saveBtn: { backgroundColor: '#FFD700', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 30 },
  saveBtnText: { color: '#000', fontSize: 18, fontWeight: 'bold' }
});