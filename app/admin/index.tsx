import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Platform, Animated, RefreshControl, Modal, ActivityIndicator, TextInput, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useApp, type Complaint } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";

const ADMIN_TABS = [
  { key: "command",       label: "War Room",     icon: "radio" as const,          route: null },
  { key: "reports",       label: "Reports",      icon: "document-text" as const,  route: "/admin/reports" as const },
  { key: "alerts",        label: "Alerts",       icon: "warning" as const,        route: "/admin/alerts" as const },
  { key: "workers",       label: "Workers",      icon: "people" as const,         route: "/admin/workers" as const },
  { key: "announcements", label: "Announce",     icon: "megaphone" as const,      route: "/admin/announcements" as const },
];

const CAT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  pothole: "alert-circle", garbage: "trash", streetlight: "bulb", water: "water",
  drain: "flash", electricity: "flash", tree: "leaf", other: "ellipsis-horizontal",
};
const CAT_COLORS: Record<string, string> = {
  pothole: "#F59E0B", garbage: "#EF4444", streetlight: "#FCD34D", water: "#3B82F6",
  drain: "#06B6D4", electricity: "#8B5CF6", tree: "#22C55E", other: "#6B7280",
};
const SOS_ICON_NAMES: Record<string, keyof typeof Ionicons.glyphMap> = {
  gas_leak: "flame-outline", water_burst: "water-outline", electric_hazard: "flash-outline",
  fire_risk: "flame", road_accident: "car-outline", women_safety: "shield-checkmark",
  medical: "medkit-outline", infrastructure: "construct-outline",
};
const SOS_ICON_COLORS: Record<string, string> = {
  gas_leak: "#F59E0B", water_burst: "#3B82F6", electric_hazard: "#EF4444",
  fire_risk: "#EF4444", road_accident: "#F59E0B", women_safety: "#8B5CF6",
  medical: "#22C55E", infrastructure: "#6B7280",
};
const RISK_COLORS = { flood: "#3B82F6", garbage: "#22C55E", infrastructure: "#F59E0B", crime: "#EF4444" };
const PRIORITY_COLORS: Record<string, string> = { P1: "#EF4444", P2: "#F59E0B", P3: "#3B82F6", P4: "#6B7280" };
const STATUS_COLORS: Record<string, string> = { pending: "#F59E0B", in_progress: "#3B82F6", resolved: "#22C55E", closed: "#6B7280" };

function FlashBadge({ count }: { count: number }) {
  const flash = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (count === 0) return;
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(flash, { toValue: 0.3, duration: 500, useNativeDriver: false }),
      Animated.timing(flash, { toValue: 1, duration: 500, useNativeDriver: false }),
    ]));
    anim.start();
    return () => anim.stop();
  }, [count]);
  if (count === 0) return null;
  return (
    <Animated.View style={{ opacity: flash, backgroundColor: "#EF4444", borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, marginLeft: 6 }}>
      <Text style={{ color: "#fff", fontSize: 10, fontFamily: "Inter_700Bold" }}>{count}</Text>
    </Animated.View>
  );
}

function ComplaintDetailModal({ complaint, onClose, onResolve, onReject }: {
  complaint: Complaint | null;
  onClose: () => void;
  onResolve: (id: string) => void;
  onReject: (id: string) => void;
}) {
  if (!complaint) return null;
  const priColor = PRIORITY_COLORS[complaint.priority] || "#6B7280";
  const statusColor = STATUS_COLORS[complaint.status] || "#6B7280";
  const catIcon = CAT_ICONS[complaint.category] || "ellipsis-horizontal";
  const catColor = CAT_COLORS[complaint.category] || "#6B7280";
  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return `${Math.floor(diff / 60000)}m ago`;
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <Modal visible={!!complaint} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.detailCard} onPress={e => e.stopPropagation?.()}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.detailHeader}>
              <View style={[styles.detailCatIcon, { backgroundColor: catColor + "22" }]}>
                <Ionicons name={catIcon} size={22} color={catColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailTicket}>{complaint.ticketId}</Text>
                <Text style={styles.detailCat}>{complaint.category} · {complaint.ward}</Text>
              </View>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.textMuted} />
              </Pressable>
            </View>

            {/* Priority + Status row */}
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
              <View style={[styles.chip, { backgroundColor: priColor + "22", borderColor: priColor + "44" }]}>
                <Ionicons name="alert-circle" size={12} color={priColor} />
                <Text style={[styles.chipText, { color: priColor }]}>{complaint.priority} Critical</Text>
              </View>
              <View style={[styles.chip, { backgroundColor: statusColor + "22", borderColor: statusColor + "44" }]}>
                <Ionicons name="time" size={12} color={statusColor} />
                <Text style={[styles.chipText, { color: statusColor }]}>{complaint.status.replace("_", " ")}</Text>
              </View>
              {complaint.isCluster && (
                <View style={[styles.chip, { backgroundColor: "#06B6D422", borderColor: "#06B6D444" }]}>
                  <Ionicons name="git-merge" size={12} color="#06B6D4" />
                  <Text style={[styles.chipText, { color: "#06B6D4" }]}>{complaint.clusterSize} cluster</Text>
                </View>
              )}
            </View>

            {/* Description */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionLabel}>Description</Text>
              <Text style={styles.detailDesc}>{complaint.description}</Text>
            </View>

            {/* Location */}
            <View style={styles.detailInfoRow}>
              <Ionicons name="location" size={14} color={Colors.textMuted} />
              <Text style={styles.detailInfoText}>{complaint.location}</Text>
            </View>

            {/* Submitted */}
            <View style={styles.detailInfoRow}>
              <Ionicons name="person" size={14} color={Colors.textMuted} />
              <Text style={styles.detailInfoText}>{complaint.submittedBy || "Anonymous"}</Text>
              <Text style={styles.detailInfoMuted}>  ·  {timeAgo(complaint.submittedAt)}</Text>
            </View>

            {complaint.workerName && (
              <View style={styles.detailInfoRow}>
                <Ionicons name="construct" size={14} color="#06B6D4" />
                <Text style={[styles.detailInfoText, { color: "#06B6D4" }]}>Assigned: {complaint.workerName}</Text>
              </View>
            )}

            {/* Stats grid */}
            <View style={styles.detailStatsGrid}>
              <View style={styles.detailStat}>
                <Ionicons name="chevron-up" size={16} color={Colors.green} />
                <Text style={styles.detailStatVal}>{complaint.upvotes}</Text>
                <Text style={styles.detailStatLbl}>Upvotes</Text>
              </View>
              <View style={styles.detailStat}>
                <Ionicons name="hardware-chip" size={16} color="#8B5CF6" />
                <Text style={styles.detailStatVal}>{complaint.aiScore}%</Text>
                <Text style={styles.detailStatLbl}>AI Score</Text>
              </View>
              <View style={styles.detailStat}>
                <Ionicons name="shield" size={16} color={Colors.amber} />
                <Text style={styles.detailStatVal}>{complaint.aiConfidence}%</Text>
                <Text style={styles.detailStatLbl}>Confidence</Text>
              </View>
              {complaint.rating && (
                <View style={styles.detailStat}>
                  <Ionicons name="star" size={16} color={Colors.amber} />
                  <Text style={styles.detailStatVal}>{complaint.rating}/5</Text>
                  <Text style={styles.detailStatLbl}>Rating</Text>
                </View>
              )}
            </View>

            {/* Proof photos */}
            {complaint.hasProof && (
              <View style={styles.proofRow}>
                <View style={styles.proofImg}>
                  <Ionicons name="camera" size={18} color={Colors.textMuted} />
                  <Text style={styles.proofLabel}>Before</Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color={Colors.textMuted} />
                <View style={[styles.proofImg, { borderColor: Colors.green + "44" }]}>
                  <Ionicons name="camera" size={18} color={Colors.green} />
                  <Text style={[styles.proofLabel, { color: Colors.green }]}>After</Text>
                </View>
              </View>
            )}

            {complaint.feedback && (
              <View style={styles.feedbackBox}>
                <Ionicons name="chatbubble" size={12} color={Colors.textMuted} />
                <Text style={styles.feedbackText}>"{complaint.feedback}"</Text>
              </View>
            )}

            {/* Admin actions */}
            {(complaint.status === "pending" || complaint.status === "in_progress") && (
              <View style={styles.detailActions}>
                <Pressable onPress={() => onResolve(complaint.id)} style={styles.resolveBtn}>
                  <Ionicons name="checkmark-circle" size={16} color="#fff" />
                  <Text style={styles.resolveBtnText}>Mark Resolved</Text>
                </Pressable>
                <Pressable onPress={() => onReject(complaint.id)} style={styles.rejectBtn}>
                  <Ionicons name="close-circle" size={16} color="#EF4444" />
                  <Text style={styles.rejectBtnText}>Reject</Text>
                </Pressable>
              </View>
            )}

            {complaint.status === "resolved" && (
              <View style={[styles.chip, { backgroundColor: Colors.green + "22", borderColor: Colors.green + "44", alignSelf: "flex-start", marginTop: 12 }]}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.green} />
                <Text style={[styles.chipText, { color: Colors.green }]}>Resolved {complaint.resolvedAt ? `· ${timeAgo(complaint.resolvedAt)}` : ""}</Text>
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const { complaints, sosAlerts, riskZones, workers, isLoading, refresh, getStats, broadcastEmergency, resolveComplaint, rejectComplaint } = useApp();
  const { user, logout } = useAuth();
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const emergencyBg = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(0)).current;
  const liveAnim = useRef(new Animated.Value(0)).current;

  const stats = getStats();
  const activeAlerts = sosAlerts.filter(s => s.status === "active");
  const criticalComplaints = complaints.filter(c => c.priority === "P1" && c.status !== "resolved" && c.status !== "closed");
  const todayComplaints = complaints.filter(c => new Date(c.submittedAt).toDateString() === new Date().toDateString());
  const p1Count = complaints.filter(c => c.priority === "P1").length;
  const activeWorkers = workers.filter(w => w.status === "active");
  const avgHealth = workers.length ? Math.round(workers.reduce((s, w) => s + w.score, 0) / workers.length) : 0;

  useEffect(() => {
    Animated.spring(headerScale, { toValue: 1, friction: 6, useNativeDriver: false }).start();
    const liveLoop = Animated.loop(Animated.sequence([
      Animated.timing(liveAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
      Animated.timing(liveAnim, { toValue: 0, duration: 800, useNativeDriver: false }),
    ]));
    liveLoop.start();
    return () => liveLoop.stop();
  }, []);

  useEffect(() => {
    if (emergencyMode) {
      const anim = Animated.loop(Animated.sequence([
        Animated.timing(emergencyBg, { toValue: 1, duration: 600, useNativeDriver: false }),
        Animated.timing(emergencyBg, { toValue: 0.3, duration: 600, useNativeDriver: false }),
      ]));
      anim.start();
      return () => anim.stop();
    } else {
      emergencyBg.setValue(0);
    }
  }, [emergencyMode]);

  const handleBroadcast = async () => {
    setIsBroadcasting(true);
    try {
      await broadcastEmergency(broadcastMsg || "CITY-WIDE EMERGENCY ALERT: Take immediate precautions. Follow official instructions.");
      setBroadcastMsg("");
      setShowEmergencyModal(false);
      setEmergencyMode(true);
    } catch {}
    finally { setIsBroadcasting(false); }
  };

  const handleResolve = useCallback(async (id: string) => {
    setResolvingId(id);
    try {
      await resolveComplaint(id, 4, "Admin resolved");
      setSelectedComplaint(null);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setResolvingId(null);
    }
  }, [resolveComplaint]);

  const handleReject = useCallback(async (id: string) => {
    try {
      await rejectComplaint(id);
      setSelectedComplaint(null);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  }, [rejectComplaint]);

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      {emergencyMode && (
        <Animated.View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#EF4444", opacity: emergencyBg.interpolate({ inputRange: [0, 1], outputRange: [0, 0.1] }), zIndex: 0, pointerEvents: "none" }} />
      )}

      {/* Header */}
      <Animated.View style={[styles.header, { transform: [{ scale: headerScale }] }]}>
        <View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={styles.headerTitle}>War Room</Text>
            <Animated.View style={{ opacity: liveAnim, backgroundColor: "#EF444422", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ color: "#EF4444", fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1 }}>LIVE</Text>
            </Animated.View>
          </View>
          <Text style={styles.headerSub}>SANKALP Admin · {user?.name}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable onPress={() => setShowEmergencyModal(true)} style={[styles.emergencyBtn, emergencyMode && { backgroundColor: "#EF4444" }]}>
            <Ionicons name="warning" size={16} color={emergencyMode ? "#fff" : "#EF4444"} />
            <Text style={[styles.emergencyText, emergencyMode && { color: "#fff" }]}>
              {emergencyMode ? "EMERGENCY" : "Emergency"}
            </Text>
          </Pressable>
          <Pressable onPress={logout} style={styles.logoutBtn}>
            <Feather name="log-out" size={18} color={Colors.textMuted} />
          </Pressable>
        </View>
      </Animated.View>

      {/* Nav */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexShrink: 0 }} contentContainerStyle={styles.navRow}>
        {ADMIN_TABS.map(tab => (
          <Pressable key={tab.key} onPress={() => tab.route && router.push(tab.route)} style={[styles.navTab, tab.key === "command" && styles.navTabActive]}>
            <Ionicons name={tab.icon} size={15} color={tab.key === "command" ? Colors.green : Colors.textMuted} />
            <Text style={[styles.navTabText, tab.key === "command" && { color: Colors.green }]}>{tab.label}</Text>
            {tab.key === "alerts" && <FlashBadge count={activeAlerts.length} />}
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={Colors.green} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 }}
      >
        {/* KPI Grid */}
        <View style={styles.kpiGrid}>
          {[
            { label: "Total", value: stats.total, color: "#F59E0B", icon: "list-outline" as const, route: "/admin/reports" as const },
            { label: "P1 Critical", value: p1Count, color: "#EF4444", icon: "alert-circle" as const, route: "/admin/reports" as const },
            { label: "Active SOS", value: activeAlerts.length, color: "#EF4444", icon: "warning" as const, route: "/admin/alerts" as const },
            { label: "Today", value: todayComplaints.length, color: "#22C55E", icon: "today-outline" as const, route: "/admin/reports" as const },
            { label: "Pending", value: stats.pending, color: "#F59E0B", icon: "time-outline" as const, route: "/admin/reports" as const },
            { label: "Resolved", value: stats.resolved, color: "#22C55E", icon: "checkmark-circle" as const, route: "/admin/reports" as const },
            { label: "Workers", value: activeWorkers.length, color: "#06B6D4", icon: "people-outline" as const, route: "/admin/workers" as const },
            { label: "Avg Score", value: `${avgHealth}%`, color: "#8B5CF6", icon: "pulse-outline" as const, route: "/admin/workers" as const },
          ].map((kpi, i) => (
            <Pressable key={i} onPress={() => router.push(kpi.route)} style={styles.kpiCard}>
              <Ionicons name={kpi.icon} size={18} color={kpi.color} />
              <Text style={[styles.kpiValue, { color: kpi.color }]}>{kpi.value}</Text>
              <Text style={styles.kpiLabel}>{kpi.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Emergency Broadcast */}
        <Pressable onPress={() => setShowEmergencyModal(true)} style={styles.broadcastBtn}>
          <LinearGradient colors={["#7F1D1D", "#B91C1C", "#7F1D1D"]} style={styles.broadcastGrad}>
            <Ionicons name="radio-outline" size={20} color="#fff" />
            <View style={{ flex: 1 }}>
              <Text style={styles.broadcastTitle}>Broadcast City-Wide Emergency</Text>
              <Text style={styles.broadcastSub}>Push alert to all 20 million citizen devices</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.5)" />
          </LinearGradient>
        </Pressable>

        {/* Active SOS Feed */}
        {activeAlerts.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.redDot} />
              <Text style={[styles.sectionTitle, { color: "#EF4444" }]}>ACTIVE SOS ALERTS</Text>
              <Text style={styles.alertCount}>{activeAlerts.length}</Text>
              <Pressable onPress={() => router.push("/admin/alerts")}><Text style={styles.seeAll}>View All</Text></Pressable>
            </View>
            {activeAlerts.slice(0, 3).map(alert => (
              <LinearGradient key={alert.id} colors={["#7F1D1D22", "#7F1D1D11"]} style={styles.sosCard}>
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: (SOS_ICON_COLORS[alert.category] || "#EF4444") + "22", alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name={SOS_ICON_NAMES[alert.category] || "warning"} size={16} color={SOS_ICON_COLORS[alert.category] || "#EF4444"} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sosCategory}>{alert.category.replace(/_/g, " ").toUpperCase()}</Text>
                    <Text style={styles.sosDesc} numberOfLines={2}>{alert.description}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 }}>
                      <Ionicons name="location-outline" size={11} color={Colors.textMuted} />
                      <Text style={styles.sosLoc}>{alert.location}</Text>
                    </View>
                    {alert.nearestPoliceStation && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                        <Ionicons name="shield-outline" size={11} color="#F59E0B" />
                        <Text style={styles.sosPolice}>{alert.nearestPoliceStation} · {alert.policeDistance} km</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.sosBadge}><Text style={styles.sosBadgeText}>P1</Text></View>
                </View>
              </LinearGradient>
            ))}
          </View>
        )}

        {/* AI Intelligence Panel */}
        <LinearGradient colors={["#1E1B4B", "#312E81", "#1E1B4B"]} style={styles.aiPanel}>
          <View style={styles.aiHeader}>
            <Text style={styles.aiTitle}>AI Intelligence Engine</Text>
            <View style={styles.aiBadge}><Text style={styles.aiBadgeText}>ACTIVE</Text></View>
          </View>
          <View style={styles.aiGrid}>
            <View style={styles.aiItem}><Text style={styles.aiValue}>{Math.round(complaints.reduce((s, c) => s + c.aiScore, 0) / Math.max(complaints.length, 1))}%</Text><Text style={styles.aiItemLabel}>Avg AI Score</Text></View>
            <View style={styles.aiItem}><Text style={styles.aiValue}>{complaints.filter(c => c.isCluster).length}</Text><Text style={styles.aiItemLabel}>Clusters Found</Text></View>
            <View style={styles.aiItem}><Text style={styles.aiValue}>{riskZones.length}</Text><Text style={styles.aiItemLabel}>Risk Zones</Text></View>
            <View style={styles.aiItem}><Text style={styles.aiValue}>{complaints.filter(c => c.upvotes >= 20).length}</Text><Text style={styles.aiItemLabel}>High Upvotes</Text></View>
          </View>
        </LinearGradient>

        {/* Critical P1 Complaints — CLICKABLE */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="alert-circle" size={16} color="#EF4444" />
            <Text style={styles.sectionTitle}>Critical P1 Complaints</Text>
            <Text style={styles.seeAll} onPress={() => router.push("/admin/reports")}>View All ({criticalComplaints.length})</Text>
          </View>
          {criticalComplaints.length === 0 && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, padding: 12 }}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.green} />
              <Text style={{ color: Colors.textMuted, fontSize: 13, fontFamily: "Inter_400Regular" }}>No critical complaints — city looks good</Text>
            </View>
          )}
          {criticalComplaints.slice(0, 5).map(c => {
            const catColor = CAT_COLORS[c.category] || "#6B7280";
            const catIcon = CAT_ICONS[c.category] || "ellipsis-horizontal";
            const statusColor = STATUS_COLORS[c.status] || "#6B7280";
            return (
              <Pressable key={c.id} onPress={() => setSelectedComplaint(c)} style={styles.criticalRow}>
                <View style={[styles.criticalCatIcon, { backgroundColor: catColor + "22" }]}>
                  <Ionicons name={catIcon} size={14} color={catColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <Text style={styles.criticalTicket}>{c.ticketId}</Text>
                    <View style={[styles.p1Badge]}><Text style={styles.p1Text}>P1</Text></View>
                    <Text style={[styles.criticalStatusText, { color: statusColor }]}>{c.status.replace("_", " ")}</Text>
                  </View>
                  <Text style={styles.criticalDesc} numberOfLines={1}>{c.description}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                    <Ionicons name="location-outline" size={10} color={Colors.textMuted} />
                    <Text style={styles.criticalLoc} numberOfLines={1}>{c.location}</Text>
                    <Ionicons name="chevron-up" size={10} color={Colors.green} />
                    <Text style={[styles.criticalLoc, { color: Colors.green }]}>{c.upvotes}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </Pressable>
            );
          })}
        </View>

        {/* Risk Zones */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flame" size={16} color="#8B5CF6" />
            <Text style={styles.sectionTitle}>AI Risk Zones</Text>
          </View>
          {riskZones.slice(0, 5).map(rz => (
            <View key={rz.id} style={styles.riskRow}>
              <View style={[styles.riskDot, { backgroundColor: RISK_COLORS[rz.type] }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.riskDesc}>{rz.description}</Text>
                <Text style={styles.riskCount}>{rz.complaintCount} complaints · {rz.type}</Text>
              </View>
              <View style={[styles.riskBadge, { backgroundColor: RISK_COLORS[rz.type] + "22" }]}>
                <Text style={[styles.riskBadgeText, { color: RISK_COLORS[rz.type] }]}>{rz.severity}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Complaint Detail Modal */}
      <ComplaintDetailModal
        complaint={selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        onResolve={handleResolve}
        onReject={handleReject}
      />

      {/* Emergency Broadcast Modal */}
      <Modal visible={showEmergencyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#EF444422", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="radio-outline" size={24} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>City Emergency Broadcast</Text>
                <Text style={styles.modalSub}>Alerts all 20M citizens instantly</Text>
              </View>
              <Pressable onPress={() => setShowEmergencyModal(false)}>
                <Ionicons name="close" size={22} color={Colors.textMuted} />
              </Pressable>
            </View>
            <Text style={styles.broadcastMsgLabel}>Message (optional)</Text>
            <TextInput
              style={styles.broadcastMsgInput}
              placeholder="CITY-WIDE EMERGENCY ALERT: Take immediate precautions..."
              placeholderTextColor={Colors.textMuted}
              value={broadcastMsg}
              onChangeText={setBroadcastMsg}
              multiline
              numberOfLines={3}
            />
            <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
              <Pressable onPress={() => setShowEmergencyModal(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleBroadcast} disabled={isBroadcasting} style={styles.emergencyConfirmBtn}>
                {isBroadcasting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <><Ionicons name="warning" size={16} color="#fff" /><Text style={styles.emergencyConfirmText}>BROADCAST NOW</Text></>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 },
  headerTitle: { color: "#fff", fontSize: 20, fontFamily: "Inter_700Bold" },
  headerSub: { color: Colors.textMuted, fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  emergencyBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: "#EF444444", backgroundColor: "#EF444411" },
  emergencyText: { color: "#EF4444", fontSize: 11, fontFamily: "Inter_700Bold" },
  logoutBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  navRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 6 },
  navTab: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  navTabActive: { backgroundColor: Colors.green + "11", borderColor: Colors.green + "44" },
  navTabText: { color: Colors.textMuted, fontSize: 11, fontFamily: "Inter_600SemiBold" },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  kpiCard: { width: "22%", backgroundColor: Colors.bgCard, borderRadius: 12, padding: 10, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  kpiValue: { fontSize: 18, fontFamily: "Inter_700Bold", marginTop: 4 },
  kpiLabel: { color: Colors.textMuted, fontSize: 9, fontFamily: "Inter_400Regular", marginTop: 2, textAlign: "center" },
  broadcastBtn: { marginHorizontal: 16, marginBottom: 12, borderRadius: 14, overflow: "hidden" },
  broadcastGrad: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  broadcastTitle: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
  broadcastSub: { color: "rgba(255,255,255,0.6)", fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  sectionCard: { marginHorizontal: 16, backgroundColor: Colors.bgCard, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  sectionTitle: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },
  seeAll: { color: Colors.green, fontSize: 12, fontFamily: "Inter_500Medium" },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444" },
  alertCount: { color: Colors.textMuted, fontSize: 12, fontFamily: "Inter_400Regular" },
  sosCard: { borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#EF444422" },
  sosCategory: { color: "#EF4444", fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  sosDesc: { color: "#fff", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 3, lineHeight: 16 },
  sosLoc: { color: Colors.textMuted, fontSize: 11, fontFamily: "Inter_400Regular" },
  sosPolice: { color: "#F59E0B", fontSize: 10, fontFamily: "Inter_500Medium" },
  sosBadge: { backgroundColor: "#EF4444", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  sosBadgeText: { color: "#fff", fontSize: 10, fontFamily: "Inter_700Bold" },
  aiPanel: { marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 12 },
  aiHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  aiTitle: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
  aiBadge: { backgroundColor: "#22C55E22", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: "#22C55E44" },
  aiBadgeText: { color: "#22C55E", fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  aiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  aiItem: { flex: 1, minWidth: "40%", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 10, alignItems: "center" },
  aiValue: { color: "#A78BFA", fontSize: 22, fontFamily: "Inter_700Bold" },
  aiItemLabel: { color: "rgba(255,255,255,0.4)", fontSize: 9, fontFamily: "Inter_400Regular", marginTop: 3 },
  criticalRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  criticalCatIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  criticalTicket: { color: "#fff", fontSize: 12, fontFamily: "Inter_700Bold" },
  p1Badge: { backgroundColor: "#EF444422", borderRadius: 5, paddingHorizontal: 6, paddingVertical: 1 },
  p1Text: { color: "#EF4444", fontSize: 9, fontFamily: "Inter_700Bold" },
  criticalStatusText: { fontSize: 9, fontFamily: "Inter_500Medium", textTransform: "capitalize" },
  criticalDesc: { color: "#9CA3AF", fontSize: 11, fontFamily: "Inter_400Regular" },
  criticalLoc: { color: Colors.textMuted, fontSize: 10, fontFamily: "Inter_400Regular" },
  riskRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  riskDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  riskDesc: { color: "#fff", fontSize: 12, fontFamily: "Inter_400Regular" },
  riskCount: { color: Colors.textMuted, fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 2 },
  riskBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  riskBadgeText: { fontSize: 9, fontFamily: "Inter_700Bold", textTransform: "capitalize" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#111827", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, borderWidth: 1, borderColor: Colors.border },
  modalTitle: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  modalSub: { color: Colors.textMuted, fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  broadcastMsgLabel: { color: Colors.textMuted, fontSize: 11, fontFamily: "Inter_500Medium", marginBottom: 8 },
  broadcastMsgInput: { backgroundColor: Colors.bg, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: Colors.border, color: "#fff", fontSize: 13, fontFamily: "Inter_400Regular", minHeight: 70, textAlignVertical: "top" },
  cancelBtn: { flex: 1, backgroundColor: Colors.bg, borderRadius: 12, padding: 14, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  cancelText: { color: Colors.textMuted, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  emergencyConfirmBtn: { flex: 2, backgroundColor: "#EF4444", borderRadius: 12, padding: 14, alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "center" },
  emergencyConfirmText: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
  // Detail modal styles
  detailCard: { backgroundColor: "#111827", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, borderWidth: 1, borderColor: Colors.border, maxHeight: "90%" },
  detailHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  detailCatIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  detailTicket: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  detailCat: { color: Colors.textMuted, fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2, textTransform: "capitalize" },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.bg, alignItems: "center", justifyContent: "center" },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  chipText: { fontSize: 10, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
  detailSection: { backgroundColor: Colors.bg, borderRadius: 10, padding: 12, marginBottom: 10 },
  detailSectionLabel: { color: Colors.textMuted, fontSize: 10, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 },
  detailDesc: { color: "#D1D5DB", fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  detailInfoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  detailInfoText: { color: "#9CA3AF", fontSize: 12, fontFamily: "Inter_400Regular" },
  detailInfoMuted: { color: Colors.textMuted, fontSize: 11, fontFamily: "Inter_400Regular" },
  detailStatsGrid: { flexDirection: "row", backgroundColor: Colors.bg, borderRadius: 12, padding: 12, marginVertical: 12, gap: 4 },
  detailStat: { flex: 1, alignItems: "center", gap: 3 },
  detailStatVal: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  detailStatLbl: { color: Colors.textMuted, fontSize: 9, fontFamily: "Inter_400Regular" },
  proofRow: { flexDirection: "row", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 12 },
  proofImg: { width: 80, height: 60, backgroundColor: Colors.bg, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border, gap: 4 },
  proofLabel: { color: Colors.textMuted, fontSize: 9, fontFamily: "Inter_400Regular" },
  feedbackBox: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.bg, borderRadius: 8, padding: 10, marginBottom: 12 },
  feedbackText: { color: Colors.textMuted, fontSize: 11, fontFamily: "Inter_400Regular", fontStyle: "italic", flex: 1 },
  detailActions: { flexDirection: "row", gap: 10, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: Colors.border },
  resolveBtn: { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: Colors.green, borderRadius: 12, padding: 12 },
  resolveBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
  rejectBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#EF444422", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#EF444444" },
  rejectBtnText: { color: "#EF4444", fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
