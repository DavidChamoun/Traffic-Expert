// src/screens/MapPage.tsx
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ToastAndroid,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { makePhoneCall } from '../utils/phone';
import { checkAndPrepareLocation, getCurrentLocation, isLocationTurnedOn } from '../utils/location';
import { useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import { getExpertSession } from '../session/session';

type Props = {
  onCenterPress?: () => void;
};

interface ExpertMarker {
  id: string;
  latitude: number;
  longitude: number;
  fullName: string;
  phoneNumber: string;
  distance: number;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

const DISTANCE_FILTER_KM = 10; // Filter experts within 10 KM


const MapPage: React.FC<Props> = ({ onCenterPress }) => {
  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<ExpertMarker | null>(null);
  const [experts, setExperts] = useState<ExpertMarker[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  // Refs
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapView>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Initial region (Beirut, Lebanon)
  const defaultRegion = useMemo(
    () => ({
      latitude: 33.8938,
      longitude: 35.5018,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }),
    []
  );

  const [userRegion, setUserRegion] = useState(defaultRegion);

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in kilometers
   */
  const calculateDistanceKm = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // Earth's radius in km
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;

      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    []
  );

  /**
   * Center map on user's current location
   */
  // const centerOnUser = useCallback(async () => {
  //   try {
  //     const location = await getCurrentLocation();
  //     const region = {
  //       latitude: location.latitude,
  //       longitude: location.longitude,
  //       latitudeDelta: 0.05,
  //       longitudeDelta: 0.05,
  //     };
  //     setUserRegion(region);
  //     mapRef.current?.animateToRegion(region, 800);
  //   } catch (error) {
  //     console.error('[MapPage] Error centering on user:', error);
  //     ToastAndroid.show('❌ Failed to get your location', ToastAndroid.SHORT);
  //   }
  // }, []);

  /**
   * Initialize location permissions and fetch user location
   */
  const initializeLocation = useCallback(async () => {
    try {
      console.log('[MapPage] 🔍 Initializing location...');
      setLoading(true);
      setMapError(null);

      // Check location permissions
      const locationReady = await checkAndPrepareLocation();
      if (!locationReady) {
        console.error('[MapPage] ❌ Location permission denied');
        setMapError('Location permission is required');
        navigation.replace('Login');
        return;
      }

      // Check if location services are enabled
      const locationEnabled = await isLocationTurnedOn();
      if (!locationEnabled) {
        console.error('[MapPage] ❌ Location services disabled');
        setMapError('Location services are disabled');
        navigation.replace('Login');
        return;
      }

      // Get user's current location
      // const location = await getCurrentLocation();
      // console.log('[MapPage] ✅ User location:', location);
      // setUserLocation(location);

      // Center map on user
      // await centerOnUser();

      setLoading(false);
    } catch (error) {
      console.error('[MapPage] ❌ Location initialization failed:', error);
      setMapError('Failed to initialize location');
      setLoading(false);
    }
  }, [navigation]);

  /**
   * Fetch and filter experts from Firestore
   * Only shows available experts within 10 KM
   */
  const fetchNearbyExperts = useCallback(async () => {
    if (!userLocation) {
      console.log('[MapPage] ⚠️ User location not available yet');
      return;
    }

    try {
      console.log('[MapPage] 📍 Fetching nearby experts...');

      unsubscribeRef.current = firestore()
        .collection('experts')
        .where('isAvailable', '==', true)
        .onSnapshot(
          async (snap) => {
            try {
              console.log('[MapPage] 📦 Got', snap.docs.length, 'available experts');
              const nearbyExperts: ExpertMarker[] = [];

              // Process each expert
              for (const expertDoc of snap.docs) {
                const expertData = expertDoc.data();

                // Validate required fields
                if (!expertData.location || !expertData.verifiedRef) {
                  console.log('[MapPage] ⚠️ Skipping expert', expertDoc.id, '- missing location or verifiedRef');
                  continue;
                }

                // Calculate distance
                const distance = calculateDistanceKm(
                  userLocation.latitude,
                  userLocation.longitude,
                  expertData.location.latitude,
                  expertData.location.longitude
                );

                console.log(`[MapPage] 📍 Expert ${expertDoc.id}: ${distance.toFixed(2)} KM away`);

                // Filter by distance (10 KM)
                if (distance > DISTANCE_FILTER_KM) {
                  console.log(`[MapPage] ⏭️ Expert ${expertDoc.id} is ${distance.toFixed(2)} KM away (> ${DISTANCE_FILTER_KM} KM)`);
                  continue;
                }

                // Get verified expert data
                try {
                  const verifiedSnap = await expertData.verifiedRef.get();

                  if (!verifiedSnap.exists) {
                    console.log('[MapPage] ⚠️ Verified reference not found for expert', expertDoc.id);
                    continue;
                  }

                  const verifiedData = verifiedSnap.data();

                  if (!verifiedData?.fullName || !verifiedData?.phoneNumber) {
                    console.log('[MapPage] ⚠️ Missing verified data for expert', expertDoc.id);
                    continue;
                  }

                  nearbyExperts.push({
                    id: expertDoc.id,
                    latitude: expertData.location.latitude,
                    longitude: expertData.location.longitude,
                    fullName: verifiedData.fullName,
                    phoneNumber: verifiedData.phoneNumber,
                    distance: distance,
                  });

                  console.log(`[MapPage] ✅ Added expert: ${verifiedData.fullName} (${distance.toFixed(2)} KM)`);
                } catch (error) {
                  console.error('[MapPage] ❌ Error fetching verified data for expert', expertDoc.id, ':', error);
                }
              }

              // Sort by distance (nearest first)
              nearbyExperts.sort((a, b) => a.distance - b.distance);

              console.log('[MapPage] ✅ Found', nearbyExperts.length, 'nearby experts');
              setExperts(nearbyExperts);

            } catch (error) {
              console.error('[MapPage] ❌ Error processing experts snapshot:', error);
              setMapError('Failed to load nearby experts');
            }
          },
          (error) => {
            console.error('[MapPage] ❌ Firestore snapshot error:', error);
            setMapError('Failed to connect to expert database');
            ToastAndroid.show('❌ Failed to load experts', ToastAndroid.SHORT);
          }
        );
    } catch (error) {
      console.error('[MapPage] ❌ Error fetching nearby experts:', error);
      setMapError('Failed to fetch experts');
    }
  }, [userLocation, calculateDistanceKm]);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    const initializeMap = async () => {
      try {
        const location = await getCurrentLocation();
        const region = {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setUserRegion(region);
        setUserLocation(location);
        mapRef.current?.animateToRegion(region, 800);
      } catch (error) {
        console.error('[MapPage] Error centering on user:', error);
        ToastAndroid.show('❌ Failed to get your location', ToastAndroid.SHORT);
      }

      initializeLocation();
    };

    initializeMap();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [initializeLocation]);

  /**
   * Fetch experts when user location is available
   */
  useEffect(() => {
    if (userLocation) {
      fetchNearbyExperts();
    }
  }, [userLocation, fetchNearbyExperts]);

  /**
   * Handle expert marker press
   */
  const handleMarkerPress = useCallback((expert: ExpertMarker) => {
    setSelectedExpert(expert);
    setDialogVisible(true);
  }, []);

  /**
   * Handle call button press
   */
  const handleCallExpert = useCallback(() => {
    if (!selectedExpert) return;

    console.log('[MapPage] 📞 Calling expert:', selectedExpert.fullName);
    makePhoneCall(selectedExpert.phoneNumber);
    setDialogVisible(false);
  }, [selectedExpert]);

  /**
   * Handle refresh button press
   */
  const handleRefresh = useCallback(async () => {
    console.log('[MapPage] 🔄 Refreshing location and experts...');
    // await centerOnUser();
    await fetchNearbyExperts();
    ToastAndroid.show('✅ Refreshed', ToastAndroid.SHORT);
  }, [fetchNearbyExperts]);

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#102C7E" />
          <Text style={styles.loadingText}>Loading nearby experts...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (mapError) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#E53E3E" />
          <Text style={styles.errorTitle}>Unable to Load Map</Text>
          <Text style={styles.errorMessage}>{mapError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={initializeLocation}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Main map view
  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={userRegion}
          showsUserLocation
          showsMyLocationButton={true}
          loadingEnabled
          loadingIndicatorColor="#102C7E"
        >
          {/* Display expert markers */}
          {experts.map((expert) => (
            <Marker
              key={expert.id}
              coordinate={{
                latitude: expert.latitude,
                longitude: expert.longitude,
              }}
              title={expert.fullName}
              description={`${expert.distance.toFixed(1)} km away • Available`}
              onPress={() => handleMarkerPress(expert)}
            />
          ))}
        </MapView>

        {/* Control buttons */}
        {/* <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={styles.controlBtn}
            activeOpacity={0.8}
            onPress={handleRefresh}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="refresh" size={24} color="#102C7E" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlBtn}
            activeOpacity={0.8}
            onPress={centerOnUser}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="my-location" size={24} color="#102C7E" />
          </TouchableOpacity>
        </View> */}

        {/* Call button */}
        <View style={styles.callBtnContainer}>
          <TouchableOpacity
            style={[styles.callBtn, experts.length === 0 && styles.callBtnDisabled]}
            activeOpacity={0.85}
            onPress={() => {
              if (experts.length === 0) {
                ToastAndroid.show('No experts available nearby', ToastAndroid.SHORT);
                return;
              }
              // Call nearest expert
              handleMarkerPress(experts[0]);
            }}
            disabled={experts.length === 0}
          >
            <MaterialIcons name="phone" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Expert count indicator
          {experts.length > 0 && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{experts.length}</Text>
            </View>
          )}
             */}
        </View>

        {/* No experts message */}
        {experts.length === 0 && (
          <View style={styles.noExpertsContainer}>
            <MaterialIcons name="person-off" size={40} color="#A0AEC0" />
            <Text style={styles.noExpertsText}>No experts available within 10 km</Text>
            <Text style={styles.noExpertsSubtext}>Move closer or check back later</Text>
          </View>
        )}
      </View>

      {/* Expert selection dialog */}
      <Modal
        visible={dialogVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDialogVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dialog}>
            {selectedExpert && (
              <>
                <View style={styles.dialogHeader}>
                  <View style={styles.avatar}>
                    <MaterialIcons name="engineering" size={24} color="#102C7E" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dialogTitle}>{selectedExpert.fullName}</Text>
                    <Text style={styles.dialogSubtitle}>
                      {selectedExpert.distance.toFixed(1)} km away • Available
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setDialogVisible(false)}>
                    <MaterialIcons name="close" size={24} color="#718096" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.dialogText}>
                  This expert is verified by the Traffic Experts Syndicate and is ready to assist you.
                </Text>

                <View style={styles.actions}>
                  <Pressable
                    style={styles.cancelBtn}
                    onPress={() => setDialogVisible(false)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </Pressable>
                  <Pressable style={styles.confirmBtn} onPress={handleCallExpert}>
                    <MaterialIcons name="phone" size={18} color="#fff" />
                    <Text style={styles.confirmBtnText}>Call Now</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default MapPage;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7FAFC' },
  loadingText: { marginTop: 12, color: '#718096', fontSize: 16, fontFamily: 'Outfit-Medium' },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginTop: 16,
    fontFamily: 'Outfit-Bold',
  },
  errorMessage: {
    fontSize: 14,
    color: '#718096',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Outfit-Medium',
  },
  retryBtn: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#102C7E',
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontFamily: 'Outfit-Medium',
  },
  controlsContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    gap: 12,
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  callBtnContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    alignItems: 'center',
  },
  callBtn: {
    width: 56,
    height: 56,
    backgroundColor: '#48BB78',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#48BB78',
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  callBtnDisabled: {
    backgroundColor: '#A0AEC0',
    opacity: 0.6,
  },
  badgeContainer: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#E53E3E',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  noExpertsContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  noExpertsText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    textAlign: 'center',
  },
  noExpertsSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dialog: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 8,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(16, 44, 126, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    fontFamily: 'Outfit-Medium',
  },
  dialogSubtitle: {
    fontSize: 13,
    color: '#48BB78',
    marginTop: 4,
    fontWeight: '500',
    fontFamily: 'Outfit-Regular',
  },
  dialogText: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
    marginBottom: 20,
    fontFamily: 'Outfit-Regular',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelBtnText: {
    color: '#718096',
    fontWeight: '600',
    fontFamily: 'Outfit-Medium',
  },
  confirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#48BB78',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confirmBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontFamily: 'Outfit-Medium',
  },
});