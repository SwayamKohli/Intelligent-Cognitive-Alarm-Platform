import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Moon, Sunrise, Flame, Zap } from 'lucide-react-native';
import api from '../lib/api';
import { colors, radius, spacing, typography } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const BADGES = [
  { key: 'sleep', label: 'Sleep', Icon: Moon },
  { key: 'wake_up', label: 'Wake Up', Icon: Sunrise },
  { key: 'habit', label: 'Habit', Icon: Flame },
  { key: 'productivity', label: 'Productivity', Icon: Zap },
];

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [habitData, setHabitData] = useState<any>(null);
  const [recommendations, setRecommendations] = useState({
    sleep: 'Loading suggestions…',
    wake_up: 'Loading suggestions…',
    habit: 'Loading suggestions…',
    productivity: 'Loading suggestions…',
  });

  const animatedProgress = useRef(new Animated.Value(CIRCUMFERENCE)).current;

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);

      const [scoreRes, recsRes] = await Promise.all([
        api.get('/analytics/habit-score'),
        api.get('/analytics/recommendations'),
      ]);

      setHabitData(scoreRes.data);
      
      if (recsRes.data) {
        const safeExtract = (item: any) => {
          if (typeof item === 'object' && item !== null) {
            return item.advice || JSON.stringify(item);
          }
          return typeof item === 'string' ? item : 'No suggestions available.';
        };

        setRecommendations({
          sleep: safeExtract(recsRes.data.sleep),
          wake_up: safeExtract(recsRes.data.wake_up),
          habit: safeExtract(recsRes.data.habit),
          productivity: safeExtract(recsRes.data.productivity),
        });
      }

      const score = scoreRes.data?.habit_score ?? scoreRes.data?.overall_score ?? scoreRes.data?.score ?? 0;
      const offset = CIRCUMFERENCE - (Math.min(score, 100) / 100) * CIRCUMFERENCE;
      Animated.timing(animatedProgress, {
        toValue: offset,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const overallScore = habitData?.habit_score ?? habitData?.overall_score ?? habitData?.score ?? 0;

  const statusLabel =
    overallScore >= 80
      ? 'Excellent consistency'
      : overallScore >= 60
      ? 'Good progress — keep going'
      : "Let's build your routine";

  const breakdownRows = [
    { key: 'consistency', label: 'Consistency', weight: '35%' },
    { key: 'challenge_rate', label: 'Challenge Success', weight: '25%' },
    { key: 'snooze_reduction', label: 'Snooze Reduction', weight: '20%' },
    { key: 'sleep_adherence', label: 'Sleep Adherence', weight: '20%' },
  ];

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Analyzing sleep and telemetry data…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 60 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => fetchAnalytics(true)} tintColor={colors.accent} />
      }
    >
      <Text style={styles.header}>Analytics</Text>

      <View style={styles.scoreCard}>
        <Text style={styles.cardTitle}>Overall Habit Score</Text>

        <View style={styles.ringWrapper}>
          <Svg width={130} height={130} viewBox="0 0 130 130">
            <Circle cx="65" cy="65" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <AnimatedCircle
              cx="65"
              cy="65"
              r={RADIUS}
              fill="none"
              stroke={colors.accent}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={animatedProgress}
              rotation="-90"
              origin="65, 65"
            />
          </Svg>
          <View style={styles.ringCenter}>
            <Text style={styles.scoreValue}>{Math.round(overallScore)}</Text>
            <Text style={styles.scoreOutOf}>/ 100</Text>
          </View>
        </View>

        <Text style={styles.scoreSubText}>{statusLabel}</Text>

        <View style={styles.breakdownContainer}>
          {breakdownRows.map((row) => (
            <View key={row.key} style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>
                {row.label} ({row.weight})
              </Text>
              <Text style={styles.breakdownVal}>{habitData?.[row.key] ?? 0}%</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Achievements</Text>
      <View style={styles.badgeGrid}>
        {BADGES.map(({ key, label, Icon }) => (
          <View key={key} style={styles.badgeCard}>
            <Icon color={colors.accent} size={24} strokeWidth={1.75} />
            <Text style={styles.badgeText}>{label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>AI Coaching Insights</Text>

      <View style={styles.recCard}>
        <View style={styles.recHeaderRow}>
          <Moon color={colors.accent} size={16} />
          <Text style={styles.recHeader}>Sleep Routine</Text>
        </View>
        <Text style={styles.recBody}>{recommendations.sleep}</Text>
      </View>

      <View style={styles.recCard}>
        <View style={styles.recHeaderRow}>
          <Sunrise color={colors.accent} size={16} />
          <Text style={styles.recHeader}>Morning Momentum</Text>
        </View>
        <Text style={styles.recBody}>{recommendations.wake_up}</Text>
      </View>

      <View style={styles.recCard}>
        <View style={styles.recHeaderRow}>
          <Flame color={colors.accent} size={16} />
          <Text style={styles.recHeader}>Habit Consistency</Text>
        </View>
        <Text style={styles.recBody}>{recommendations.habit}</Text>
      </View>

      <View style={styles.recCard}>
        <View style={styles.recHeaderRow}>
          <Zap color={colors.accent} size={16} />
          <Text style={styles.recHeader}>Daily Productivity</Text>
        </View>
        <Text style={styles.recBody}>{recommendations.productivity}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  centerContainer: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' },
  loadingText: { ...typography.caption, marginTop: 15 },
  header: { ...typography.h1, marginTop: 40, marginBottom: spacing.lg },
  sectionTitle: { ...typography.h2, fontSize: 17, marginTop: spacing.lg, marginBottom: spacing.sm + 4 },

  scoreCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cardTitle: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  ringWrapper: {
    width: 130,
    height: 130,
    marginVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: { color: colors.textHigh, fontSize: 32, fontWeight: '800' },
  scoreOutOf: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  scoreSubText: { color: colors.text, fontSize: 14, textAlign: 'center', marginBottom: spacing.md, fontWeight: '500' },

  breakdownContainer: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm + 4,
    gap: 10,
  },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between' },
  breakdownLabel: { color: colors.textDim, fontSize: 13 },
  breakdownVal: { color: colors.textHigh, fontSize: 13, fontWeight: '700' },

  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  badgeCard: {
    width: '48%',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  badgeText: { color: colors.textHigh, fontSize: 13, fontWeight: '700' },

  recCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md + 2,
    marginBottom: spacing.sm + 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  recHeader: { color: colors.accent, fontSize: 14, fontWeight: '700' },
  recBody: { color: colors.text, fontSize: 14, lineHeight: 20 },
});