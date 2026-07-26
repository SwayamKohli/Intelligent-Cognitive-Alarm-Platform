import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, ActivityIndicator, 
  RefreshControl, TouchableOpacity 
} from 'react-native';
import api from '../lib/api';

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [habitData, setHabitData] = useState<any>(null);
  const [recommendations, setRecommendations] = useState({
    sleep: "Loading suggestions...",
    wake_up: "Loading suggestions...",
    habit: "Loading suggestions...",
    productivity: "Loading suggestions..."
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Fetch Habit Score & Llama-3.1 Recommendations simultaneously
      const [scoreRes, recsRes] = await Promise.all([
        api.get('/analytics/habit-score'),
        api.get('/analytics/recommendations')
      ]);

      setHabitData(scoreRes.data);
      if (recsRes.data) {
        setRecommendations(recsRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchAnalytics(true);
  };

  // Safe fallback matching SD's API schema
  const overallScore = habitData?.habit_score ?? habitData?.overall_score ?? habitData?.score ?? 0;

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Analyzing Sleep & Telemetry Data...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={{ paddingBottom: 60 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD700" />
      }
    >
      <Text style={styles.header}>Analytics Dashboard</Text>

      {/* 📊 OVERALL HABIT SCORE CARD */}
      <View style={styles.scoreCard}>
        <Text style={styles.cardTitle}>Overall Habit Score</Text>
        <View style={styles.scoreRing}>
          <Text style={styles.scoreText}>{overallScore}%</Text>
        </View>
        <Text style={styles.scoreSubText}>
          {overallScore >= 80 ? "🔥 Excellent consistency! Keep it up." : 
           overallScore >= 60 ? "📈 Good progress. Build your routine." : 
           "⚠️ Let's focus on reducing morning snoozes."}
        </Text>

        {/* Weighted Pillar Breakdown */}
        <View style={styles.breakdownContainer}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Consistency (35%)</Text>
            <Text style={styles.breakdownVal}>{habitData?.consistency ?? 0}%</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Challenge Success (25%)</Text>
            <Text style={styles.breakdownVal}>{habitData?.challenge_rate ?? 0}%</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Snooze Reduction (20%)</Text>
            <Text style={styles.breakdownVal}>{habitData?.snooze_reduction ?? 0}%</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Sleep Adherence (20%)</Text>
            <Text style={styles.breakdownVal}>{habitData?.sleep_adherence ?? 0}%</Text>
          </View>
        </View>
      </View>

      {/* 🏆 ACHIEVEMENTS / BADGES GRID */}
      <Text style={styles.sectionTitle}>Achievements</Text>
      <View style={styles.badgeGrid}>
        <View style={styles.badgeCard}>
          <Text style={styles.badgeIcon}>😴</Text>
          <Text style={styles.badgeText}>Sleep</Text>
        </View>
        <View style={styles.badgeCard}>
          <Text style={styles.badgeIcon}>🌅</Text>
          <Text style={styles.badgeText}>Wake Up</Text>
        </View>
        <View style={styles.badgeCard}>
          <Text style={styles.badgeIcon}>🔥</Text>
          <Text style={styles.badgeText}>Habit</Text>
        </View>
        <View style={styles.badgeCard}>
          <Text style={styles.badgeIcon}>⚡</Text>
          <Text style={styles.badgeText}>Productivity</Text>
        </View>
      </View>

      {/* 🤖 GROQ LLAMA-3.1 RECOMMENDATIONS */}
      <Text style={styles.sectionTitle}>AI Coaching Insights</Text>
      
      <View style={styles.recCard}>
        <Text style={styles.recHeader}>😴 Sleep Routine</Text>
        <Text style={styles.recBody}>{recommendations.sleep}</Text>
      </View>

      <View style={styles.recCard}>
        <Text style={styles.recHeader}>🌅 Morning Momentum</Text>
        <Text style={styles.recBody}>{recommendations.wake_up}</Text>
      </View>

      <View style={styles.recCard}>
        <Text style={styles.recHeader}>🔥 Habit Consistency</Text>
        <Text style={styles.recBody}>{recommendations.habit}</Text>
      </View>

      <View style={styles.recCard}>
        <Text style={styles.recHeader}>⚡ Daily Productivity</Text>
        <Text style={styles.recBody}>{recommendations.productivity}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  centerContainer: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#888', marginTop: 15, fontSize: 14 },
  header: { fontSize: 32, fontWeight: 'bold', color: '#FFD700', marginTop: 40, marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginTop: 20, marginBottom: 12 },
  
  scoreCard: { backgroundColor: '#1E1E1E', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  cardTitle: { color: '#AAA', fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  scoreRing: { width: 130, height: 130, borderRadius: 65, borderWidth: 6, borderColor: '#FFD700', justifyContent: 'center', alignItems: 'center', marginVertical: 16, backgroundColor: 'rgba(255, 215, 0, 0.05)' },
  scoreText: { color: '#FFD700', fontSize: 36, fontWeight: '900' },
  scoreSubText: { color: '#FFF', fontSize: 14, textAlign: 'center', marginBottom: 20, fontWeight: '500' },

  breakdownContainer: { width: '100%', borderTopWidth: 1, borderTopColor: '#2C2C2C', paddingTop: 15, gap: 8 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between' },
  breakdownLabel: { color: '#888', fontSize: 13 },
  breakdownVal: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },

  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  badgeCard: { width: '48%', backgroundColor: '#1E1E1E', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  badgeIcon: { fontSize: 32, marginBottom: 8 },
  badgeText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },

  recCard: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#333' },
  recHeader: { color: '#FFD700', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  recBody: { color: '#DDD', fontSize: 14, lineHeight: 20 }
});