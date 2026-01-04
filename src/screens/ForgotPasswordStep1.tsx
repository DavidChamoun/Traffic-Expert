// src/screens/ForgotPasswordStep1.tsx
import React, { useState } from 'react';
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
    ActivityIndicator,
    Dimensions,
    ToastAndroid,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';


const { width, height } = Dimensions.get('window');

const responsiveSize = (size: number) => Math.round(size * (width / 375));
const responsiveVertical = (size: number) => Math.round(size * (height / 812));

interface ForgotPasswordStep1Props {
    route?: {
        params?: {
            isChangePassword?: boolean;
        };
    };
    navigation: any;
}

const ForgotPasswordStep1: React.FC<ForgotPasswordStep1Props> = ({ route, navigation }) => {
    const { isChangePassword = false } = route?.params || {};


    const [licenseID, setLicenseID] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');


    const handleContinue = async () => {

        setError('');

        const trimmedLicense = licenseID.trim();

        if (!trimmedLicense) {
            setError('Please enter your License ID');
            return;
        }

        setIsLoading(true);

        try {
            // 1️⃣ Check if license exists in verifiedExperts
            const verifiedRef = firestore()
                .collection('verifiedExperts')
                .doc(trimmedLicense);

            const verifiedSnap = await verifiedRef.get();

            console.log('License lookup:', trimmedLicense);
            console.log('Document exists:', verifiedSnap.exists);
            console.log('Document data:', verifiedSnap.data());

            // Check both exists and data
            if (!verifiedSnap.exists || !verifiedSnap.data()) {
                setError('License number not found. Please contact support.');
                setIsLoading(false);
                return;
            }

            const verifiedData = verifiedSnap.data()!;

            // Verify the document actually has required fields
            if (!verifiedData.phoneNumber) {
                setError('Invalid license data. Please contact support.');
                setIsLoading(false);
                return;
            }

            // Check if already registered
            if (verifiedData.isRegistered === false) {
                setError(`This license isn't registered`);
                setIsLoading(false);
                return;
            }

            // 2️⃣ Double-check: Query experts collection for existing account
            const existingExpertSnap = await firestore()
                .collection('experts')
                .where('verifiedRef', '==', verifiedRef)
                .limit(1)
                .get();

            if (existingExpertSnap.empty) {
                // Also update isRegistered in case it wasn't set before
                await verifiedRef.update({ isRegistered: false });
                setError('No account for this license');
                setIsLoading(false);
                return;
            }

            // 3️⃣ Get phone number for OTP
            const phoneNumber = verifiedData.phoneNumber;

            if (!phoneNumber) {
                setError('Phone number not found. Please contact support.');
                setIsLoading(false);
                return;
            }

            // 4️⃣ Create expert account
            const snapshot = await firestore()
                .collection('experts')
                .where('verifiedRef', '==', verifiedRef)
                .limit(1)
                .get();

            if (snapshot.empty) {
                setError('Invalid License Number');
                return;
            }

            const expertDoc = snapshot.docs[0];
            const expertDocID = expertDoc.id;


            // 6️⃣ Navigate to OTP
            navigation.navigate('OTPAuth', {
                phoneNumber,
                isSignUp: true,
                expertDocID: expertDocID,
                licenseID: trimmedLicense,
                isChangePassword: isChangePassword,
                forgotPassword: true,
            });

        } catch (err: any) {
            console.error('Registration error:', err);

            // More specific error messages
            if (err.code === 'permission-denied') {
                setError('Permission denied. Please check database rules.');
            } else if (err.code === 'unavailable') {
                setError('Network error. Please check your connection.');
            } else {
                setError('Registration failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }

        // Simulate API verification
        // setTimeout(() => {
        //     setIsLoading(false);

        //     // In real app, you'd verify the license ID with your backend
        //     // If valid, navigate to step 2 with the license ID
        //     navigation.navigate('ForgotPasswordStep2', { licenseID });
        // }, 1500);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <MaterialIcons
                                name="arrow-back"
                                size={responsiveSize(24)}
                                color="#2D3748"
                            />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Reset Password</Text>
                        <View style={styles.headerRight} />
                    </View>


                    {/* License ID Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>License ID</Text>
                        <View style={styles.inputWrapper}>
                            <MaterialIcons
                                name="badge"
                                size={responsiveSize(20)}
                                color="#718096"
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={styles.input}
                                value={licenseID}
                                onChangeText={(text) => {
                                    setLicenseID(text);
                                    setError('');
                                }}
                                placeholder="e.g., 000"
                                placeholderTextColor="#A0AEC0"
                                autoCapitalize="characters"
                                autoCorrect={false}
                                returnKeyType="done"
                                onSubmitEditing={handleContinue}
                            />
                        </View>
                    </View>


                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>

                    </View>


                    {/* Continue Button */}
                    <TouchableOpacity
                        style={[styles.continueButton, (!licenseID || isLoading) && styles.continueButtonDisabled]}
                        onPress={handleContinue}
                        disabled={!licenseID || isLoading}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <View style={styles.buttonContent}>
                                <Text style={styles.continueButtonText}>Continue</Text>
                                <MaterialIcons
                                    name="arrow-forward"
                                    size={responsiveSize(20)}
                                    color="#fff"
                                />
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Support Text */}
                    <View style={styles.supportContainer}>
                        <MaterialIcons
                            name="support-agent"
                            size={responsiveSize(16)}
                            color="#718096"
                        />
                        <Text style={styles.supportText}>
                            Contact support if you don't remember your License ID
                        </Text>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ForgotPasswordStep1;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: responsiveSize(24),
        paddingBottom: responsiveVertical(30),
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: responsiveVertical(35),
        marginBottom: responsiveVertical(32),
    },
    backButton: {
        padding: responsiveSize(8),
    },
    headerTitle: {
        fontSize: responsiveSize(20),
        fontWeight: '700',
        color: '#2D3748',
        textAlign: 'center',
        fontFamily: 'Outfit-SemiBold'
    },
    headerRight: {
        width: responsiveSize(40),
    },
    inputContainer: {
        marginBottom: responsiveVertical(10),
    },
    inputLabel: {
        fontSize: responsiveSize(14),
        fontWeight: '600',
        color: '#4A5568',
        marginBottom: responsiveVertical(8),
        fontFamily: 'Outfit-Medium',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: responsiveSize(12),
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    inputIcon: {
        marginLeft: responsiveSize(16),
    },
    input: {
        flex: 1,
        paddingHorizontal: responsiveSize(16),
        paddingVertical: responsiveVertical(16),
        fontSize: responsiveSize(16),
        fontFamily: 'Outfit-Medium',
        color: '#2D3748',
        includeFontPadding: false,
    },
    errorContainer: { marginBottom: responsiveVertical(12), alignItems: 'center', width: '100%' },
    errorText: { color: 'red', fontSize: 14, fontFamily: 'Outfit-Regular' },

    continueButton: {
        backgroundColor: '#102C7E',
        height: responsiveVertical(56),
        borderRadius: responsiveSize(12),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: responsiveVertical(24),
        shadowColor: '#102C7E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    continueButtonDisabled: {
        opacity: 0.5,
        backgroundColor: '#2b4081ff',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    continueButtonText: {
        color: '#fff',
        fontSize: responsiveSize(16),
        fontWeight: '600',
        marginRight: responsiveSize(8),
        fontFamily: 'Outfit-Medium'
    },
    supportContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: responsiveVertical(24),
        paddingHorizontal: responsiveSize(20),
    },
    supportText: {
        fontSize: responsiveSize(12),
        color: '#718096',
        marginLeft: responsiveSize(8),
        fontWeight: '500',
        fontFamily: 'Outfit-Medium',
    },
});