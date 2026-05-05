import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Complaint, SOSAlert, Worker, PoliceStation, RiskZone, GeoPoint } from "@/context/AppContext";
import Colors from "@/constants/colors";

export type MapFilter = "all" | "complaints" | "sos" | "workers" | "police" | "risks";

// Uttarakhand 13 districts with approximate center coords and geo outlines
const UK_DISTRICTS = [
  { name: "Dehradun",          cx: 35, cy: 62, label: "DDN"  },
  { name: "Haridwar",          cx: 28, cy: 75, label: "HRW"  },
  { name: "Tehri Garhwal",     cx: 44, cy: 56, label: "TGA"  },
  { name: "Pauri Garhwal",     cx: 52, cy: 68, label: "PGA"  },
  { name: "Rudraprayag",       cx: 56, cy: 52, label: "RPG"  },
  { name: "Chamoli",           cx: 66, cy: 44, label: "CML"  },
  { name: "Uttarkashi",        cx: 46, cy: 38, label: "UTK"  },
  { name: "Pithoragarh",       cx: 82, cy: 54, label: "PTG"  },
  { name: "Bageshwar",         cx: 74, cy: 56, label: "BGW"  },
  { name: "Almora",            cx: 70, cy: 65, label: "ALM"  },
  { name: "Champawat",         cx: 78, cy: 72, label: "CPW"  },
  { name: "Nainital",          cx: 60, cy: 76, label: "NTL"  },
  { name: "Udham Singh Nagar", cx: 50, cy: 88, label: "USN"  },
];

interface Props {
  complaints?: Complaint[];
  sosAlerts?: SOSAlert[];
  workers?: Worker[];
  policeStations?: PoliceStation[];
  riskZones?: RiskZone[];
  filter?: MapFilter;
  userLocation?: GeoPoint | null;
  userDistrict?: string;
  style?: any;
}

const PRIORITY_COLORS: Record<string, string> = {
  P1: "#EF4444", P2: "#F59E0B", P3: "#3B82F6", P4: "#6B7280",
};

const RISK_COLORS: Record<string, string> = {
  flood: "#3B82F6", garbage: "#22C55E", infrastructure: "#F59E0B", crime: "#EF4444",
};

function Dot({ color, size = 10 }: { color: string; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, flexShrink: 0 }} />;
}

// Map Uttarakhand geo coords to percentage positions
const UK_BOUNDS = { minLat: 28.65, maxLat: 31.45, minLng: 77.30, maxLng: 81.15 };
const NORM_LAT = (lat: number) => ((lat - UK_BOUNDS.minLat) / (UK_BOUNDS.maxLat - UK_BOUNDS.minLat));
const NORM_LNG = (lng: number) => ((lng - UK_BOUNDS.minLng) / (UK_BOUNDS.maxLng - UK_BOUNDS.minLng));

export default function UttarakhandMap({
  complaints = [], sosAlerts = [], workers = [], policeStations = [],
  riskZones = [], filter = "all", userLocation, userDistrict, style,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const show = (type: "complaints" | "sos" | "workers" | "police" | "risks") =>
    filter === "all" || filter === type;

  type DotItem = { id: string; lat: number; lng: number; color: string; icon: keyof typeof Ionicons.glyphMap; label: string; sub: string };
  const dots: DotItem[] = [];

  if (show("complaints")) {
    complaints.slice(0, 80).forEach(c => dots.push({
      id: "c-" + c.id, lat: c.geo.lat, lng: c.geo.lng,
      color: PRIORITY_COLORS[c.priority] || "#6B7280",
      icon: "alert-circle", label: c.category, sub: c.location
    }));
  }
  if (show("sos")) {
    sosAlerts.forEach(s => dots.push({
      id: "s-" + s.id, lat: s.geo.lat, lng: s.geo.lng,
      color: "#EF4444", icon: "warning",
      label: s.category.replace(/_/g, " "), sub: s.location
    }));
  }
  if (show("workers")) {
    workers.filter(w => w.geo).forEach(w => dots.push({
      id: "w-" + w.id, lat: w.geo!.lat, lng: w.geo!.lng,
      color: "#06B6D4", icon: "person",
      label: w.name, sub: w.currentTask || "On duty"
    }));
  }
  if (show("police")) {
    policeStations.forEach(ps => dots.push({
      id: "p-" + ps.id, lat: ps.geo.lat, lng: ps.geo.lng,
      color: "#F59E0B", icon: "shield",
      label: ps.name, sub: ps.phone
    }));
  }
  if (show("risks")) {
    riskZones.filter(rz => rz.geo).forEach(rz => dots.push({
      id: "r-" + rz.id, lat: rz.geo.lat, lng: rz.geo.lng,
      color: RISK_COLORS[rz.type], icon: "flame",
      label: rz.type, sub: rz.description
    }));
  }

  const sel = dots.find(d => d.id === selected);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.mapBg}>
        {/* Uttarakhand district labels on the "map" */}
        <Text style={styles.mapLabel}>UTTARAKHAND</Text>
        <Text style={styles.mapSub}>देवभूमि — 13 Districts</Text>

        {/* District name chips */}
        {UK_DISTRICTS.map(d => {
          const isUserDistrict = userDistrict && userDistrict !== "Uttarakhand" && d.name === userDistrict;
          return (
            <View
              key={d.name}
              style={[
                styles.districtChip,
                { left: `${d.cx}%`, top: `${d.cy}%` },
                isUserDistrict && styles.districtChipActive,
              ]}
            >
              <Text style={[styles.districtLabel, isUserDistrict && styles.districtLabelActive]}>
                {d.label}
              </Text>
            </View>
          );
        })}

        {/* Data dots */}
        {dots.map(dot => {
          const left = NORM_LNG(dot.lng) * 100;
          const top = (1 - NORM_LAT(dot.lat)) * 100;
          if (left < 0 || left > 100 || top < 0 || top > 100) return null;
          return (
            <Pressable
              key={dot.id}
              onPress={() => setSelected(selected === dot.id ? null : dot.id)}
              style={[styles.mapDot, { left: `${left}%`, top: `${top}%`, backgroundColor: dot.color + "cc", borderColor: dot.color }]}
            >
              <View style={[styles.mapDotInner, { backgroundColor: dot.color }]} />
            </Pressable>
          );
        })}

        {/* User location */}
        {userLocation && (() => {
          const left = NORM_LNG(userLocation.lng) * 100;
          const top = (1 - NORM_LAT(userLocation.lat)) * 100;
          if (left < 0 || left > 100 || top < 0 || top > 100) return null;
          return (
            <View style={[styles.userDot, { left: `${left}%`, top: `${top}%` }]}>
              <View style={styles.userDotInner} />
            </View>
          );
        })()}

        {/* Tooltip */}
        {sel && (
          <View style={styles.tooltip}>
            <Ionicons name={sel.icon} size={14} color={sel.color} />
            <View style={{ flex: 1 }}>
              <Text style={styles.tooltipTitle} numberOfLines={1}>{sel.label}</Text>
              <Text style={styles.tooltipSub} numberOfLines={1}>{sel.sub}</Text>
            </View>
            <Pressable onPress={() => setSelected(null)}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </Pressable>
          </View>
        )}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}><Dot color="#EF4444" /><Text style={styles.legendText}>P1</Text></View>
        <View style={styles.legendItem}><Dot color="#F59E0B" /><Text style={styles.legendText}>P2</Text></View>
        <View style={styles.legendItem}><Dot color="#3B82F6" /><Text style={styles.legendText}>P3</Text></View>
        <View style={styles.legendItem}><Dot color="#06B6D4" /><Text style={styles.legendText}>Workers</Text></View>
        <View style={styles.legendItem}><Dot color="#EF4444" size={8} /><Text style={styles.legendText}>SOS</Text></View>
        <View style={styles.legendItem}><Dot color="#F59E0B" /><Text style={styles.legendText}>Police</Text></View>
        {userDistrict && userDistrict !== "Uttarakhand" && (
          <View style={styles.legendItem}><View style={styles.userDistrictDot} /><Text style={[styles.legendText, { color: "#22C55E" }]}>{userDistrict}</Text></View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: "hidden", backgroundColor: "#0d1117", borderRadius: 16 },
  mapBg: {
    width: "100%", height: 320, backgroundColor: "#0d1117",
    position: "relative", borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  mapLabel: {
    position: "absolute", top: "8%", left: "50%",
    transform: [{ translateX: -55 }],
    color: "#1E3A5F", fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: 3,
  },
  mapSub: {
    position: "absolute", top: "16%", left: "50%",
    transform: [{ translateX: -55 }],
    color: "#1E3A5F", fontSize: 9, fontFamily: "Inter_400Regular",
  },
  districtChip: {
    position: "absolute",
    transform: [{ translateX: -14 }, { translateY: -10 }],
    backgroundColor: "#1E293B",
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#334155",
  },
  districtChipActive: {
    backgroundColor: "#064E3B",
    borderColor: "#22C55E",
  },
  districtLabel: {
    color: "#64748B",
    fontSize: 7,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },
  districtLabelActive: {
    color: "#22C55E",
  },
  mapDot: {
    position: "absolute", width: 16, height: 16, borderRadius: 8, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
    transform: [{ translateX: -8 }, { translateY: -8 }],
  },
  mapDotInner: { width: 6, height: 6, borderRadius: 3 },
  userDot: {
    position: "absolute", width: 20, height: 20, borderRadius: 10,
    backgroundColor: "#22C55E44", borderWidth: 2, borderColor: "#22C55E",
    alignItems: "center", justifyContent: "center",
    transform: [{ translateX: -10 }, { translateY: -10 }],
  },
  userDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22C55E" },
  tooltip: {
    position: "absolute", bottom: 12, left: 12, right: 12,
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(10,15,28,0.95)", borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  tooltipTitle: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  tooltipSub: { color: Colors.textMuted, fontSize: 10, fontFamily: "Inter_400Regular" },
  legend: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 10, flexWrap: "wrap" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendText: { color: Colors.textMuted, fontSize: 10, fontFamily: "Inter_400Regular" },
  userDistrictDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#22C55E" },
});
