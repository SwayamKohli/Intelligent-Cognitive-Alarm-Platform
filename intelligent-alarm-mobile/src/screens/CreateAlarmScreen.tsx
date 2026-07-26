import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../lib/api';
import { colors, radius, spacing, typography } from '../theme';

const CHALLENGE_OPTIONS = ['math', 'memory', 'pattern', 'logic', 'word_scramble', 'riddle', 'quiz'];
const ALARM_TYPE_OPTIONS = ['one_time', 'daily', 'weekday', 'weekend', 'smart_adaptive'];

export default function CreateAlarmScreen({ navigation }: any) {
  const [time, setTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');
  const [label, setLabel] = useState('');

  // Multi-select, matching web: joined into a comma string, or null for "allow all"
  const [preferredChallenges, setPreferredChallenges] = useState<string[]>([]);
  const [alarmType, setAlarmType] = useState('daily');
  const [saving, setSaving] = useState(false);

  const toggleChallenge = (challenge: string) => {
    setPreferredChallenges((prev) =>
      prev.includes(challenge) ? prev.filter((c) => c !== challenge) : [...prev, challenge]
    );
  };

  const onChangeTime = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (selectedDate) setTime(selectedDate);
  };

  const handleCreateAlarm = async () => {
    setSaving(true);
    try {
      const hours = time.getHours().toString().padStart(2, '0');
      const minutes = time.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}:00`;

      const payload = {
        time: timeString,
        label: label || 'Cognitive Alarm',
        alarm_type: alarmType,
        preferred_challenges: preferredChallenges.length > 0 ? preferredChallenges.join(',') : null,
        is_active: true,
        snooze_enabled: true,
        snooze_limit: 3,
      };

      await api.post('/alarms/', payload);
      navigation.goBack();
    } catch (error: any) {
      console.error('Failed to create alarm:', error.response?.data || error.message);
      Alert.alert('Error', 'Could not save the alarm.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.header}>New Alarm</Text>

      <View style={styles.timePickerContainer}>
        {Platform.OS === 'android' && (
          <TouchableOpacity style={styles.androidTimeBtn} onPress={() => setShowPicker(true)}>
            <Text style={styles.androidTimeText}>
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
        )}

        {(showPicker || Platform.OS === 'ios') && (
          <DateTimePicker
            value={time}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onChangeTime}
            themeVariant="dark"
          />
        )}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Alarm label (e.g. Morning Run)"
        placeholderTextColor={colors.textDim}
        value={label}
        onChangeText={setLabel}
      />

      <Text style={styles.subHeader}>Recurrence</Text>
      <View style={styles.scrollWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
          {ALARM_TYPE_OPTIONS.map((type) => {
            const active = alarmType === type;
            return (
              <TouchableOpacity
                key={type}
                style={[styles.typeButton, active && styles.typeButtonActive]}
                onPress={() => setAlarmType(type)}
              >
                <Text style={[styles.typeText, active && styles.typeTextActive]}>
                  {type.replace('_', ' ').toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <Text style={styles.subHeader}>Allowed Challenges</Text>
      <Text style={styles.subText}>Leave all unselected to allow every challenge type</Text>
      <View style={styles.chipGrid}>
        {CHALLENGE_OPTIONS.map((type) => {
          const active = preferredChallenges.includes(type);
          return (
            <TouchableOpacity
              key={type}
              style={[styles.gridChip, active && styles.typeButtonActive]}
              onPress={() => toggleChallenge(type)}
            >
              <Text style={[styles.typeText, active && styles.typeTextActive]}>
                {type.replace('_', ' ').toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.7 }]}
          onPress={handleCreateAlarm}
          disabled={saving}
        >
          <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save Alarm'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  header: { ...typography.h1, marginTop: 40, marginBottom: spacing.lg },
  subHeader: { ...typography.h2, fontSize: 15, marginTop: spacing.md, marginBottom: spacing.sm },
  subText: { ...typography.caption, marginBottom: spacing.sm },

  timePickerContainer: { alignItems: 'center', marginVertical: 10 },
  androidTimeBtn: {
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  androidTimeText: { color: colors.textHigh, fontSize: 30, fontWeight: '700' },

  input: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    color: colors.textHigh,
    padding: 15,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
    marginBottom: 10,
  },

  scrollWrapper: { height: 50, marginBottom: 10 },
  scrollContainer: { alignItems: 'center' },
  typeButton: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeButtonActive: { backgroundColor: colors.accentBg, borderColor: colors.accentBorder },
  typeText: { color: colors.textDim, fontWeight: '700', fontSize: 11 },
  typeTextActive: { color: colors.accent },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  gridChip: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg, marginBottom: 20 },
  cancelButton: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    marginRight: 10,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  cancelText: { color: colors.textHigh, fontWeight: '700', fontSize: 15 },
  saveButton: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    marginLeft: 10,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
  },
  saveText: { color: '#0A0A0B', fontWeight: '700', fontSize: 15 },
});