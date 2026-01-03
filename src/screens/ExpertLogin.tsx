// src/screens/ExpertLogin.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  ToastAndroid,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';
import { getExpertSession } from '../session/session';
import { getCurrentLocation, isLocationTurnedOn } from '../utils/location';




const ExpertLogin: React.FC<any> = ({ navigation }) => {
  const [identifier, setIdentifier] = useState<string>(''); // email or license
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [obscure, setObscure] = useState(true);
  const [error, setError] = useState<string>('');


  useEffect(() => {
    const checkSession = async () => {
      const session = await getExpertSession();

      if (session?.expertId) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'DriverMain' }],
        });

        // ToastAndroid.show('Session loaded...', ToastAndroid.LONG);
      }
    };

    checkSession();

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



  interface Expert {
    id: string;
    password: string;
    verifiedRef: string; // licenseID
  }



  const validateAndSubmit = async () => {
    setError('');

    if (!identifier.trim()) {
      setError('Please enter your license number');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      await authenticateExpert();
    } catch (e) {
      console.error(e);
      setError('Something went wrong');
    } finally {
      setIsLoading(false);
    }


    // setIsLoading(true);
    // // Simulate API call
    // setTimeout(() => {
    //   setIsLoading(false);
    //   Alert.alert('Success', 'Login successful!');
    //   // set global isExpert flag or navigate to driver_main
    //   navigation.replace('DriverMain'); // or navigate accordingly

    //   navigation.navigate('OTPAuth', {
    //     phoneNumber: '+961 71 123 456', // User's phone number
    //     isSignUp: false, // true for sign-up, false for login
    //     expertData: {}, // Optional: pass expert data for sign-up
    //   });
    // }, 1500);
  };

  const authenticateExpert = async () => {
    setError('');

    try {
      // Reference to verified expert using license ID
      const licenseRef = firestore()
        .collection('verifiedExperts')
        .doc(identifier); // e.g. "150"

      // Find expert linked to this verified license
      const snapshot = await firestore()
        .collection('experts')
        .where('verifiedRef', '==', licenseRef)
        .limit(1)
        .get();

      if (snapshot.empty) {
        setError('Invalid License Number');
        return;
      }

      const expertDoc = snapshot.docs[0];
      const expertDocID = expertDoc.id;
      const expert = expertDoc.data() as Expert;

      // Check password
      if (expert.password !== password) {
        setError('Incorrect Password');
        return;
      }

      // 🔹 Resolve the reference to get phone number
      const verifiedSnap = await licenseRef.get();

      if (!verifiedSnap.exists) {
        setError('Verified expert record not found');
        return;
      }

      const verifiedData = verifiedSnap.data();

      const phoneNumber = verifiedData?.phoneNumber;

      if (!phoneNumber) {
        setError('Phone number not found');
        return;
      }

      

      // ✅ Navigate to OTP screen
      navigation.navigate('OTPAuth', {
        phoneNumber,
        isSignUp: false,
        expertDocID
      });

    } catch (error) {
      console.error(error);
      setError('Authentication failed. Try again.');
    }
  };




  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={22} color="#2D3748" />
        </TouchableOpacity>

        <View style={styles.safeLogin}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your expert account</Text>

          <View style={{ height: 16 }} />

          <View style={styles.badge}>
            <MaterialIcons name="verified" size={16} color="#48BB78" />
            <Text style={styles.badgeText}> Certified Traffic Expert</Text>
          </View>

          <View style={{ height: 24 }} />

          {/* Form */}
          <View style={styles.formCard}>
            <View style={styles.inputWrap}>
              <MaterialIcons name="badge" size={20} color="#102C7E" />
              <TextInput
                placeholder="License Number"
                placeholderTextColor="#718096"
                style={styles.input}
                value={identifier}
                onChangeText={(text) => {
                  setIdentifier(text);
                  setError('');
                }}
                autoCapitalize="none"
              />
            </View>

            <View style={{ height: 12 }} />

            <View style={styles.inputWrap}>
              <MaterialIcons name="lock" size={20} color="#102C7E" />
              <TextInput
                placeholder="Password"
                placeholderTextColor="#718096"
                style={styles.input}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError('');
                }}
                secureTextEntry={obscure}
              />
              <TouchableOpacity onPress={() => setObscure(!obscure)} style={{ padding: 8 }}>
                <MaterialIcons name={obscure ? 'visibility' : 'visibility-off'} size={20} color="#A0AEC0" />
              </TouchableOpacity>
            </View>

            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>

          </View>

          <View style={{ height: 8 }} />

          <TouchableOpacity
            style={[styles.signInBtn, isLoading && { opacity: 0.8 }]}
            onPress={validateAndSubmit}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signInText}>Sign In</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={{ marginTop: 16 }} onPress={() => {
            // mark isExpert and navigate (mimic Flutter behavior)
            // navigation.navigate('ForgotPasswordStep1');
            navigation.navigate('FirestoreTest');

          }}>
            <Text style={styles.forgot}>Forgot Password?</Text>
          </TouchableOpacity>

          <View style={{ height: 28 }} />

          <View style={styles.registerRow}>
            <Text style={{ color: '#718096' }}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.replace('ExpertRegister')}>
              <Text style={{ color: '#102C7E', fontWeight: '600' }}>Register Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ExpertLogin;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff',  },
  safeLogin: { height: '100%', display: 'flex', justifyContent: 'center', marginBottom: 70 },
  container: { padding: 24, height: '100%', display: 'flex', justifyContent: 'center' },
  back: { padding: 8, marginTop: 12, marginBottom: 8 },
  title: { fontSize: 32, textAlign: 'center', fontWeight: '700', color: '#2D3748' },
  subtitle: { marginTop: 8, textAlign: 'center', color: '#718096', fontSize: 16 },

  badge: { marginTop: 16, alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0FFF4', borderWidth: 1, borderColor: '#48BB78', flexDirection: 'row', alignItems: 'center' },
  badgeText: { color: '#48BB78', marginLeft: 8 },

  formCard: { marginTop: 18 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  input: { marginLeft: 12, flex: 1, color: '#2D3748' },
  errorContainer: { marginTop: 8, alignItems: 'center', flex: 1 },
  errorText: { color: 'red', fontSize: 14 },

  signInBtn: { height: 56, borderRadius: 16, backgroundColor: '#102C7E', alignItems: 'center', justifyContent: 'center', elevation: 6 },
  signInText: { color: '#fff', fontSize: 18, fontWeight: '600' },

  forgot: { textAlign: 'center', color: '#102C7E', fontWeight: '500' },

  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 8, alignItems: 'center' },
});
