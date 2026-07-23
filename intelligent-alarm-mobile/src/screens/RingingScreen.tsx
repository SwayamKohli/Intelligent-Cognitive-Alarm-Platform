import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import api from '../lib/api';

export default function RingingScreen({ route, navigation }: any) {
  const { alarmId, label } = route.params;
  
  const [challenge, setChallenge] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [streakState, setStreakState] = useState({ current: 0, target: 1 });
  
  //  Add Timer State
  const [timeLeft, setTimeLeft] = useState(60);
  
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    playAlarmSound();
    fetchChallenge();
    return () => { stopAlarmSound(); };
  }, []);

  //  Timer logic
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
      console.error("Error loading alarm sound", error);
    }
  };

  const stopAlarmSound = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  };

  const fetchChallenge = async () => {
    try {
      setLoading(true);
      setAnswer('');
      setTimeLeft(60); // Reset timer for new challenge
      
      const response = await api.get('/challenges/next', {
        params: { alarm_id: alarmId, challenge_type: 'random' }
      });
      
      setChallenge(response.data);
      if (response.data.streak_state) {
        setStreakState(response.data.streak_state);
      }
    } catch (error) {
      console.error("Failed to fetch challenge:", error);
      Alert.alert("Error", "Could not load challenge.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!answer.trim() || submitting) return;
    setSubmitting(true);

    try {
      const response = await api.post('/challenges/verify', {
        alarm_id: alarmId,
        answer: answer.trim() 
      });

      const { success, dismiss_alarm, current_streak, target_streak } = response.data;
      setStreakState({ current: current_streak, target: target_streak });

      if (success) {
        if (dismiss_alarm) {
          await stopAlarmSound();
          Alert.alert("Great Job!", "Alarm dismissed.");
          navigation.goBack(); 
        } else {
          fetchChallenge();
        }
      } else {
        Alert.alert("Incorrect", "Try again!");
        setAnswer('');
      }
    } catch (error) {
      console.error("Verification failed:", error);
      Alert.alert("Network Error", "Keep trying!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSnooze = async () => {
    try {
      await api.post('/alarms/snooze', { alarm_id: alarmId });
      await stopAlarmSound();
      Alert.alert("Snoozed", "I'll be back in 5 minutes...");
      navigation.goBack();
    } catch (error: any) {
      if (error.response?.status === 400) {
        Alert.alert("Snooze Limit Reached!", "You must solve the challenge now.");
      } else {
        console.error("Snooze failed:", error);
      }
    }
  };

  //  Dynamic Rendering based on the ML Engine's payload structure
  const renderChallengeContent = () => {
    if (!challenge || !challenge.content) return <Text style={styles.challengePrompt}>Loading...</Text>;

    const { challenge_type, content } = challenge;

    switch (challenge_type) {
      case "word_scramble":
        return (
          <View>
            <Text style={styles.challengePrompt}>{content.prompt}</Text>
            <Text style={styles.scrambledWord}>{content.scrambled_word}</Text>
          </View>
        );
      case "quiz":
      case "logic":
        return (
          <View>
            <Text style={styles.challengePrompt}>{content.prompt}</Text>
            {content.options?.map((opt: string, idx: number) => (
              <Text key={idx} style={styles.optionText}>{idx + 1}. {opt}</Text>
            ))}
          </View>
        );
      default:
        // Math, Pattern, Riddle all use the standard prompt
        return <Text style={styles.challengePrompt}>{content.prompt}</Text>;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.alarmLabel}>{label || "WAKE UP!"}</Text>
        <View style={[styles.timerPill, timeLeft <= 10 && styles.timerUrgent]}>
          <Text style={styles.timerText}>{timeLeft}s</Text>
        </View>
      </View>
      
      <Text style={styles.streakText}>
        Challenge {streakState.current + 1} of {streakState.target}
      </Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#FFD700" style={{ marginVertical: 30 }} />
      ) : (
        <View style={styles.challengeBox}>
          {renderChallengeContent()}
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="Enter your answer..."
        placeholderTextColor="#888"
        value={answer}
        onChangeText={setAnswer}
        keyboardType="default"
        autoCapitalize="none"
        editable={!loading && !submitting}
      />

      <TouchableOpacity 
        style={[styles.verifyButton, (submitting || loading) && styles.disabledButton]} 
        onPress={handleVerify}
        disabled={submitting || loading}
      >
        <Text style={styles.verifyText}>{submitting ? "CHECKING..." : "VERIFY ANSWER"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.snoozeButton} onPress={handleSnooze}>
        <Text style={styles.snoozeText}>Snooze (5 min)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#8B0000', padding: 20, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 10 },
  alarmLabel: { fontSize: 32, fontWeight: 'bold', color: '#FFF' },
  timerPill: { backgroundColor: '#333', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  timerUrgent: { backgroundColor: '#FF5252' },
  timerText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  
  streakText: { fontSize: 18, color: '#FFD700', marginBottom: 20, fontWeight: 'bold' },
  
  challengeBox: { backgroundColor: '#1E1E1E', padding: 30, borderRadius: 15, marginBottom: 30, width: '100%', alignItems: 'center', borderWidth: 2, borderColor: '#FFD700' },
  challengePrompt: { fontSize: 24, fontWeight: 'bold', color: '#FFF', textAlign: 'center', marginBottom: 10 },
  scrambledWord: { fontSize: 32, fontWeight: '900', color: '#FF5252', letterSpacing: 5, textAlign: 'center' },
  optionText: { fontSize: 18, color: '#AAA', marginTop: 5 },
  
  input: { backgroundColor: '#FFF', color: '#000', padding: 20, borderRadius: 10, fontSize: 20, width: '100%', marginBottom: 30, textAlign: 'center', fontWeight: 'bold' },
  
  verifyButton: { backgroundColor: '#FFD700', padding: 20, borderRadius: 10, width: '100%', alignItems: 'center', marginBottom: 20 },
  disabledButton: { backgroundColor: '#888' },
  verifyText: { color: '#000', fontSize: 20, fontWeight: 'bold' },
  
  snoozeButton: { backgroundColor: '#555', padding: 15, borderRadius: 10, width: '100%', alignItems: 'center' },
  snoozeText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});