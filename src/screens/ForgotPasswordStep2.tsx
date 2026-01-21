// src/screens/ForgotPasswordStep2.tsx
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
import firestore from '@react-native-firebase/firestore';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

const responsiveSize = (size: number) => Math.round(size * (width / 375));
const responsiveVertical = (size: number) => Math.round(size * (height / 812));

interface ForgotPasswordStep2Props {
    route?: any;
    navigation: any;
}

const ForgotPasswordStep2: React.FC<ForgotPasswordStep2Props> = ({ route, navigation }) => {
    const { licenseID } = route?.params || {};
    const { isChangePassword } = route?.params || {};
    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
    const [error, setError] = useState<string>('');


    const validatePasswords = (): boolean => {
        if (!newPassword) {
            setError('Please enter a new password');
            return false;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return false;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return false;
        }

        return true;
    };

    const handleResetPassword = async () => {

        if (!validatePasswords()) return;

        setIsLoading(true);

        try {
            // 1️⃣ Build verifiedExperts reference
            const verifiedRef = firestore()
                .collection('verifiedExperts')
                .doc(licenseID);

            // 2️⃣ Find expert using this license
            const expertSnap = await firestore()
                .collection('experts')
                .where('verifiedRef', '==', verifiedRef)
                .limit(1)
                .get();

            if (expertSnap.empty) {
                setError('No expert account found for this license');
                return;
            }

            const expertDoc = expertSnap.docs[0];

            // 3️⃣ Update password
            await firestore()
                .collection('experts')
                .doc(expertDoc.id)
                .update({
                    password: newPassword, // ⚠️ hash later in production
                    lastUpdated: firestore.FieldValue.serverTimestamp(),
                });

            ToastAndroid.show('Password updated successfully', ToastAndroid.SHORT);

            // navigation.reset({
            //     index: 0,
            //     routes: [{ name: 'ExpertLogin' }],
            // });
            if (!isChangePassword) {
                navigation.pop(2);
            } else{
                navigation.pop(3);
            }

        } catch (error) {
            console.error(error);
            setError(
                'Failed to reset password. Try again.'
            );
        } finally {
            setIsLoading(false);
        }
    };


    const PasswordInput = React.useMemo(() => ({
        label,
        value,
        onChangeText,
        showPassword,
        onToggleVisibility,
        placeholder,
    }: {
        label: string;
        value: string;
        onChangeText: (text: string) => void;
        showPassword: boolean;
        onToggleVisibility: () => void;
        placeholder: string;
    }) => (
        <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{label}</Text>
            <View style={styles.inputWrapper}>
                <MaterialIcons
                    name="lock"
                    size={responsiveSize(20)}
                    color="#718096"
                    style={styles.inputIcon}
                />
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={!showPassword}
                    placeholder={placeholder}
                    placeholderTextColor="#A0AEC0"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    blurOnSubmit={false}
                />
                <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={onToggleVisibility}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <MaterialIcons
                        name={showPassword ? 'visibility-off' : 'visibility'}
                        size={responsiveSize(22)}
                        color="#718096"
                    />
                </TouchableOpacity>
            </View>
        </View>
    ), []);

    const requirementsMet = {
        length: newPassword.length >= 6,
        match: newPassword === confirmPassword && confirmPassword.length > 0,
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
                        <Text style={styles.headerTitle}>New Password</Text>
                        <View style={styles.headerRight} />
                    </View>


                    {/* New Password Input */}
                    <PasswordInput
                        label="New Password"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        showPassword={showNewPassword}
                        onToggleVisibility={() => setShowNewPassword(!showNewPassword)}
                        placeholder="Enter new password"
                    />

                    {/* Confirm Password Input */}
                    <PasswordInput
                        label="Confirm Password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        showPassword={showConfirmPassword}
                        onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
                        placeholder="Confirm new password"
                    />

                    {/* Password Requirements */}
                    <View style={styles.requirementsContainer}>
                        <Text style={styles.requirementsTitle}>Password Requirements</Text>

                        <View style={styles.requirementRow}>
                            <View style={[styles.requirementDot, requirementsMet.length && styles.requirementDotMet]} />
                            <Text style={[styles.requirementText, requirementsMet.length && styles.requirementTextMet]}>
                                At least 6 characters
                            </Text>
                        </View>

                        <View style={styles.requirementRow}>
                            <View style={[styles.requirementDot, requirementsMet.match && styles.requirementDotMet]} />
                            <Text style={[styles.requirementText, requirementsMet.match && styles.requirementTextMet]}>
                                Passwords match
                            </Text>
                        </View>
                    </View>

                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>

                    {/* Reset Button */}
                    <TouchableOpacity
                        style={[styles.resetButton, (!newPassword || !confirmPassword || isLoading) && styles.resetButtonDisabled]}
                        onPress={handleResetPassword}
                        disabled={!newPassword || !confirmPassword || isLoading}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <View style={styles.buttonContent}>
                                <MaterialIcons
                                    name="check-circle"
                                    size={responsiveSize(20)}
                                    color="#fff"
                                />
                                <Text style={styles.resetButtonText}>Reset Password</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Security Note */}
                    {/* <View style={styles.securityNote}>
                        <MaterialIcons
                            name="security"
                            size={responsiveSize(16)}
                            color="#48BB78"
                        />
                        <Text style={styles.securityNoteText}>
                            Your password is encrypted and securely stored
                        </Text>
                    </View> */}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ForgotPasswordStep2;

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
        color: '#2D3748',
        textAlign: 'center',
        fontFamily: 'Outfit-SemiBold'
    },
    headerRight: {
        width: responsiveSize(40),
    },
    licenseDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(72,187,120,0.08)',
        paddingHorizontal: responsiveSize(16),
        paddingVertical: responsiveVertical(10),
        borderRadius: responsiveSize(8),
        marginBottom: responsiveVertical(24),
    },
    licenseText: {
        fontSize: responsiveSize(14),
        color: '#48BB78',
        fontWeight: '500',
        marginLeft: responsiveSize(8),
    },
    inputContainer: {
        marginBottom: responsiveVertical(24),
    },
    inputLabel: {
        fontSize: responsiveSize(14),
        fontWeight: '600',
        fontFamily: 'Outfit-Medium',
        color: '#4A5568',
        marginBottom: responsiveVertical(8),
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
        fontSize: responsiveSize(14),
        fontFamily: 'Outfit-Regular',
        color: '#2D3748',
        includeFontPadding: false,
    },
    eyeButton: {
        paddingHorizontal: responsiveSize(16),
        paddingVertical: responsiveVertical(16),
    },
    requirementsContainer: {
        marginTop: responsiveVertical(8),
        marginBottom: responsiveVertical(10),
        padding: responsiveSize(16),
        borderRadius: responsiveSize(12),
        backgroundColor: '#F7FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    requirementsTitle: {
        fontSize: responsiveSize(14),
        fontWeight: '600',
        color: '#4A5568',
        marginBottom: responsiveVertical(12),
        fontFamily: 'Outfit-Medium',
    },
    requirementRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: responsiveVertical(8),
    },
    requirementDot: {
        width: responsiveSize(8),
        height: responsiveSize(8),
        borderRadius: responsiveSize(4),
        backgroundColor: '#E2E8F0',
        marginRight: responsiveSize(12),
    },
    requirementDotMet: {
        backgroundColor: '#48BB78',
    },
    requirementText: {
        fontSize: responsiveSize(12),
        fontFamily: 'Outfit-Regular',
        color: '#A0AEC0',
    },
    requirementTextMet: {
        color: '#48BB78',
        fontWeight: '500',
    },
    errorContainer: { marginBottom: responsiveVertical(12), alignItems: 'center', width: '100%' },
    errorText: { color: 'red', fontSize: 14, fontFamily: 'Outfit-Regular' },
    resetButton: {
        backgroundColor: '#102C7E',
        height: responsiveVertical(56),
        borderRadius: responsiveSize(12),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: responsiveVertical(16),
        shadowColor: '#102C7E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    resetButtonDisabled: {
        opacity: 0.5,
        backgroundColor: '#2b4081ff',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    resetButtonText: {
        color: '#fff',
        fontSize: responsiveSize(16),
        fontWeight: '600',
        fontFamily: 'Outfit-Medium',
        marginLeft: responsiveSize(8),
    },
    // securityNote: {
    //     flexDirection: 'row',
    //     alignItems: 'center',
    //     justifyContent: 'center',
    //     marginTop: responsiveVertical(24),
    //     paddingHorizontal: responsiveSize(20),
    // },
    // securityNoteText: {
    //     fontSize: responsiveSize(12),
    //     color: '#48BB78',
    //     marginLeft: responsiveSize(8),
    //     fontWeight: '500',
    // },
});