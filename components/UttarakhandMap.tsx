import React, { useRef, useState } from "react";
import { View, StyleSheet, Text, Pressable, Platform } from "react-native";
import MapView, { Marker, Circle, Callout, PROVIDER_DEFAULT, Region } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import type { Complaint, SOSAlert, Worker, PoliceStation, RiskZone, GeoPoint } from "@/context/AppContext";

export type MapFilter = "all" | "complaints" | "sos" | "workers" | "police" | "risks";

// Uttarakhand center region
const UK_REGION: Region = {
  latitude: 30.0668,
  longitude: 79.0193,
  latitudeDelta: 2.8,
  longitudeDelta: 3.8,
};

// District-specific map regions
const DISTRICT_REGIONS: Record<string, Region> = {
  "Dehradun":          { latitude: 30.3165, longitude: 78.0322, latitudeDelta: 0.6, longitudeDelta: 0.7 },
  "Haridwar":          { latitude: 29.9457, longitude: 78.1642, latitudeDelta: 0.5, longitudeDelta: 0.6 },
  "Tehri Garhwal":     { latitude: 30.3822, longitude: 78.4800, latitudeDelta: 0.8, longitudeDelta: 0.9 },
  "Pauri Garhwal":     { latitude: 29.6864, longitude: 78.9764, latitudeDelta: 0.9, longitudeDelta: 1.0 },
  "Rudraprayag":       { latitude: 30.2846, longitude: 78.9806, latitudeDelta: 0.8, longitudeDelta: 0.9 },
  "Chamoli":           { latitude: 30.4090, longitude: 79.3206, latitudeDelta: 1.0, longitudeDelta: 1.2 },
  "Uttarkashi":        { latitude: 30.7268, longitude: 78.4354, latitudeDelta: 0.9, longitudeDelta: 1.0 },
  "Pithoragarh":       { latitude: 29.5829, longitude: 80.2178, latitudeDelta: 1.0, longitudeDelta: 1.2 },
  "Bageshwar":         { latitude: 29.8371, longitude: 79.7715, latitudeDelta: 0.7, longitudeDelta: 0.8 },
  "Almora":            { latitude: 29.5971, longitude: 79.6596, latitudeDelta: 0.7, longitudeDelta: 0.8 },
  "Champawat":         { latitude: 29.3377, longitude: 80.0914, latitudeDelta: 0.7, longitudeDelta: 0.8 },
  "Nainital":          { latitude: 29.3919, longitude: 79.4542, latitudeDelta: 0.5, longitudeDelta: 0.6 },
  "Udham Singh Nagar": { latitude: 28.9982, longitude: 79.5050, latitudeDelta: 0.6, longitudeDelta: 0.7 },
};

const PRIORITY_COLORS: Record<string, string> = {
  P1: "#EF4444", P2: "#F59E0B", P3: "#3B82F6", P4: "#6B7280",
};

const RISK_COLORS: Record<string, string> = {
  flood: "#3B82F6", garbage: "#22C55E", infrastructure: "#F59E0B", crime: "#EF4444",
};

const SOS_COLORS: Record<string, string> = {
  gas_leak: "#F59E0B", water_burst: "#3B82F6", electric_hazard: "#EF4444",
  fire_risk: "#EF4444", road_accident: "#F59E0B", women_safety: "#8B5CF6",
  medical: "#22C55E", infrastructure: "#6B7280",
};

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0d1117" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6B7280" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0d1117" }] },
  { featureType: "administrative", elementType: "geometry.fill", stylers: [{ color: "#0d1117" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#1F2937" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#9CA3AF" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#111827" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#6B7280" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#0d1f0d" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1F2937" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#0d1117" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2D3748" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#061728" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3B82F6" }] },
];

interface MarkerItem {
  type: "complaint" | "sos" | "worker" | "police" | "risk";
  title: string;
  subtitle: string;
  extra?: string;
  color: string;
}

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

function CalloutView({ item }: { item: MarkerItem }) {
  return (
    <View style={styles.callout}>
      <Text style={styles.calloutTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.calloutSub} numberOfLines={2}>{item.subtitle}</Text>
      {item.extra ? <Text style={styles.calloutExtra} numberOfLines={1}>{item.extra}</Text> : null}
    </View>
  );
}

export default function UttarakhandMap({ complaints = [], sosAlerts = [], workers = [], policeStations = [], riskZones = [], filter = "all", userLocation, userDistrict, style }: Props) {
  const mapRef = useRef<MapView>(null);
  const initialRegion = (userDistrict && DISTRICT_REGIONS[userDistrict]) ? DISTRICT_REGIONS[userDistrict] : UK_REGION;
  const [region, setRegion] = useState<Region>(initialRegion);

  const show = (type: "complaints" | "sos" | "workers" | "police" | "risks") =>
    filter === "all" || filter === type;

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        customMapStyle={DARK_MAP_STYLE}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        onRegionChangeComplete={setRegion}
        loadingEnabled
        loadingBackgroundColor="#0d1117"
        loadingIndicatorColor="#FF9933"
        rotateEnabled={false}
        pitchEnabled={false}
      >
        {userLocation && (
          <Marker coordinate={{ latitude: userLocation.lat, longitude: userLocation.lng }} anchor={{ x: 0.5, y: 0.5 }} zIndex={100}>
            <View style={styles.userDot}><View style={styles.userDotInner} /></View>
            <Callout tooltip>
              <CalloutView item={{ type: "worker", title: "Your Location", subtitle: `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`, color: "#06B6D4" }} />
            </Callout>
          </Marker>
        )}

        {show("risks") && riskZones.map(rz => (
          <Circle key={rz.id} center={{ latitude: rz.geo.lat, longitude: rz.geo.lng }} radius={rz.radius * 80}
            fillColor={RISK_COLORS[rz.type] + "22"} strokeColor={RISK_COLORS[rz.type] + "88"} strokeWidth={1.5} />
        ))}

        {show("risks") && riskZones.map(rz => (
          <Marker key={`risk-${rz.id}`} coordinate={{ latitude: rz.geo.lat, longitude: rz.geo.lng }} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={[styles.markerPin, { backgroundColor: RISK_COLORS[rz.type] + "EE" }]}>
              <Ionicons name={rz.type === "flood" ? "water" : rz.type === "crime" ? "warning" : rz.type === "garbage" ? "trash" : "construct"} size={11} color="#fff" />
            </View>
            <Callout tooltip>
              <CalloutView item={{ type: "risk", title: `${rz.type.toUpperCase()} RISK`, subtitle: rz.description, extra: `Severity: ${rz.severity} · ${rz.complaintCount} reports`, color: RISK_COLORS[rz.type] }} />
            </Callout>
          </Marker>
        ))}

        {show("police") && policeStations.map(ps => (
          <Marker key={ps.id} coordinate={{ latitude: ps.geo.lat, longitude: ps.geo.lng }} anchor={{ x: 0.5, y: 1 }}>
            <View style={[styles.markerBadge, { borderColor: "#F59E0B" }]}>
              <Ionicons name="shield" size={13} color="#F59E0B" />
            </View>
            <Callout tooltip>
              <CalloutView item={{ type: "police", title: ps.name, subtitle: ps.address, extra: ps.phone, color: "#F59E0B" }} />
            </Callout>
          </Marker>
        ))}

        {show("workers") && workers.filter(w => w.geo && w.status === "active").map(w => (
          <Marker key={w.id} coordinate={{ latitude: w.geo!.lat, longitude: w.geo!.lng }} anchor={{ x: 0.5, y: 1 }}>
            <View style={[styles.markerBadge, { borderColor: "#06B6D4" }]}>
              <Ionicons name="person" size={12} color="#06B6D4" />
            </View>
            <Callout tooltip>
              <CalloutView item={{ type: "worker", title: w.name, subtitle: w.currentTask || "On duty", extra: `Rating: ${w.avgRating.toFixed(1)} · Score: ${w.score}`, color: "#06B6D4" }} />
            </Callout>
          </Marker>
        ))}

        {show("sos") && sosAlerts.filter(s => s.status !== "resolved").map(s => (
          <Marker key={s.id} coordinate={{ latitude: s.geo.lat, longitude: s.geo.lng }} anchor={{ x: 0.5, y: 1 }}>
            <View style={[styles.markerPin, { backgroundColor: SOS_COLORS[s.category] || "#EF4444" }]}>
              <Ionicons name="warning" size={12} color="#fff" />
            </View>
            <Callout tooltip>
              <CalloutView item={{ type: "sos", title: `SOS: ${s.category.replace(/_/g, " ").toUpperCase()}`, subtitle: s.description, extra: `${s.status.toUpperCase()} · ${s.location}`, color: "#EF4444" }} />
            </Callout>
          </Marker>
        ))}

        {show("complaints") && complaints.slice(0, 120).map(c => (
          <Marker key={c.id} coordinate={{ latitude: c.geo.lat, longitude: c.geo.lng }} anchor={{ x: 0.5, y: 1 }}>
            <View style={[styles.dotMarker, { backgroundColor: PRIORITY_COLORS[c.priority] }]} />
            <Callout tooltip>
              <CalloutView item={{ type: "complaint", title: `${c.ticketId} · ${c.category.toUpperCase()}`, subtitle: c.description.slice(0, 80), extra: `${c.priority} · ${c.status} · ${c.ward}`, color: PRIORITY_COLORS[c.priority] }} />
            </Callout>
          </Marker>
        ))}
      </MapView>

      <Pressable style={styles.recenterBtn} onPress={() => mapRef.current?.animateToRegion(initialRegion, 500)}>
        <Ionicons name="locate" size={20} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d1117", overflow: "hidden" },
  userDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#06B6D422", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#06B6D4" },
  userDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#06B6D4" },
  markerPin: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.3)" },
  markerBadge: { width: 28, height: 28, borderRadius: 6, alignItems: "center", justifyContent: "center", backgroundColor: "#111827", borderWidth: 2 },
  dotMarker: { width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" },
  callout: { backgroundColor: "#111827", borderRadius: 10, padding: 10, maxWidth: 220, borderWidth: 1, borderColor: "#1F2937" },
  calloutTitle: { color: "#fff", fontSize: 12, fontWeight: "700", marginBottom: 3 },
  calloutSub: { color: "#9CA3AF", fontSize: 11, lineHeight: 15 },
  calloutExtra: { color: "#6B7280", fontSize: 10, marginTop: 3 },
  recenterBtn: { position: "absolute", bottom: 16, right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: "#111827", borderWidth: 1, borderColor: "#1F2937", alignItems: "center", justifyContent: "center" },
});
