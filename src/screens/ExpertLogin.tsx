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
  useColorScheme,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';
import { getExpertSession } from '../session/session';
import { getCurrentLocation } from '../utils/location';
import { isLocationTurnedOn } from '../utils/permissions.ts';





const ExpertLogin: React.FC<any> = ({ navigation }) => {
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [obscure, setObscure] = useState(true);
  const [error, setError] = useState<string>('');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const styles = React.useMemo(() => getStyles(isDark), [isDark]);

  useEffect(() => {
    let isMounted = true;

    const initLogin = async () => {
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

    initLogin();

    return () => {
      isMounted = false;
    };
  }, [navigation]);



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
  };

  const authenticateExpert = async () => {
    setError('');

    try {
      // Reference to verified expert using license ID
      const licenseRef = firestore()
        .collection('verifiedExperts')
        .doc(identifier);

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


      const verifiedSnap = await licenseRef.get();

      if (!verifiedSnap.exists) {
        setError('Verified expert record not found');
        return;
      }

      const verifiedData = verifiedSnap.data();

      // Check syndicate authorization status
      if (verifiedData?.authorizationStatus === 'suspended') {
        setError('Your license is currently suspended by the Syndicate. Login disabled.');
        return;
      }

      if (verifiedData?.authorizationStatus === 'revoked') {
        setError('Syndicate authorization has been permanently revoked. Access is barred.');
        return;
      }

      const phoneNumber = verifiedData?.phoneNumber;

      if (!phoneNumber) {
        setError('Phone number not found');
        return;
      }



      // Navigate to OTP screen
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
      <View style={styles.container}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#2D3748" />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your expert account</Text>

          <View style={{ height: 16 }} />

          <View style={styles.badge}>
            <MaterialIcons name="verified" size={16} color="#48BB78" />
            <Text style={styles.badgeText}>Certified Traffic Expert</Text>
          </View>

          <View style={{ height: 24 }} />

          {/* Form */}
          <View style={styles.formCard}>
            <View style={styles.inputWrap}>
              <MaterialIcons name="badge" size={20} color={isDark ? '#F1F5F9' : '#102C7E'} />
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
                secureTextEntry={obscure}
              />
              <TouchableOpacity onPress={() => setObscure(!obscure)} style={{ padding: 8 }}>
                <MaterialIcons name={obscure ? 'visibility' : 'visibility-off'} size={20} color="#A0AEC0" />
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
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
            navigation.navigate('ForgotPasswordStep1');
          }}>
            <Text style={styles.forgot}>Forgot Password?</Text>
          </TouchableOpacity>

          <View style={{ height: 28 }} />

          <View style={styles.registerRow}>
            <Text style={{ color: '#718096', fontFamily: 'Outfit-Regular' }}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.replace('ExpertRegister')}>
              <Text style={{ color: isDark ? '#002fbdff' : '#102C7E', fontWeight: '600', fontFamily: 'Outfit-Medium' }}>Register Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>);
};

export default ExpertLogin;

const getStyles = (isDark: boolean) => StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: isDark ? '#0A0A0F' : '#fff' 
  },
  container: { 
    flex: 1, 
    padding: 24, 
    marginBottom: 60,
    backgroundColor: isDark ? '#0A0A0F' : '#fff',
  },
  back: { 
    padding: 12 
  },
  content: { 
    flex: 1, 
    justifyContent: 'center' 
  },
  title: { 
    fontSize: 32, 
    textAlign: 'center', 
    color: isDark ? '#F7FAFC' : '#2D3748', 
    fontFamily: 'Outfit-SemiBold' 
  },
  subtitle: { 
    marginTop: 8, 
    textAlign: 'center', 
    fontFamily: 'Outfit-Medium', 
    color: isDark ? '#94A3B8' : '#718096', 
    fontSize: 16 
  },

  badge: { 
    marginTop: 16, 
    alignSelf: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: isDark ? 'rgba(72,187,120,0.15)' : '#F0FFF4', 
    borderWidth: 1, 
    borderColor: isDark ? 'rgba(72,187,120,0.3)' : '#48BB78', 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  badgeText: { 
    color: isDark ? '#68D391' : '#48BB78', 
    marginLeft: 8, 
    fontFamily: 'Outfit-Regular' 
  },

  formCard: { 
    marginTop: 18 
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
    marginTop: 12, 
    alignItems: 'center' 
  },
  errorText: { 
    color: '#EF4444', 
    fontSize: 14, 
    fontFamily: 'Outfit-Regular' 
  },

  signInBtn: { 
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
  signInText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '600', 
    fontFamily: 'Outfit-Medium' 
  },

  forgot: { 
    textAlign: 'center', 
    color: isDark ? '#002fbdff' : '#102C7E', 
    fontWeight: '500', 
    fontFamily: 'Outfit-Medium' 
  },

  registerRow: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginTop: 8, 
    alignItems: 'center' 
  },
});

