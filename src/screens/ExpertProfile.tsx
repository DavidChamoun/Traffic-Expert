// src/screens/ExpertProfile.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  ToastAndroid,
  Pressable,
  Modal,
  useColorScheme
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ActivityIndicator } from 'react-native';
import { getExpertSession, clearExpertSession } from '../session/session.tsx';
import { getCurrentLocation } from '../utils/location.ts';
import { checkAndPrepareLocation, isLocationTurnedOn, requestBatteryUnrestricted } from '../utils/permissions.ts';
import { updateExpertLocation } from '../utils/firestoreService.ts';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { isTrackingActive, startTracking, stopTracking } from '../utils/backgroundLocationService';
import useDoubleBackExit from '../utils/doubleBackService.ts';


type NavigationProp = NativeStackNavigationProp<RootStackParamList>;


// const user = auth().currentUser;

interface ExpertProfileData {
  fullName: string;
  phoneNumber: string;
  licenseId: string;
  lastUpdated: string;
}``

const ExpertProfile: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [isAvailable, setIsAvailable] = useState<boolean>();
  // const [expertInfo, setExpertInfo] = useState<any>(null);
  const [expertInfo, setExpertInfo] = useState<ExpertProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationIsLoading, setLocationIsLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [trackingEnabled, setTrackingEnabled] = useState(false);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const styles = getStyles(isDark);


  useDoubleBackExit();


  const updateLocation = async () => {

    setLocationIsLoading(true);

    const locationReady = await checkAndPrepareLocation();

    if (!locationReady) {
      console.error('Location permission is required to complete registration.');
      setLocationIsLoading(false);
      return;
    }



    try {
      console.log('Updating current location...');
      const location = await getCurrentLocation();
      const session = await getExpertSession();
      if (!session) return;

      // Convert to Firestore GeoPoint
      const geoPoint = new firestore.GeoPoint(
        location.latitude,
        location.longitude
      );

      await updateExpertLocation(
        session.expertId,
        location.latitude,
        location.longitude

      );
    } catch (error) {
      console.error('Failed to update location..');
      ToastAndroid.show('Failed to update location', ToastAndroid.SHORT);
    } finally {
      setLocationIsLoading(false);
    }
  }

  // useEffect(() => {
  //   const fetchExpert = async () => {
  //     const user = auth().currentUser;

  //     if (!user) {
  //       navigation.replace('ExpertLogin');
  //       return;
  //     }

  //     const doc = await firestore()
  //       .collection('experts')
  //       .doc(user.uid)
  //       .get();

  //     if (doc.exists) {
  //       setExpertInfo(doc.data());
  //     }

  //     setLoading(false);
  //   };

  //   fetchExpert();
  // }, []);


  useEffect(() => {
    const loadExpert = async () => {
      try {
        setLoading(true);

        // 1️⃣ Get session
        const session = await getExpertSession();
        if (!session) return;

        // 2️⃣ Fetch expert document
        const expertSnap = await firestore()
          .collection('experts')
          .doc(session.expertId)
          .get();

        if (!expertSnap.exists) return;

        const expertData = expertSnap.data()!;

        setIsAvailable(expertData.isAvailable ?? false);
        setTrackingEnabled(expertData.isTrackingEnabled ?? false);


        // 3️⃣ Resolve verifiedRef
        const verifiedRef = expertData?.verifiedRef;
        if (!verifiedRef) return;

        const verifiedSnap = await verifiedRef.get();
        if (!verifiedSnap.exists) return;

        const verifiedData = verifiedSnap.data();

        // 4️⃣ Map to UI
        setExpertInfo({
          fullName: verifiedData.fullName,
          phoneNumber: verifiedData.phoneNumber,
          licenseId: verifiedSnap.id,
          lastUpdated: expertData.lastUpdated
            ? expertData.lastUpdated.toDate().toDateString()
            : '—',
        });


      } catch (e) {
        console.error('Failed to load expert profile:', e);
      } finally {
        setLoading(false);
      }
    };

    loadExpert();
  }, []);




  const toggleAvailability = async (value: boolean) => {
    setIsAvailable(value);

    const session = await getExpertSession();
    if (!session) return;

    await firestore()
      .collection('experts')
      .doc(session.expertId)
      .update({
        isAvailable: value,
        lastUpdated: firestore.FieldValue.serverTimestamp(),
      });
    ToastAndroid.show('Status updated', ToastAndroid.SHORT);
  };


  const toggleTrackingLocation = async (value: boolean) => {
    if (value) {
      const locationReady = await checkAndPrepareLocation();

      if (!locationReady) {
        console.error('Location permission is required to complete registration.');
        setLocationIsLoading(false);
        return;
      }
      await requestBatteryUnrestricted();
    }
    setTrackingEnabled(value);

    const session = await getExpertSession();
    if (!session) return;

    await firestore()
      .collection('experts')
      .doc(session.expertId)
      .update({
        isTrackingEnabled: value,
        lastUpdated: firestore.FieldValue.serverTimestamp(),
      });

    if (value) {
      await startTracking();
    } else {
      await stopTracking();
    }

    // ToastAndroid.show('Tracking status updated', ToastAndroid.SHORT);
  };


  const logout = async () => {

    // Navigate to login or success screen
    await clearExpertSession();
    if (await isTrackingActive()) {
      stopTracking();
    }

    ToastAndroid.show('Logged out successfully', ToastAndroid.LONG);

    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });

  };






  const infoRows = [
    { label: 'Full Name', value: expertInfo?.fullName, icon: 'person' },
    { label: 'Phone Number', value: expertInfo?.phoneNumber, icon: 'phone' },
    { label: 'Syndicate License Number', value: expertInfo?.licenseId, icon: 'badge' },
    { label: 'Last Updated', value: expertInfo?.lastUpdated, icon: 'calendar-today' },
  ];


  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.loadingScreen]}>
        <ActivityIndicator size="large" color="#102C7E" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Profile Header */}
        <View style={styles.headerWrap}>
          <LinearGradient
            colors={['#102C7E', '#764BA2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <MaterialIcons name="person" size={50} color="#fff" />
          </LinearGradient>

          <Text style={styles.name}>{expertInfo?.fullName}</Text>


          <View style={[styles.statusPill, { borderColor: isAvailable ? '#48BB78' : '#E53E3E' }]}>
            <View style={[styles.statusDot, { backgroundColor: isAvailable ? '#48BB78' : '#E53E3E' }]} />
            <Text style={[styles.statusText, { color: isAvailable ? '#48BB78' : '#E53E3E' }]}>
              {isAvailable ? 'Available for Calls' : 'Currently Busy'}
            </Text>
          </View>
        </View>

        {/* Availability Toggle */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="phone" size={24} color="#102C7E" />
            </View>

            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={styles.cardTitle}>Availability Status</Text>
              <Text style={styles.cardSub}>Toggle your availability to receive calls</Text>
            </View>

            <Switch
              value={isAvailable}
              onValueChange={toggleAvailability}
              trackColor={{ true: '#48BB78', false: '#DDD' }}
              thumbColor={isAvailable ? '#fff' : '#fff'}
            />
          </View>
        </View>

        {/* Expert Information */}
        <View style={styles.infoContainer}>
          <View style={styles.infoHeader}>
            <MaterialIcons name="info" size={20} color="#102C7E" />
            <Text style={styles.infoHeaderText}>  Expert Information</Text>
          </View>

          {infoRows.map((row, index) => (
            <View key={index} style={styles.infoItem}>
              <View style={styles.infoIconWrap}>
                <MaterialIcons name={row.icon} size={20} color="#102C7E" />
              </View>

              <View style={{ marginLeft: 16 }}>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>{row.value ?? '—'}</Text>
              </View>
            </View>
          ))}

        </View>


        {/* Tracking location */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.passwordIconCircle}>
              <MaterialCommunityIcons name="map-marker-check" size={20} color="#102C7E" />
            </View>

            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={styles.cardTitle}>Location Tracking</Text>
              <Text style={styles.cardSub}>Enable location tracking to keep your position updated in the background.
                Please make sure location services are turned on and allow unrestricted battery usage for reliable tracking.
                Note: On some devices, tracking may be paused when the app is closed or the system restricts background activity.</Text>
            </View>

            <Switch
              value={trackingEnabled}
              onValueChange={toggleTrackingLocation}
              trackColor={{ true: '#48BB78', false: '#DDD' }}
              thumbColor={trackingEnabled ? '#fff' : '#fff'}
            />
          </View>
        </View>


        {/* Update Expert Location */}
        <TouchableOpacity
          style={[
            styles.changePasswordCard,
            locationIsLoading && { opacity: 0.6 }
          ]}
          onPress={updateLocation}
          activeOpacity={0.8}
          disabled={locationIsLoading}
        >
          <View style={{ position: 'relative' }}>

            <View style={styles.row}>
              <View style={styles.passwordIconCircle}>
                <MaterialIcons name="location-pin" size={20} color="#102C7E" />
              </View>

              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.cardTitle}>Update Location</Text>
                <Text style={styles.cardSub}>Update your current location</Text>
              </View>
            </View>

            {locationIsLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color="#102C7E" />
              </View>
            )}
          </View>

        </TouchableOpacity>



        {/* Change Password Section */}
        <TouchableOpacity
          style={styles.changePasswordCard}
          onPress={() => navigation.navigate('ChangePassword')}
          activeOpacity={0.8}
        >
          <View style={styles.row}>
            <View style={styles.passwordIconCircle}>
              <MaterialIcons name="lock" size={20} color="#102C7E" />
            </View>

            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={styles.cardTitle}>Change Password</Text>
              <Text style={styles.cardSub}>Update your account password</Text>
            </View>

            <MaterialIcons name="chevron-right" size={24} color="#A0AEC0" />
          </View>
        </TouchableOpacity>


        {/* Verification Badge */}
        <View style={[styles.verifWrap, {
          backgroundColor: isDark ? 'rgba(104,211,145,0.08)' : '#F0FFF4',
          borderColor: isDark ? 'rgba(104,211,145,0.3)' : '#48BB78'
        }]}>
          <View style={[styles.verifIconWrap, {
            backgroundColor: isDark ? 'rgba(104,211,145,0.15)' : 'rgba(72,187,120,0.1)'
          }]}>
            <MaterialIcons name="verified-user" size={24} color={isDark ? '#68D391' : '#48BB78'} />
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={[styles.verifTitle, { color: isDark ? '#F7FAFC' : '#2D3748' }]}>
              Verified Expert
            </Text>
            <Text style={[styles.verifText, { color: isDark ? '#94A3B8' : '#718096' }]}>
              Your account is verified by Traffic Experts Syndicate. All information is certified and cannot be modified.
            </Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, {
            backgroundColor: isDark ? 'rgba(252,129,129,0.08)' : 'rgba(229,62,62,0.05)',
            borderColor: isDark ? 'rgba(252,129,129,0.3)' : '#FED7D7'
          }]}
          onPress={() => setDialogVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.logoutButtonContent}>
            <MaterialIcons name="logout" size={24} color={isDark ? '#FC8181' : '#E53E3E'} />
            <Text style={[styles.logoutButtonText, { color: isDark ? '#FC8181' : '#E53E3E' }]}>
              Logout
            </Text>
          </View>
        </TouchableOpacity>


        {/* Expert selection dialog */}
        <Modal
          visible={dialogVisible}
          transparent
          animationType="none"
          onRequestClose={() => setDialogVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.dialog}>

              <Text style={styles.dialogText}>
                Are you sure you want to log out?
              </Text>

              <View style={styles.actions}>
                <Pressable
                  style={styles.cancelBtn}
                  onPress={() => setDialogVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.confirmBtn} onPress={logout}>
                  <MaterialIcons name="logout" size={18} color="#dd1919ff" />
                  <Text style={styles.confirmBtnText}>Logout</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>



        <View style={{ height: 22 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ExpertProfile;

const getStyles = (isDark: boolean) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: isDark ? '#0A0A0F' : '#fff'
  },
  container: {
    padding: 24,
    backgroundColor: isDark ? '#0A0A0F' : '#fff',
  },
  headerWrap: {
    alignItems: 'center',
    marginTop: 6
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 120,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: isDark ? '#8B5CF6' : '#102C7E',
    shadowOpacity: isDark ? 0.25 : 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: isDark ? '#F7FAFC' : '#2D3748',
    marginTop: 18,
    fontFamily: 'Outfit-SemiBold'
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 8
  },
  statusText: {
    marginLeft: 8,
    fontWeight: '600',
    fontFamily: 'Outfit-Medium'
  },

  card: {
    marginTop: 32,
    padding: 20,
    borderRadius: 16,
    backgroundColor: isDark ? '#1A1A24' : '#fff',
    borderWidth: 1,
    borderColor: isDark ? '#2D2D3A' : '#E2E8F0',
    shadowColor: isDark ? '#8B5CF6' : '#000',
    shadowOpacity: isDark ? 0.1 : 0.05,
    shadowRadius: 10,
    elevation: isDark ? 0 : 3,
  },
  changePasswordCard: {
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: isDark ? '#1A1A24' : '#fff',
    borderWidth: 1,
    borderColor: isDark ? '#2D2D3A' : '#E2E8F0',
    shadowColor: isDark ? '#8B5CF6' : '#000',
    shadowOpacity: isDark ? 0.1 : 0.05,
    shadowRadius: 10,
    elevation: isDark ? 0 : 3,
  },
  passwordIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(10,10,15,0.5)' : 'rgba(255,255,255,0.1)',
    borderRadius: 16
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#F7FAFC' : '#2D3748',
    fontFamily: 'Outfit-Medium'
  },
  cardSub: {
    marginTop: 4,
    color: isDark ? '#94A3B8' : '#718096',
    fontSize: 12,
    fontFamily: 'Outfit-Regular'
  },

  infoContainer: {
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDark ? '#2D2D3A' : '#E2E8F0',
    backgroundColor: isDark ? '#1A1A24' : '#fff',
    shadowColor: isDark ? '#8B5CF6' : '#000',
    shadowOpacity: isDark ? 0.1 : 0.05,
    shadowRadius: 10,
    elevation: isDark ? 0 : 2,
  },
  infoHeader: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center'
  },
  infoHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: isDark ? '#F7FAFC' : '#2D3748',
    fontFamily: 'Outfit-Medium'
  },

  infoItem: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'flex-start'
  },
  infoItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#2D2D3A' : '#E2E8F0'
  },
  infoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  infoLabel: {
    color: isDark ? '#94A3B8' : '#718096',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Outfit-Medium'
  },
  infoValue: {
    marginTop: 4,
    color: isDark ? '#F7FAFC' : '#2D3748',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Outfit-Medium'
  },

  verifWrap: {
    marginTop: 24,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  verifIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center'
  },
  verifTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Outfit-Medium'
  },
  verifText: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'Outfit-Regular'
  },

  // Logout Button
  logoutButton: {
    marginTop: 32,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center'
  },
  logoutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    fontFamily: 'Outfit-Medium'
  },

  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDark ? '#0A0A0F' : '#fff'
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.2)',
  },
  dialog: {
    width: '85%',
    backgroundColor: isDark ? '#1A1A24' : '#fff',
    borderRadius: 16,
    padding: 24,
    elevation: 8,
    borderWidth: isDark ? 1 : 0,
    borderColor: isDark ? '#2D2D3A' : 'transparent',
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: isDark ? '#F7FAFC' : '#2D3748',
    fontFamily: 'Outfit-SemiBold',
    marginBottom: 8,
  },
  dialogText: {
    fontSize: 16,
    color: isDark ? '#94A3B8' : '#718096',
    lineHeight: 22,
    fontFamily: 'Outfit-Regular',
  },
  actions: {
    marginTop: 25,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isDark ? '#2D2D3A' : '#E2E8F0',
  },
  cancelBtnText: {
    color: isDark ? '#94A3B8' : '#718096',
    fontWeight: '600',
    fontFamily: 'Outfit-Medium',
  },
  confirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confirmBtnText: {
    color: '#dd1919ff',
    fontWeight: '600',
    fontFamily: 'Outfit-Medium',
  },
});
