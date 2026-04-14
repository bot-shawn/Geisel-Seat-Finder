import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { WebView } from 'react-native-webview';

// Define the shape of our data for TypeScript
interface SeatData {
  total: number;
  floors: { [key: string]: number };
}

export default function GeiselApp() {
  // STATE MANAGEMENT
  const [seatData, setSeatData] = useState<SeatData>({ total: 0, floors: {} });
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);

  // Pulled IP Address from .env file to ensure privacy
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const tableauURL = "https://public.tableau.com/views/geisellibraryheatmap/8thfloor?:embed=yes&:showVizHome=no&:toolbar=no&:device=mobile";

  // HEATMAP LOGIC 
  const getHeatmapColor = (percentage: number) => {
    if (percentage < 50) return "#22C55E"; // Green: Low density
    if (percentage < 80) return "#FACC15"; // Yellow: Moderate
    if (percentage < 95) return "#E17100"; // Orange: High
    return "#EF4444";                     // Red: Full/Crowded
  };

  // LIVE SYNC EFFECT
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/seats`);
        if (!response.ok) throw new Error();
        const data = await response.json();
        setSeatData(data);
      } catch (e) {
        console.log("Searching for Python server at: ", API_URL);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [API_URL]);

  // CHECK-IN ACTION
  const handleCheckIn = async () => {
    if (!selectedFloor) {
      Alert.alert("Selection Required", "Please select a floor from the list first.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ floor: selectedFloor }),
      });

      if (res.ok) {
        Alert.alert("Check-in Successful", `You've checked into ${selectedFloor}.`);
      }
    } catch (e) {
      Alert.alert("Connection Error", "Could not reach the seat simulator.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <View style={styles.logoRow}>
              <View style={styles.logoIndicator} />
              <Text style={styles.headerTitle}>Geisel Seats</Text>
            </View>
            <Text style={styles.headerSubtitle}>Real-time Availability</Text>
          </View>
          <View style={styles.availabilityBox}>
            <Text style={styles.totalAvailableLabel}>TOTAL AVAILABLE</Text>
            <View style={styles.numberRow}>
              <Text style={styles.totalCountGold}>{seatData.total}</Text>
              <Text style={styles.totalDenominator}>/3000</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Floor Explorer</Text>

        {/* TABLEAU HEATMAP */}
        <View style={styles.mapContainer}>
          <WebView 
            source={{ uri: tableauURL }} 
            style={styles.webview} 
            scrollEnabled={false} 
          />
        </View>

        {/* INTERACTIVE FLOOR LIST */}
        {[
          { id: "1st Floor (Social)", label: "1st Floor East", type: "Social", cap: 500 },
          { id: "1st Floor (Quiet)", label: "1st Floor West", type: "Quiet", cap: 600 },
          { id: "2nd Floor (Main)", label: "2nd Floor", type: "Main", cap: 1000 },
          { id: "4th Floor (Quiet)", label: "4th Floor", type: "Quiet", cap: 200 },
          { id: "5th Floor (Quiet)", label: "5th Floor", type: "Quiet", cap: 200 },
          { id: "6th Floor (Quiet)", label: "6th Floor", type: "Quiet", cap: 300 },
          { id: "7th Floor (Quiet)", label: "7th Floor", type: "Quiet", cap: 150 },
          { id: "8th Floor (Silent)", label: "8th Floor", type: "Silent", cap: 50 }
        ].map((f) => {
          const available = seatData.floors[f.id] || 0;
          const occupancyPct = Math.min(100, Math.max(0, ((f.cap - available) / f.cap) * 100));
          const dynamicColor = getHeatmapColor(occupancyPct);

          return (
            <TouchableOpacity 
              key={f.id} 
              activeOpacity={0.7}
              onPress={() => setSelectedFloor(f.id)}
              style={[styles.card, selectedFloor === f.id && styles.selectedCard]}
            >
              <View style={styles.leftBadge}>
                <Text style={styles.leftLabel}>Left</Text>
                <Text style={[styles.leftCount, { color: dynamicColor }]}>{available}</Text>
              </View>
              <View style={styles.cardInfo}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.floorName}>{f.label}</Text>
                  <View style={styles.tagContainer}><Text style={styles.tagText}>{f.type}</Text></View>
                </View>
                <View style={styles.progressBg}>
                  <View style={[
                    styles.progressFill, 
                    { width: `${occupancyPct}%` as any, backgroundColor: dynamicColor }
                  ]} />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ACTION FOOTER */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.checkInBtn} onPress={handleCheckIn}>
          <Text style={styles.checkInText}>
            {selectedFloor ? `Check Into ${selectedFloor.split(' ')[0]} Floor` : "Select a Floor"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#182B49', padding: 20, paddingTop: 10 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoIndicator: { width: 4, height: 20, backgroundColor: '#FFCD00', marginRight: 8 },
  headerTitle: { color: 'white', fontSize: 24, fontWeight: '700' },
  headerSubtitle: { color: '#BEDBFF', fontSize: 12 },
  availabilityBox: { alignItems: 'flex-end' },
  numberRow: { flexDirection: 'row', alignItems: 'baseline' },
  totalCountGold: { color: '#FFCD00', fontSize: 30, fontWeight: '700' },
  totalDenominator: { color: '#BEDBFF', fontSize: 16 },
  totalAvailableLabel: { color: 'white', fontSize: 10, fontWeight: '600' },
  body: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, color: '#101828' },
  mapContainer: { height: 260, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  webview: { flex: 1 },
  card: { flexDirection: 'row', backgroundColor: 'white', padding: 16, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  selectedCard: { borderColor: '#1447E6', backgroundColor: '#F0F7FF', borderWidth: 2 },
  leftBadge: { width: 52, height: 52, backgroundColor: '#F9FAFB', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  leftLabel: { color: '#6A7282', fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  leftCount: { fontSize: 18, fontWeight: '700' },
  cardInfo: { flex: 1, justifyContent: 'center' },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  floorName: { fontSize: 16, fontWeight: '700', color: '#101828' },
  tagContainer: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, borderRadius: 6, height: 20, justifyContent: 'center' },
  tagText: { fontSize: 9, fontWeight: '800', color: '#4B5563', textTransform: 'uppercase' },
  progressBg: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  footer: { backgroundColor: 'white', borderTopWidth: 1, borderColor: '#E5E7EB', paddingBottom: 10 },
  checkInBtn: { backgroundColor: '#182B49', margin: 16, padding: 18, borderRadius: 16, alignItems: 'center' },
  checkInText: { color: 'white', fontWeight: 'bold', fontSize: 17 }
});