// src/screens/OTPAuthScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  ToastAndroid,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import auth, { firebase, FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { saveExpertSession } from '../session/session';


const { width, height } = Dimensions.get('window');

// Responsive size functions
const responsiveSize = (size: number) => {
  const scale = width / 375;
  return Math.round(size * scale);
};

const responsiveVertical = (size: number) => {
  const scale = height / 812;
  return Math.round(size * scale);
};

interface OTPAuthScreenProps {
  route?: {
    params?: {
      phoneNumber?: string;
      isSignUp?: boolean;
      expertData?: any; // For sign-up, you might have expert data
      expertDocID?: string;
      licenseID?: string;
      forgotPassword?: boolean;
      isChangePassword?: boolean,
    };
  };
  navigation: any;
}

const OTPAuthScreen: React.FC<OTPAuthScreenProps> = ({ route, navigation }) => {
  const { phoneNumber = '+961 71 123 456', isSignUp = false, expertDocID = '', licenseID = '', forgotPassword = false, isChangePassword = false } = route?.params || {};

  const TEST_PHONE = '+96176132529';
  const IS_TEST_MODE = true;
  const TEST_OTP = '123456';



  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [timer, setTimer] = useState<number>(60);
  const [isResendEnabled, setIsResendEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [confirmation, setConfirmation] =
    useState<FirebaseAuthTypes.ConfirmationResult | null>(null);


  const inputsRef = useRef<TextInput[]>([]);

  // useEffect(() => {
  //   sendOTP();

  //   if (timer > 0) {
  //     const interval = setInterval(() => {
  //       setTimer(prev => {
  //         if (prev <= 1) {
  //           setIsResendEnabled(true);
  //           clearInterval(interval);
  //           return 0;
  //         }
  //         return prev - 1;
  //       });
  //     }, 1000);

  //     return () => clearInterval(interval);
  //   }
  // }, []);

  useEffect(() => {
    sendOTP();

    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsResendEnabled(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);



  const sendOTP = async () => {
    if (IS_TEST_MODE) {
      console.log('TEST MODE: OTP is 123456');
      setConfirmation({} as any); // fake session
      return;
    }

    try {
      const result = await auth().signInWithPhoneNumber(phoneNumber);
      setConfirmation(result);
    } catch (error) {
      console.error(error);
      setError('Failed to send OTP');
    }
  };





  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return; // Only allow numbers

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    // If deleting, focus previous input
    if (!value && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  // const handleVerify = async () => {
  //   const otpString = otp.join('');

  //   if (otpString.length !== 6) {
  //     setError('Please enter complete 6-digit OTP');
  //     return;
  //   }

  //   if (!confirmation) {
  //     setError('OTP session expired. Please resend.');
  //     return;
  //   }

  //   setIsLoading(true);

  //   try {
  //     await confirmation.confirm(otpString);

  //     navigation.reset({
  //       index: 0,
  //       routes: [{ name: 'DriverMain' }],
  //     });

  //   } catch (error) {
  //     console.error('OTP verify error:', error);
  //     setError('Invalid OTP. Please try again.');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleVerify = async () => {
    const otpString = otp.join('');

    if (otpString.length !== 6) {
      setError('Please enter 6 digits');
      return;
    }

    if (IS_TEST_MODE) {
      if (otpString === TEST_OTP) {
        if (!expertDocID) {
          setError('Expert session missing. Please login again.');
          return;
        }

        if (!forgotPassword) {
          await saveExpertSession(expertDocID);
        }

        ToastAndroid.show('OTP Confirmed', ToastAndroid.SHORT);

        if (forgotPassword) {
          navigation.replace('ForgotPasswordStep2', {
            licenseID,
            isChangePassword
          });

        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'DriverMain' }],
          });
        }
      } else {
        setError('Invalid OTP');
      }
      return;
    }


    if (!confirmation) {
      setError('OTP session expired');
      return;
    }

    try {
      const userCredential = await confirmation.confirm(otpString);
      const uid = userCredential?.user.uid;

      await firestore()
        .collection('experts')
        .doc(expertDocID)
        .update({
          authUid: uid,
        });


      navigation.reset({
        index: 0,
        routes: [{ name: 'DriverMain' }],
      });
    } catch {
      setError('Invalid OTP');
    }
  };



  const handleResendOTP = async () => {
    setTimer(60);
    setIsResendEnabled(false);
    setOtp(Array(6).fill(''));
    await sendOTP();
    inputsRef.current[0]?.focus();
  };


  const formatPhoneNumber = (phone: string) => {
    // Format for display
    return phone.replace(/\d(?=\d{4})/g, '*');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons
              name="arrow-back"
              size={responsiveSize(24)}
              color="#2D3748"
            />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <MaterialIcons
                name="verified-user"
                size={responsiveSize(48)}
                color="#102C7E"
              />
            </View>
            <Text style={styles.title}>OTP Verification</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to
            </Text>
            <Text style={styles.phoneNumber}>
              {formatPhoneNumber(phoneNumber)}
              {/* {formatPhoneNumber(TEST_PHONE)} */}

            </Text>
          </View>

          <View style={styles.otpContainer}>
            <Text style={styles.otpLabel}>Enter OTP Code</Text>
            <View style={styles.otpInputsRow}>
              {Array(6)
                .fill(0)
                .map((_, index) => (
                  <TextInput
                    key={index}
                    ref={ref => {
                      if (ref) inputsRef.current[index] = ref;
                    }}
                    style={[
                      styles.otpInput,
                      otp[index] ? styles.otpInputFilled : {},
                      error ? styles.otpInputError : {},
                    ]}
                    value={otp[index]}
                    onChangeText={value => handleOtpChange(value, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    autoFocus={index === 0}
                    placeholder="0"
                    placeholderTextColor="#A0AEC0"
                  />
                ))}
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>
              {timer > 0 ? (
                <>
                  Resend code in{' '}
                  <Text style={styles.timerHighlight}>00:{timer.toString().padStart(2, '0')}</Text>
                </>
              ) : (
                <Text style={styles.resendReady}>You can now resend the code</Text>
              )}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.verifyButton,
              isLoading && styles.verifyButtonDisabled,
            ]}
            onPress={handleVerify}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <MaterialIcons
                  name="hourglass-empty"
                  size={responsiveSize(20)}
                  color="#fff"
                  style={styles.loadingIcon}
                />
                <Text style={styles.verifyButtonText}>Verifying...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.verifyButtonText}>Verify & Continue</Text>
                <MaterialIcons
                  name="arrow-forward"
                  size={responsiveSize(20)}
                  color="#fff"
                />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.resendButton,
              !isResendEnabled && styles.resendButtonDisabled,
            ]}
            onPress={handleResendOTP}
            disabled={!isResendEnabled}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="refresh"
              size={responsiveSize(18)}
              color={isResendEnabled ? '#102C7E' : '#A0AEC0'}
            />
            <Text
              style={[
                styles.resendButtonText,
                !isResendEnabled && styles.resendButtonTextDisabled,
              ]}
            >
              Resend OTP
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Didn't receive the code?{' '}
              <Text style={styles.footerLink} onPress={() => Alert.alert('Info', 'Please check your SMS inbox or spam folder.')}>
                Check your SMS
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default OTPAuthScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: responsiveSize(24),
    paddingBottom: responsiveVertical(30),
  },
  backButton: {
    padding: responsiveSize(8),
    alignSelf: 'flex-start',
    marginTop: responsiveVertical(12),
    marginBottom: responsiveVertical(8),
  },
  header: {
    alignItems: 'center',
    marginTop: responsiveVertical(20),
    marginBottom: responsiveVertical(40),
  },
  iconContainer: {
    width: responsiveSize(80),
    height: responsiveSize(80),
    borderRadius: responsiveSize(40),
    backgroundColor: 'rgba(16,44,126,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: responsiveVertical(20),
  },
  title: {
    fontSize: responsiveSize(28),
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: responsiveVertical(8),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: responsiveSize(16),
    color: '#718096',
    textAlign: 'center',
    marginBottom: responsiveVertical(4),
  },
  phoneNumber: {
    fontSize: responsiveSize(18),
    fontWeight: '600',
    color: '#102C7E',
    textAlign: 'center',
  },
  otpContainer: {
    marginBottom: responsiveVertical(30),
  },
  otpLabel: {
    fontSize: responsiveSize(14),
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: responsiveVertical(16),
    textAlign: 'center',
  },
  otpInputsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: responsiveSize(10),
  },
  otpInput: {
    width: responsiveSize(48),
    height: responsiveSize(60),
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: responsiveSize(12),
    fontSize: responsiveSize(24),
    fontWeight: '600',
    color: '#2D3748',
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  otpInputFilled: {
    borderColor: '#102C7E',
    backgroundColor: 'rgba(16,44,126,0.02)',
  },
  otpInputError: {
    borderColor: '#E53E3E',
  },
  errorText: {
    color: '#E53E3E',
    fontSize: responsiveSize(14),
    textAlign: 'center',
    marginTop: responsiveVertical(12),
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: responsiveVertical(30),
  },
  timerText: {
    fontSize: responsiveSize(14),
    color: '#718096',
    textAlign: 'center',
  },
  timerHighlight: {
    color: '#102C7E',
    fontWeight: '600',
  },
  resendReady: {
    color: '#38A169',
    fontWeight: '600',
  },
  verifyButton: {
    backgroundColor: '#102C7E',
    height: responsiveVertical(56),
    borderRadius: responsiveSize(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: responsiveVertical(20),
    shadowColor: '#102C7E',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyButtonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: responsiveSize(16),
    fontWeight: '600',
    marginRight: responsiveSize(8),
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingIcon: {
    marginRight: responsiveSize(8),
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveVertical(12),
    marginBottom: responsiveVertical(30),
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    fontSize: responsiveSize(16),
    fontWeight: '600',
    color: '#102C7E',
    marginLeft: responsiveSize(8),
  },
  resendButtonTextDisabled: {
    color: '#A0AEC0',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: responsiveSize(14),
    color: '#718096',
    textAlign: 'center',
  },
  footerLink: {
    color: '#102C7E',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});