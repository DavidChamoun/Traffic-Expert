// src/screens/ChangePassword.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { getExpertSession } from '../session/session.tsx';
import firestore from '@react-native-firebase/firestore';
import { ToastAndroid } from 'react-native';



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

interface ChangePasswordProps {
    navigation: any;
}

interface PasswordInputProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    showPassword: boolean;
    onToggleVisibility: () => void;
    placeholder: string;
}

// Extracted PasswordInput as a separate memoized component
const PasswordInput = React.memo(({
    label,
    value,
    onChangeText,
    showPassword,
    onToggleVisibility,
    placeholder,
}: PasswordInputProps) => (
    <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View style={styles.passwordInputWrapper}>
            <TextInput
                style={styles.passwordInput}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={!showPassword}
                placeholder={placeholder}
                placeholderTextColor="#A0AEC0"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
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
));

interface PasswordRequirementProps {
    text: string;
    met: boolean;
}

interface ExpertProfileData {
    password: string;
}``

// Extracted PasswordRequirement as a separate memoized component
const PasswordRequirement = React.memo(({ text, met }: PasswordRequirementProps) => (
    <View style={styles.requirementRow}>
        <View style={[styles.requirementDot, met && styles.requirementDotMet]} />
        <Text style={[styles.requirementText, met && styles.requirementTextMet]}>
            {text}
        </Text>
    </View>
));

const ChangePassword: React.FC<ChangePasswordProps> = ({ navigation }) => {
    const [currentPassword, setCurrentPassword] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
    const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
    const [expertInfo, setExpertInfo] = useState<ExpertProfileData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');



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

                const expertData = expertSnap.data();

                // 3️⃣ Resolve verifiedRef
                const verifiedRef = expertData?.verifiedRef;
                if (!verifiedRef) return;

                const verifiedSnap = await verifiedRef.get();
                if (!verifiedSnap.exists) return;

                const verifiedData = verifiedSnap.data();

                // 4️⃣ Map to UI
                setExpertInfo({
                    password: expertData.password,
                });


            } catch (e) {
                console.error('Failed to load expert profile:', e);
            } finally {
                setLoading(false);
            }
        };

        loadExpert();
    }, []);

    const validatePasswords = (): boolean => {
        if (!currentPassword) {
            setError('Please enter your current password');
            return false;
        }

        if (currentPassword !== expertInfo?.password) {
            setError(`Current password doesn't match`);
            return false;
        }

        if (!newPassword) {
            setError('Please enter a new password');
            return false;
        }

        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters');
            return false;
        }

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return false;
        }

        if (currentPassword === newPassword) {
            setError('New password must be different from current password');
            return false;
        }

        return true;
    };

    const handleChangePassword = async () => {
        if (!validatePasswords()) return;

        setIsLoading(true);

        try {
            const session = await getExpertSession();
            if (!session) {
                ToastAndroid.show('Session expired. Please login again', ToastAndroid.LONG);
                return;
            }

            await firestore()
                .collection('experts')
                .doc(session.expertId)
                .update({
                    password: newPassword,
                    lastUpdated: firestore.FieldValue.serverTimestamp(),
                });

            ToastAndroid.show('Password updated successfully', ToastAndroid.LONG);
            navigation.goBack();

        } catch (error) {
            console.error(error);
            ToastAndroid.show('Failed to update password', ToastAndroid.LONG);
        } finally {
            setIsLoading(false);
        }
    };

    // Memoize event handlers to prevent unnecessary re-renders
    const toggleCurrentPassword = useCallback(() => {
        setShowCurrentPassword(prev => !prev);
    }, []);

    const toggleNewPassword = useCallback(() => {
        setShowNewPassword(prev => !prev);
    }, []);

    const toggleConfirmPassword = useCallback(() => {
        setShowConfirmPassword(prev => !prev);
    }, []);

    const handleCurrentPasswordChange = useCallback((text: string) => {
        setCurrentPassword(text);
        setError('');
    }, []);

    const handleNewPasswordChange = useCallback((text: string) => {
        setNewPassword(text);
        setError('');
    }, []);

    const handleConfirmPasswordChange = useCallback((text: string) => {
        setConfirmPassword(text);
        setError('');
    }, []);

    const handleCancel = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    const handleBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    const requirementsMet = {
        currentMatch: currentPassword === expertInfo?.password,
        length: newPassword.length >= 6,
        match: newPassword === confirmPassword && confirmPassword.length > 0,
        different: newPassword !== currentPassword && newPassword.length > 0 && currentPassword.length > 0,
    };

    const isUpdateDisabled = !currentPassword || !newPassword || !confirmPassword || isLoading;

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
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={handleBack}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <MaterialIcons
                                name="arrow-back"
                                size={responsiveSize(24)}
                                color="#2D3748"
                            />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Change Password</Text>
                        <View style={styles.headerRight} />
                    </View>

                    {/* Current Password */}
                    <PasswordInput
                        label="Current Password"
                        value={currentPassword}
                        onChangeText={handleCurrentPasswordChange}
                        showPassword={showCurrentPassword}
                        onToggleVisibility={toggleCurrentPassword}
                        placeholder="Enter current password"
                    />

                    {/* New Password */}
                    <PasswordInput
                        label="New Password"
                        value={newPassword}
                        onChangeText={handleNewPasswordChange}
                        showPassword={showNewPassword}
                        onToggleVisibility={toggleNewPassword}
                        placeholder="Enter new password"
                    />

                    {/* Confirm New Password */}
                    <PasswordInput
                        label="Confirm New Password"
                        value={confirmPassword}
                        onChangeText={handleConfirmPasswordChange}
                        showPassword={showConfirmPassword}
                        onToggleVisibility={toggleConfirmPassword}
                        placeholder="Confirm new password"
                    />

                    <TouchableOpacity style={{ marginBottom: 10 }} onPress={() => {
                        // mark isExpert and navigate (mimic Flutter behavior)
                        navigation.replace('ForgotPasswordStep1', {
                            isChangePassword: true,
                        });

                    }}>
                        <Text style={styles.forgot}>Forgot Password?</Text>
                    </TouchableOpacity>

                    {/* Password Requirements */}
                    <View style={styles.requirementsContainer}>
                        <Text style={styles.requirementsTitle}>Password Requirements</Text>

                        <PasswordRequirement
                            text="Current password match"
                            met={requirementsMet.currentMatch}
                        />

                        <PasswordRequirement
                            text="At least 6 characters"
                            met={requirementsMet.length}
                        />

                        <PasswordRequirement
                            text="Passwords match"
                            met={requirementsMet.match}
                        />

                        <PasswordRequirement
                            text="Different from current password"
                            met={requirementsMet.different}
                        />
                    </View>

                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>

                    {/* Update Button */}
                    <TouchableOpacity
                        style={[
                            styles.updateButton,
                            isUpdateDisabled && styles.updateButtonDisabled,
                            isLoading && { opacity: 0.8 }
                        ]}
                        onPress={handleChangePassword}
                        disabled={isUpdateDisabled}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <View style={styles.updateButtonContent}>
                                <MaterialIcons
                                    name="check-circle"
                                    size={responsiveSize(20)}
                                    color="#fff"
                                />
                                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.updateButtonText}>Update Password</Text>}
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Cancel Button */}
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleCancel}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ChangePassword;

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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: responsiveVertical(35),
        marginBottom: responsiveVertical(24),
    },
    backButton: {
        padding: responsiveSize(8),
    },
    headerTitle: {
        fontSize: responsiveSize(20),
        color: '#2D3748',
        textAlign: 'center',
        fontFamily: 'Outfit-SemiBold',
    },
    headerRight: {
        width: responsiveSize(40),
    },
    inputContainer: {
        marginBottom: responsiveVertical(16),
    },
    inputLabel: {
        fontSize: responsiveSize(14),
        fontWeight: '600',
        color: '#4A5568',
        fontFamily: 'Outfit-Medium',
        marginBottom: responsiveVertical(8),
    },
    passwordInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: responsiveSize(12),
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: responsiveSize(16),
        paddingVertical: responsiveVertical(16),
        fontSize: responsiveSize(14),
        color: '#2D3748',
        includeFontPadding: false,
        fontFamily: 'Outfit-Regular'
    },
    eyeButton: {
        paddingHorizontal: responsiveSize(16),
        paddingVertical: responsiveVertical(16),
    },
    forgot: { textAlign: 'right', color: '#102C7E', fontWeight: '500', fontFamily: 'Outfit-Medium' },

    requirementsContainer: {
        marginTop: responsiveVertical(8),
        marginBottom: responsiveVertical(14),
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
        fontFamily: 'Outfit-Medium',
        marginBottom: responsiveVertical(12),
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
        color: '#A0AEC0',
        fontFamily: 'Outfit-Regular'
    },
    requirementTextMet: {
        color: '#48BB78',
        fontWeight: '500',
        fontFamily: 'Outfit-Regular'
    },
    errorContainer: { marginBottom: responsiveVertical(14), alignItems: 'center', flex: 1 },
    errorText: { color: 'red', fontSize: 14, fontFamily: 'Outfit-Regular' },
    updateButton: {
        backgroundColor: '#102C7E',
        height: responsiveVertical(56),
        borderRadius: responsiveSize(12),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: responsiveVertical(16),
        shadowColor: '#102C7E',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    updateButtonDisabled: {
        opacity: 0.5,
        backgroundColor: '#102C7E',
    },
    updateButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    updateButtonText: {
        color: '#fff',
        fontSize: responsiveSize(16),
        fontWeight: '600',
        marginLeft: responsiveSize(8),
        fontFamily: 'Outfit-Medium'
    },
    cancelButton: {
        paddingVertical: responsiveVertical(16),
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#718096',
        fontSize: responsiveSize(16),
        fontWeight: '500',
        fontFamily: 'Outfit-Medium',
    },
});