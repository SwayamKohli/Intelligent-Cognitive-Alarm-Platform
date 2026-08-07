import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import {
  AlarmClock,
  LogOut,
  Users,
  Activity,
  PauseCircle,
} from "lucide-react-native";
import api from "../lib/api";
import { colors, radius, spacing, typography } from "../theme";

function tierColor(rate: number) {
  if (rate > 40) return { bg: colors.emberBg, text: colors.ember };
  if (rate > 20) return { bg: colors.accentBg, text: colors.accent };
  return { bg: colors.successBg, text: colors.success };
}

export default function AdminScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const { data } = await api.get("/admin/metrics");
      setMetrics(data);
    } catch (error) {
      console.error("Admin fetch error:", error);
      Alert.alert("Access Denied", "Could not load admin metrics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("access_token");
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  const statCards = [
    {
      icon: Users,
      label: "Total Registered Users",
      value: metrics?.user_growth?.total_registered ?? 0,
    },
    {
      icon: Activity,
      label: "Daily Active Users",
      value: metrics?.user_growth?.active_daily ?? 0,
    },
    {
      icon: PauseCircle,
      label: "Average Active Snoozes",
      value: metrics?.global_snooze?.average_active_snoozes ?? 0,
    },
    {
      icon: AlarmClock,
      label: "Total Active Alarms",
      value: metrics?.global_snooze?.total_active_alarms ?? 0,
    },
  ];

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading admin console…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 60 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchMetrics(true)}
          tintColor={colors.accent}
        />
      }
    >
      <View style={styles.headerRow}>
        <Text style={styles.header}>Admin Console</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut color={colors.ember} size={18} />
        </TouchableOpacity>
      </View>

      <Text style={styles.subHeader}>Platform Overview</Text>

      <View style={styles.grid}>
        {statCards.map((card) => (
          <View key={card.label} style={styles.card}>
            <card.icon color={colors.accent} size={18} strokeWidth={1.75} />
            <Text style={styles.cardLabel}>{card.label}</Text>
            <Text style={styles.cardValue}>{card.value}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.subHeader, { marginTop: spacing.lg }]}>
        Engine Failure Rates
      </Text>
      <View style={styles.tableCard}>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 2 }]}>Engine</Text>
          <Text style={styles.th}>Att</Text>
          <Text style={styles.th}>Fail</Text>
          <Text style={styles.th}>Rate</Text>
        </View>

        {!metrics?.engine_failure_rates?.length ? (
          <Text style={styles.emptyText}>No engine telemetry available.</Text>
        ) : (
          metrics.engine_failure_rates.map((e: any, index: number) => {
            const tier = tierColor(e.failure_rate_percentage);
            return (
              <View key={index} style={styles.tableRow}>
                <Text
                  style={[
                    styles.td,
                    { flex: 2, fontWeight: "700", textAlign: "left" },
                  ]}
                >
                  {e.engine}
                </Text>
                <Text style={styles.td}>{e.attempts}</Text>
                <Text style={styles.td}>{e.failures}</Text>
                <View style={[styles.rateBadge, { backgroundColor: tier.bg }]}>
                  <Text style={[styles.rateBadgeText, { color: tier.text }]}>
                    {e.failure_rate_percentage}%
                  </Text>
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
  centerContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { ...typography.caption, marginTop: 15 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 40,
    marginBottom: 10,
  },
  header: { ...typography.h1, fontSize: 24 },
  logoutBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.emberBg,
    alignItems: "center",
    justifyContent: "center",
  },
  subHeader: { ...typography.h2, marginBottom: spacing.sm + 4 },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  card: {
    width: "48%",
    backgroundColor: colors.bgCard,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  cardLabel: { color: colors.textDim, fontSize: 12 },
  cardValue: { color: colors.textHigh, fontSize: 24, fontWeight: "700" },

  tableCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md - 1,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 10,
    marginBottom: 10,
  },
  th: {
    flex: 1,
    color: colors.textDim,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
  },
  td: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    textAlign: "center",
    textTransform: "capitalize",
  },
  rateBadge: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginHorizontal: 4,
  },
  rateBadgeText: { fontSize: 12, fontWeight: "700" },
  emptyText: { color: colors.textDim, textAlign: "center", marginVertical: 20 },
});
