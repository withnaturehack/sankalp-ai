import React, { useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, Animated, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

const CAT_META: Record<string, { label: string; icon: string; color: string }> = {
  pothole:     { label: "Pothole",     icon: "🕳️", color: "#F59E0B" },
  garbage:     { label: "Garbage",     icon: "🗑️", color: "#EF4444" },
  streetlight: { label: "Streetlight", icon: "💡", color: "#FCD34D" },
  water:       { label: "Water",       icon: "💧", color: "#3B82F6" },
  drain:       { label: "Drain",       icon: "🌊", color: "#06B6D4" },
  electricity: { label: "Electricity", icon: "⚡", color: "#8B5CF6" },
  tree:        { label: "Tree",        icon: "🌳", color: "#22C55E" },
  other:       { label: "Other",       icon: "📍", color: "#6B7280" },
};

const BADGE_META: Record<string, { icon: string; color: string }> = {
  new_citizen:    { icon: "🌱", color: "#22C55E" },
  active_citizen: { icon: "⭐", color: "#F59E0B" },
  civic_hero:     { icon: "🦸", color: "#8B5CF6" },
  city_champion:  { icon: "🏆", color: "#EF4444" },
  first_report:   { icon: "📋", color: "#3B82F6" },
  system_admin:   { icon: "⚙️",  color: "#06B6D4" },
};

function AnimatedBar({ pct, color, delay = 0 }: { pct: number; color: string; delay?: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: pct, duration: 900, delay, useNativeDriver: false }).start();
  }, [pct]);
  return (
    <View style={{ flex: 1, height: 8, backgroundColor: Colors.bg, borderRadius: 4, overflow: "hidden" }}>
      <Animated.View style={{ height: 8, backgroundColor: color, borderRadius: 4, width: anim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }) as any }} />
    </View>
  );
}

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { complaints, wards, workers, leaderboard } = useApp();

  const total = complaints.length || 1;
  const resolved = complaints.filter(c => c.status === "resolved" || c.status === "closed").length;
  const pending = complaints.filter(c => c.status === "pending").length;
  const inProgress = complaints.filter(c => c.status === "in_progress").length;
  const resolutionRate = Math.round((resolved / total) * 100);

  // Category breakdown
  const catData = Object.entries(CAT_META).map(([key, meta]) => {
    const count = complaints.filter(c => c.category === key).length;
    return { key, ...meta, count, pct: Math.round((count / total) * 100) };
  }).sort((a, b) => b.count - a.count);

  // Priority breakdown
  const priorities = [
    { key: "P1", label: "Critical", color: "#EF4444" },
    { key: "P2", label: "High",     color: "#F59E0B" },
    { key: "P3", label: "Medium",   color: "#3B82F6" },
    { key: "P4", label: "Low",      color: "#6B7280" },
  ].map(p => ({ ...p, count: complaints.filter(c => c.priority === p.key).length, pct: Math.round((complaints.filter(c => c.priority === p.key).length / total) * 100) }));

  const avgAiScore = Math.round(complaints.reduce((s, c) => s + c.aiScore, 0) / total);
  const clusters = complaints.filter(c => c.isCluster).length;
  const rated = complaints.filter(c => c.rating);
  const avgRating = rated.length ? (rated.reduce((s, c) => s + (c.rating || 0), 0) / rated.length).toFixed(1) : "N/A";

  const headerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: false }).start();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <Animated.View style={{ opacity: headerAnim, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Text style={styles.headerTitle}>Analytics</Text>
        <Text style={styles.headerSub}>{complaints.length} complaints analyzed</Text>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 90 }}>
        {/* Key metrics */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <LinearGradient colors={["#064E3B", "#047857"]} style={styles.metricGrad}>
              <Text style={styles.metricValue}>{resolutionRate}%</Text>
              <Text style={styles.metricLabel}>Resolution Rate</Text>
            </LinearGradient>
          </View>
          <View style={styles.metricCard}>
            <LinearGradient colors={["#1E1B4B", "#4338CA"]} style={styles.metricGrad}>
              <Text style={styles.metricValue}>{avgAiScore}%</Text>
              <Text style={styles.metricLabel}>Avg AI Score</Text>
            </LinearGradient>
          </View>
          <View style={styles.metricCard}>
            <LinearGradient colors={["#7C2D12", "#C2410C"]} style={styles.metricGrad}>
              <Text style={styles.metricValue}>{avgRating}⭐</Text>
              <Text style={styles.metricLabel}>Avg Rating</Text>
            </LinearGradient>
          </View>
          <View style={styles.metricCard}>
            <LinearGradient colors={["#1E3A5F", "#1D4ED8"]} style={styles.metricGrad}>
              <Text style={styles.metricValue}>{clusters}</Text>
              <Text style={styles.metricLabel}>Clusters</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Status breakdown */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pie-chart" size={16} color={Colors.green} />
            <Text style={styles.sectionTitle}>Status Breakdown</Text>
          </View>
          {[
            { label: "Resolved", count: resolved, color: "#22C55E", pct: Math.round(resolved / total * 100) },
            { label: "In Progress", count: inProgress, color: "#3B82F6", pct: Math.round(inProgress / total * 100) },
            { label: "Pending", count: pending, color: "#F59E0B", pct: Math.round(pending / total * 100) },
          ].map((s, i) => (
            <View key={s.label} style={styles.barRow}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: s.color, marginTop: 3 }} />
              <Text style={styles.barLabel}>{s.label}</Text>
              <AnimatedBar pct={s.pct} color={s.color} delay={i * 100} />
              <Text style={[styles.barPct, { color: s.color }]}>{s.pct}%</Text>
              <Text style={styles.barCount}>{s.count}</Text>
            </View>
          ))}
        </View>

        {/* Category breakdown */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bar-chart" size={16} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Category Distribution</Text>
          </View>
          {catData.map((cat, i) => (
            <View key={cat.key} style={styles.barRow}>
              <Text style={{ fontSize: 14, width: 24, textAlign: "center" }}>{cat.icon}</Text>
              <Text style={styles.barLabel}>{cat.label}</Text>
              <AnimatedBar pct={cat.pct} color={cat.color} delay={i * 80} />
              <Text style={[styles.barPct, { color: cat.color }]}>{cat.pct}%</Text>
              <Text style={styles.barCount}>{cat.count}</Text>
            </View>
          ))}
        </View>

        {/* Priority breakdown */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="alert-circle" size={16} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Priority Distribution</Text>
          </View>
          {priorities.map((p, i) => (
            <View key={p.key} style={styles.barRow}>
              <View style={[styles.priorityBadge, { backgroundColor: p.color + "22" }]}>
                <Text style={[styles.priorityText, { color: p.color }]}>{p.key}</Text>
              </View>
              <Text style={styles.barLabel}>{p.label}</Text>
              <AnimatedBar pct={p.pct} color={p.color} delay={i * 100} />
              <Text style={[styles.barPct, { color: p.color }]}>{p.pct}%</Text>
              <Text style={styles.barCount}>{p.count}</Text>
            </View>
          ))}
        </View>

        {/* Citizen Leaderboard */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trophy" size={16} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Citizen Leaderboard</Text>
          </View>
          {leaderboard.slice(0, 10).map(entry => (
            <View key={entry.rank} style={styles.leaderRow}>
              <View style={[styles.rankBadge, entry.rank <= 3 && { backgroundColor: "#F59E0B22", borderColor: "#F59E0B44" }]}>
                <Text style={[styles.rankNum, entry.rank <= 3 && { color: "#F59E0B" }]}>
                  {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : `#${entry.rank}`}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.leaderName}>{entry.name}</Text>
                <View style={{ flexDirection: "row", gap: 4, marginTop: 2 }}>
                  {entry.badges.slice(0, 3).map(b => (
                    <Text key={b} style={{ fontSize: 10 }}>{BADGE_META[b]?.icon || "🏅"}</Text>
                  ))}
                  <Text style={styles.leaderLevel}>Lvl {entry.level}</Text>
                </View>
              </View>
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsText}>{entry.points.toLocaleString()} pts</Text>
              </View>
            </View>
          ))}
          {leaderboard.length === 0 && (
            <Text style={styles.emptyText}>Leaderboard loading...</Text>
          )}
        </View>

        {/* Ward Health Leaderboard */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="map" size={16} color="#06B6D4" />
            <Text style={styles.sectionTitle}>Ward Health Rankings</Text>
          </View>
          {[...wards].sort((a, b) => b.healthScore - a.healthScore).map((ward, i) => {
            const color = ward.healthScore >= 70 ? "#22C55E" : ward.healthScore >= 50 ? "#F59E0B" : "#EF4444";
            return (
              <View key={ward.id} style={styles.wardRow}>
                <Text style={[styles.wardRank, { color: i < 3 ? "#F59E0B" : Colors.textMuted }]}>#{i + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.wardName}>{ward.name}</Text>
                  <Text style={styles.wardArea}>{ward.area} · {ward.totalComplaints} complaints</Text>
                </View>
                <View style={styles.wardBar}>
                  <View style={[styles.wardBarFill, { width: `${ward.healthScore}%` as any, backgroundColor: color }]} />
                </View>
                <Text style={[styles.wardScore, { color }]}>{ward.healthScore}</Text>
              </View>
            );
          })}
        </View>

        {/* Worker Rankings */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people" size={16} color="#8B5CF6" />
            <Text style={styles.sectionTitle}>Top Workers</Text>
          </View>
          {[...workers].sort((a, b) => b.score - a.score).slice(0, 8).map((w, i) => (
            <View key={w.id} style={styles.workerRow}>
              <Text style={[styles.workerRank, { color: i < 3 ? "#F59E0B" : Colors.textMuted }]}>#{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.workerName}>{w.name}</Text>
                <Text style={styles.workerWard}>{w.ward} · {w.resolvedToday} today</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.workerScore}>{w.score}</Text>
                <Text style={styles.workerRating}>⭐ {w.avgRating}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  headerTitle: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold" },
  headerSub: { color: Colors.textMuted, fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  metricCard: { width: "47%", borderRadius: 14, overflow: "hidden" },
  metricGrad: { padding: 16 },
  metricValue: { color: "#fff", fontSize: 28, fontFamily: "Inter_700Bold" },
  metricLabel: { color: "rgba(255,255,255,0.6)", fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4 },
  sectionCard: { marginHorizontal: 16, backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitle: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 5 },
  barLabel: { color: "#D1D5DB", fontSize: 11, fontFamily: "Inter_400Regular", width: 70 },
  barPct: { fontSize: 11, fontFamily: "Inter_700Bold", width: 34, textAlign: "right" },
  barCount: { color: Colors.textMuted, fontSize: 11, fontFamily: "Inter_400Regular", width: 30, textAlign: "right" },
  priorityBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  priorityText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  leaderRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  rankBadge: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  rankNum: { color: Colors.textMuted, fontSize: 12, fontFamily: "Inter_700Bold" },
  leaderName: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  leaderLevel: { color: Colors.textMuted, fontSize: 9, fontFamily: "Inter_400Regular" },
  pointsBadge: { backgroundColor: "#22C55E22", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  pointsText: { color: Colors.green, fontSize: 12, fontFamily: "Inter_700Bold" },
  emptyText: { color: Colors.textMuted, textAlign: "center", fontSize: 13, fontFamily: "Inter_400Regular", padding: 16 },
  wardRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6, borderTopWidth: 1, borderTopColor: Colors.border },
  wardRank: { fontSize: 11, fontFamily: "Inter_700Bold", width: 24 },
  wardName: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  wardArea: { color: Colors.textMuted, fontSize: 10, fontFamily: "Inter_400Regular" },
  wardBar: { width: 60, height: 6, backgroundColor: Colors.bg, borderRadius: 3, overflow: "hidden" },
  wardBarFill: { height: 6, borderRadius: 3 },
  wardScore: { fontSize: 13, fontFamily: "Inter_700Bold", width: 28, textAlign: "right" },
  workerRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6, borderTopWidth: 1, borderTopColor: Colors.border },
  workerRank: { fontSize: 11, fontFamily: "Inter_700Bold", width: 24 },
  workerName: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  workerWard: { color: Colors.textMuted, fontSize: 10, fontFamily: "Inter_400Regular" },
  workerScore: { color: Colors.green, fontSize: 14, fontFamily: "Inter_700Bold" },
  workerRating: { color: Colors.textMuted, fontSize: 10, fontFamily: "Inter_400Regular" },
});
