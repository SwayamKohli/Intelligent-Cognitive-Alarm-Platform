import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Animated } from 'react-native';
import { Audio } from 'expo-av';
import { AlarmClock, Moon } from 'lucide-react-native';
import api from '../lib/api';
import { colors, radius, spacing, typography } from '../theme';

export default function RingingScreen({ route, navigation }: any) {
  const { alarmId, label } = route.params;

  const [challenge, setChallenge] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [streakState, setStreakState] = useState({ current: 0, target: 1 });
  const [timeLeft, setTimeLeft] = useState(60);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const soundRef = useRef<Audio.Sound | null>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    playAlarmSound();
    fetchChallenge();
    return () => {
      stopAlarmSound();
    };
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const playAlarmSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/alarm-sound.mp3'),
        { shouldPlay: true, isLooping: true, volume: 1.0 }
      );
      soundRef.current = sound;
    } catch (error) {
      console.error('Error loading alarm sound', error);
    }
  };

  const stopAlarmSound = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  };

  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const fetchChallenge = async () => {
    try {
      setLoading(true);
      setAnswer('');
      setFeedback(null);
      setTimeLeft(60);

      const response = await api.get('/challenges/next', {
        params: { alarm_id: alarmId, challenge_type: 'random' },
      });

      setChallenge(response.data);
      if (response.data.streak_state) {
        setStreakState(response.data.streak_state);
      }
    } catch (error) {
      console.error('Failed to fetch challenge:', error);
      Alert.alert('Error', 'Could not load challenge.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!answer.trim() || submitting) return;
    setSubmitting(true);
    setFeedback(null);

    try {
      const response = await api.post('/challenges/verify', {
        alarm_id: alarmId,
        answer: answer.trim(),
      });

      const { success, dismiss_alarm, current_streak, target_streak } = response.data;
      setStreakState({ current: current_streak, target: target_streak });

      if (success) {
        if (dismiss_alarm) {
          setFeedback({ type: 'success', message: 'Alarm dismissed. Great job!' });
          await stopAlarmSound();
          setTimeout(() => navigation.goBack(), 700);
        } else {
          setFeedback({ type: 'success', message: `Correct! Streak ${current_streak}/${target_streak}` });
          fetchChallenge();
        }
      } else {
        triggerShake();
        setFeedback({ type: 'error', message: 'Not quite — try again.' });
        setAnswer('');
      }
    } catch (error) {
      console.error('Verification failed:', error);
      setFeedback({ type: 'error', message: 'Network error — keep trying.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSnooze = async () => {
    try {
      await api.post('/alarms/snooze', { alarm_id: alarmId });
      await stopAlarmSound();
      navigation.goBack();
    } catch (error: any) {
      if (error.response?.status === 400) {
        setFeedback({ type: 'error', message: 'Snooze limit reached — solve the challenge now.' });
      } else {
        console.error('Snooze failed:', error);
        setFeedback({ type: 'error', message: 'Could not snooze right now.' });
      }
    }
  };

  const renderChallengeContent = () => {
    if (!challenge || !challenge.content) {
      return <Text style={styles.challengePrompt}>Loading…</Text>;
    }

    const { challenge_type, content } = challenge;

    switch (challenge_type) {
      case 'word_scramble':
        return (
          <View>
            <Text style={styles.challengePrompt}>{content.prompt}</Text>
            <Text style={styles.scrambledWord}>{content.scrambled_word}</Text>
          </View>
        );
      case 'quiz':
      case 'logic':
        return (
          <View>
            <Text style={styles.challengePrompt}>{content.prompt}</Text>
            {content.options?.map((opt: string, idx: number) => (
              <Text key={idx} style={styles.optionText}>
                {idx + 1}. {opt}
              </Text>
            ))}
          </View>
        );
      case 'memory':
        return (
          <View>
            <Text style={styles.challengePrompt}>{content.prompt}</Text>
            <Text style={styles.scrambledWord}>{content.sequence?.join(' ')}</Text>
          </View>
        );
      default:
        return <Text style={styles.challengePrompt}>{content.prompt}</Text>;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.glowRing} />

      <View style={styles.headerRow}>
        <View style={styles.labelRow}>
          <AlarmClock color={colors.accent} size={22} strokeWidth={2} />
          <Text style={styles.alarmLabel}>{label || 'Wake up'}</Text>
        </View>
        <View style={[styles.timerPill, timeLeft <= 10 && styles.timerUrgent]}>
          <Text style={[styles.timerText, timeLeft <= 10 && styles.timerTextUrgent]}>{timeLeft}s</Text>
        </View>
      </View>

      <Text style={styles.streakText}>
        Challenge {streakState.current + 1} of {streakState.target}
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.accent} style={{ marginVertical: 30 }} />
      ) : (
        <Animated.View style={[styles.challengeBox, { transform: [{ translateX: shakeAnim }] }]}>
          {renderChallengeContent()}
        </Animated.View>
      )}

      <TextInput
        style={styles.input}
        placeholder="Enter your answer"
        placeholderTextColor={colors.textDim}
        value={answer}
        onChangeText={setAnswer}
        autoCapitalize="none"
        editable={!loading && !submitting}
      />

      {feedback && (
        <View style={[styles.feedbackBox, feedback.type === 'error' ? styles.feedbackError : styles.feedbackSuccess]}>
          <Text style={[styles.feedbackText, feedback.type === 'error' ? styles.feedbackErrorText : styles.feedbackSuccessText]}>
            {feedback.message}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.verifyButton, (submitting || loading) && styles.disabledButton]}
        onPress={handleVerify}
        disabled={submitting || loading}
      >
        <Text style={styles.verifyText}>{submitting ? 'Checking…' : 'Submit'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.snoozeButton} onPress={handleSnooze}>
        <Moon color={colors.textHigh} size={16} />
        <Text style={styles.snoozeText}>Snooze</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowRing: {
    position: 'absolute',
    top: '20%',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.accentGlow,
    opacity: 0.12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.sm,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alarmLabel: { ...typography.h1, fontSize: 24 },
  timerPill: {
    backgroundColor: colors.accentBg,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  timerUrgent: { backgroundColor: colors.emberBg, borderColor: 'rgba(255,122,69,0.4)' },
  timerText: { color: colors.accent, fontSize: 15, fontWeight: '700' },
  timerTextUrgent: { color: colors.ember },

  streakText: { ...typography.caption, marginBottom: spacing.lg, fontWeight: '600' },

  challengeBox: {
    backgroundColor: colors.bgCard,
    padding: spacing.lg,
    borderRadius: radius.xl,
    marginBottom: spacing.lg,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  challengePrompt: { fontSize: 18, fontWeight: '600', color: colors.textHigh, textAlign: 'center', marginBottom: 10 },
  scrambledWord: { fontSize: 30, fontWeight: '800', color: colors.accent, letterSpacing: 5, textAlign: 'center', marginTop: 8 },
  optionText: { fontSize: 15, color: colors.text, marginTop: 6 },

  input: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    color: colors.textHigh,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    borderRadius: radius.md,
    fontSize: 17,
    width: '100%',
    marginBottom: spacing.md,
    textAlign: 'center',
    fontWeight: '600',
  },

  feedbackBox: {
    width: '100%',
    borderRadius: radius.sm,
    padding: 10,
    marginBottom: spacing.md,
  },
  feedbackError: { backgroundColor: colors.emberBg },
  feedbackSuccess: { backgroundColor: colors.accentBg },
  feedbackText: { fontSize: 13, textAlign: 'center', fontWeight: '600' },
  feedbackErrorText: { color: colors.ember },
  feedbackSuccessText: { color: colors.accent },

  verifyButton: {
    backgroundColor: colors.accent,
    padding: 18,
    borderRadius: radius.lg,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  disabledButton: { backgroundColor: colors.textDim },
  verifyText: { color: '#0A0A0B', fontSize: 16, fontWeight: '700' },

  snoozeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: 15,
    borderRadius: radius.lg,
    width: '100%',
  },
  snoozeText: { color: colors.textHigh, fontSize: 15, fontWeight: '600' },
});