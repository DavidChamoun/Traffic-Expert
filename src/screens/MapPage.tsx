// src/screens/MapPage.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, Pressable } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { makePhoneCall } from '../utils/phone';
import { checkAndPrepareLocation, isLocationTurnedOn } from '../utils/location';
import { useNavigation } from '@react-navigation/native';

type Props = {
  onCenterPress?: () => void;
};

const MapPage: React.FC<Props> = ({ onCenterPress }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const navigation = useNavigation<any>();


  useEffect(() => {
    (async () => {
      // 1. Check permission + prepare location
      // await checkAndPrepareLocation();

      // 2. Check if GPS/location services are enabled
      const enabled = await isLocationTurnedOn();

      if (!enabled) {
        navigation.replace('Login');
      }
    })();
  }, []);


  // TEST location (Beirut)
  const testLocation = {
    latitude: 33.8938,
    longitude: 35.5018,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };


  // UI-only: simulate current position loader
  return (
    <View style={styles.container}>
      {/* <View style={styles.mapPlaceholder}>
        {loading ? <ActivityIndicator size="large" color="#102C7E" /> : <Text style={styles.mapText}>Map Placeholder</Text>}
      </View> */}

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={testLocation}
          provider={PROVIDER_GOOGLE}
          loadingEnabled={true}   // ✅ correct usage
          showsUserLocation={true}
          showsMyLocationButton={true}

        >


          {/* Test Marker */}
          <Marker
            coordinate={{ latitude: 33.8938, longitude: 35.5018 }}
            title="Test Expert"
            description="This is a test expert location"
          />
          <Marker
            coordinate={{ latitude: 33.9844436, longitude: 35.641788 }}
            title="Test Expert"
            description="This is a test expert location"
          />

        </MapView>

        <View style={styles.callBtnContainer}>
          <TouchableOpacity style={styles.callBtn} activeOpacity={0.85} onPress={() => setDialogVisible(true)}>
            <MaterialIcons name="phone" size={22} color="#fff" />
            {/* <Text style={styles.callText}>  Call Nearest Expert</Text> */}
          </TouchableOpacity>
        </View>
      </View>




      <Modal visible={dialogVisible} transparent animationType="fade" onRequestClose={() => setDialogVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.dialog}>
            <View style={styles.row}>
              <View style={styles.avatar}>
                <MaterialIcons name="engineering" size={22} color="#102C7E" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dialogTitle}>Traffic Expert Center</Text>
                <Text style={styles.dialogSubtitle}>0.8 km away • Available</Text>
              </View>
            </View>

            <Text style={styles.dialogText}>
              This expert is verified by the Traffic Experts Syndicate and is the closest to your location.
            </Text>

            <View style={styles.actions}>
              <Pressable style={styles.cancelBtn} onPress={() => setDialogVisible(false)}>
                <Text style={{ color: '#718096' }}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.confirmBtn}
                onPress={() => {
                  setDialogVisible(false);
                  makePhoneCall('01234567'); // placeholder number
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Call Now</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default MapPage;

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7FAFC' },
  mapText: { color: '#718096' },
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  callBtnContainer: {
    width: '100%',
    padding: 20,
    bottom: 0,
    position: 'absolute',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end'
  },
  callBtn: {
    width: 55,
    height: 55,
    backgroundColor: '#48BB78',
    borderRadius: 16,
    paddingVertical: 14,
    zIndex: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 6,
  },
  callText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.35)' },
  dialog: { width: '90%', backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(16,44,126,0.06)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  dialogTitle: { fontSize: 16, fontWeight: '600', color: '#2D3748' },
  dialogSubtitle: { fontSize: 12, color: '#48BB78', marginTop: 4 },
  dialogText: { color: '#718096', marginBottom: 12 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end' },
  cancelBtn: { padding: 10, marginRight: 8 },
  confirmBtn: { padding: 10, backgroundColor: '#48BB78', borderRadius: 8, paddingHorizontal: 16 },
});
