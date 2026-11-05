// src/screens/ExpertRegister.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  ToastAndroid,
  useColorScheme
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getExpertSession } from '../session/session';
import firestore from '@react-native-firebase/firestore';
import { checkAndPrepareBackgroundLocation, getCurrentLocation } from '../utils/location';
import { checkAndPrepareLocation, isLocationTurnedOn } from '../utils/permissions.ts';




const ExpertRegister: React.FC<any> = ({ navigation }) => {
  const [license, setLicense] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [obscurePassword, setObscurePassword] = useState(true);
  const [obscureConfirm, setObscureConfirm] = useState(true);
  const [error, setError] = useState<string>('');
  const [info, setInfo] = useState<boolean>(false);
  const [infoText, setInfoText] = useState<String>('Checking location permissions...');

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const styles = React.useMemo(() => getStyles(isDark), [isDark]);

  useEffect(() => {
    let isMounted = true;

    const initRegister = async () => {
      const session = await getExpertSession();
      if (!isMounted) return;

      if (session?.expertId) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'DriverMain' }],
        });
        return;
      }

      const enabled = await isLocationTurnedOn();
      if (!isMounted) return;

      if (!enabled) {
        navigation.replace('Login');
      }
    };

    initRegister();

    return () => {
      isMounted = false;
    };
  }, [navigation]);




  const register = async () => {
    setError('');
    setInfo(false);
    setInfoText('Checking location permissions...');

    // Trim and validate license
    const trimmedLicense = license.trim();

    if (!trimmedLicense) {
      setError('Please enter your license number');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // Check if license exists in verifiedExperts
      const verifiedRef = firestore()
        .collection('verifiedExperts')
        .doc(trimmedLicense);

      const verifiedSnap = await verifiedRef.get();

      console.log('License lookup:', trimmedLicense);
      console.log('Document exists:', verifiedSnap.exists);

      if (!verifiedSnap.exists || !verifiedSnap.data()) {
        setError('License number not found. Please contact support.');
        setIsLoading(false);
        return;
      }

      const verifiedData = verifiedSnap.data()!;

      // Check syndicate authorization status
      if (verifiedData.authorizationStatus === 'suspended') {
        setError('This license is currently suspended by the Syndicate.');
        setIsLoading(false);
        return;
      }

      if (verifiedData.authorizationStatus === 'revoked') {
        setError('Syndicate authorization for this license has been permanently revoked.');
        setIsLoading(false);
        return;
      }

      if (!verifiedData.phoneNumber) {
        setError('Invalid license data. Please contact support.');
        setIsLoading(false);
        return;
      }

      // Check if already registered
      if (verifiedData.isRegistered === true) {
        setError('This license is already registered');
        setIsLoading(false);
        return;
      }

      // Check for existing account
      const existingExpertSnap = await firestore()
        .collection('experts')
        .where('verifiedRef', '==', verifiedRef)
        .limit(1)
        .get();

      if (!existingExpertSnap.empty) {
        await verifiedRef.update({ isRegistered: true });
        setError('An account already exists for this license');
        setIsLoading(false);
        return;
      }

      // Get phone number
      const phoneNumber = verifiedData.phoneNumber;

      if (!phoneNumber) {
        setError('Phone number not found. Please contact support.');
        setIsLoading(false);
        return;
      }

      // Check location permission
      console.log('Checking location permission...');
      setInfo(true); // Show progress
      const locationReady = await checkAndPrepareLocation();

      if (!locationReady) {
        setError('Location permission is required to complete registration.');
        setIsLoading(false);
        return;
      }

      // Get current location
      console.log('Getting current location...');
      setInfoText('Getting current location...');
      const location = await getCurrentLocation();

      // Convert to Firestore GeoPoint
      const geoPoint = new firestore.GeoPoint(
        location.latitude,
        location.longitude
      );

      // console.log('Location obtained:', location);
      setError(''); // Clear the progress message
      setInfo(false);
      setInfoText('Checking location permissions...');

      // Create expert account
      const expertDocRef = await firestore()
        .collection('experts')
        .add({
          verifiedRef: verifiedRef,
          password: password, // TODO: Hash in production
          isAvailable: false,
          location: geoPoint,
          createdAt: firestore.FieldValue.serverTimestamp(),
          lastUpdated: firestore.FieldValue.serverTimestamp(),
        });

      // Update verifiedExperts
      await verifiedRef.update({
        isRegistered: true,
      });

      console.log('Expert account created:', expertDocRef.id);
      ToastAndroid.show('Registration successful!', ToastAndroid.SHORT);



      // Navigate to OTP
      navigation.navigate('OTPAuth', {
        phoneNumber,
        isSignUp: true,
        expertDocID: expertDocRef.id,
        licenseID: trimmedLicense,
      });

    } catch (err: any) {
      console.error('Registration error:', err);
      console.error('Error stack:', err.stack);

      if (err.code === 'permission-denied') {
        setError('Permission denied. Please check database rules.');
      } else if (err.code === 'unavailable') {
        setError('Network error. Please check your connection.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };



  const VerificationStep = ({ text }: { text: string }) => (
    <View style={styles.stepRow}>
      <View style={styles.stepDot}><MaterialIcons name="check" size={12} color="#48BB78" /></View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );



  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={22} color="#2D3748" />
        </TouchableOpacity>

        <Text style={styles.title}>Join as Expert</Text>
        <Text style={styles.subtitle}>Create your expert account and get verified</Text>

        <View style={{ height: 16 }} />

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Verification Process:</Text>
          <View style={{ height: 8 }} />
          <VerificationStep text="1. Fill syndicate License Number" />
          <VerificationStep text="2. Create a Password" />
          <VerificationStep text="3. OTP Verification" />
          <VerificationStep text="4. Start receiving calls" />
        </View>

        {/* <View style={{ height: 20 }} /> */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            {info && (
              <>
                <MaterialCommunityIcons name="map-marker-alert" color={isDark ? '#002fbdff' : '#102C7E'} size={14} />
                {infoText}
              </>
            )}
          </Text>
        </View>


        {/* Form */}
        <View style={styles.formCard}>
          <View style={styles.inputWrap}>
            <MaterialIcons name="badge" size={20} color={isDark ? '#F1F5F9' : '#102C7E'} />
            <TextInput
              placeholder="Syndicate License Number"
              placeholderTextColor="#718096"
              style={styles.input}
              value={license}
              onChangeText={(text) => {
                setLicense(text.trim());
                setError('');
              }}
            />
          </View>


          <View style={{ height: 12 }} />

          <View style={styles.inputWrap}>
            <MaterialIcons name="lock" size={20} color={isDark ? '#F1F5F9' : '#102C7E'} />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#718096"
              style={styles.input}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError('');
              }}
              secureTextEntry={obscurePassword}
            />
            <TouchableOpacity onPress={() => setObscurePassword(!obscurePassword)} style={{ padding: 8 }}>
              <MaterialIcons name={obscurePassword ? 'visibility' : 'visibility-off'} size={20} color="#A0AEC0" />
            </TouchableOpacity>
          </View>

          <View style={{ height: 12 }} />

          <View style={styles.inputWrap}>
            <MaterialIcons name="lock" size={20} color={isDark ? '#F1F5F9' : '#102C7E'} />
            <TextInput
              placeholder="Confirm Password"
              placeholderTextColor="#718096"
              style={styles.input}
              value={confirm}
              onChangeText={(text) => {
                setConfirm(text);
                setError('');
              }}
              secureTextEntry={obscureConfirm}
            />
            <TouchableOpacity onPress={() => setObscureConfirm(!obscureConfirm)} style={{ padding: 8 }}>
              <MaterialIcons name={obscureConfirm ? 'visibility' : 'visibility-off'} size={20} color="#A0AEC0" />
            </TouchableOpacity>
          </View>

        </View>



        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>


        <View style={{ height: 10 }} />

        <TouchableOpacity
          style={[styles.registerBtn, isLoading && { opacity: 0.85 }]}
          onPress={register}
          disabled={isLoading}
        >
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerBtnText}>Create Account</Text>}
        </TouchableOpacity>

        <View style={{ height: 20 }} />

        <View style={styles.registerRow}>
          <Text style={{ color: '#718096', fontFamily: 'Outfit-Regular' }}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.replace('ExpertLogin')}>
            <Text style={{ color: isDark ? '#002fbdff' : '#102C7E', fontWeight: '600', fontFamily: 'Outfit-Medium' }}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ExpertRegister;

const getStyles = (isDark: boolean) => StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: isDark ? '#0A0A0F' : '#fff' 
  },
  container: { 
    padding: 24,
    backgroundColor: isDark ? '#0A0A0F' : '#fff',
  },
  back: { 
    padding: 12, 
    marginBottom: 6 
  },
  title: { 
    fontSize: 32, 
    fontFamily: 'Outfit-SemiBold', 
    color: isDark ? '#F7FAFC' : '#2D3748' 
  },
  subtitle: { 
    marginTop: 8, 
    color: isDark ? '#94A3B8' : '#718096', 
    fontSize: 16, 
    fontFamily: 'Outfit-Medium' 
  },

  infoBox: { 
    marginTop: 12, 
    padding: 16, 
    backgroundColor: isDark ? '#1A1A24' : '#F7FAFC', 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: isDark ? '#2D2D3A' : '#E2E8F0' 
  },
  infoTitle: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: isDark ? '#F7FAFC' : '#2D3748', 
    fontFamily: 'Outfit-Medium' 
  },
  stepRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 6 
  },
  stepDot: { 
    width: 20, 
    height: 20, 
    borderRadius: 10, 
    backgroundColor: isDark ? 'rgba(104,211,145,0.15)' : 'rgba(72,187,120,0.1)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  stepText: { 
    marginLeft: 8, 
    color: isDark ? '#94A3B8' : '#718096', 
    fontSize: 12, 
    fontFamily: 'Outfit-Regular' 
  },

  formCard: { 
    marginTop: 8 
  },

  inputWrap: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: isDark ? '#1A1A24' : '#fff', 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: isDark ? '#2D2D3A' : '#E2E8F0', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    shadowColor: isDark ? '#8B5CF6' : '#000', 
    shadowOpacity: isDark ? 0.1 : 0.05, 
    shadowRadius: 6, 
    elevation: isDark ? 0 : 2,
  },
  input: { 
    marginLeft: 12, 
    flex: 1, 
    color: isDark ? '#F7FAFC' : '#2D3748', 
    fontFamily: 'Outfit-Regular' 
  },

  errorContainer: { 
    marginTop: 10, 
    alignItems: 'center', 
    flex: 1 
  },
  errorText: { 
    color: '#EF4444', 
    fontSize: 14, 
    fontFamily: 'Outfit-Regular' 
  },
  infoContainer: { 
    marginTop: 8, 
    alignItems: 'center', 
    flex: 1 
  },
  infoText: { 
    color: isDark ? '#002fbdff' : '#102C7E', 
    fontSize: 14, 
    gap: 5, 
    fontFamily: 'Outfit-Medium' 
  },

  registerBtn: { 
    height: 56, 
    borderRadius: 16, 
    backgroundColor: isDark ? '#002fbdff' : '#102C7E', 
    alignItems: 'center', 
    justifyContent: 'center', 
    elevation: isDark ? 0 : 6,
    shadowColor: isDark ? '#002fbdff' : '#102C7E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.25 : 0.15,
    shadowRadius: 8,
  },
  registerBtnText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '600', 
    fontFamily: 'Outfit-Medium' 
  },

  registerRow: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginTop: 12, 
    alignItems: 'center' 
  },
});
