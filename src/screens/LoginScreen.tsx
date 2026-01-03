// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Pressable,
  Linking,
  Dimensions,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import GradientButton from '../components/GradientButtons';
import { makePhoneCall } from '../utils/phone';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Fontisto from 'react-native-vector-icons/Fontisto';

const { width, height } = Dimensions.get('window');

// Responsive helper functions (matching DriverMain.tsx)
const scale = (size: number) => (width / 375) * size;
const verticalScale = (size: number) => (height / 812) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

// Responsive size function
const responsiveSize = (size: number) => {
  const scale = width / 375; // 375 is typical iPhone width
  return Math.round(size * scale);
};

const responsiveVertical = (size: number) => {
  const scale = height / 812; // 812 is typical iPhone height
  return Math.round(size * scale);
};

const LoginScreen: React.FC = ({ navigation }: any) => {
  const [modalVisible, setModalVisible] = useState(false);

  const openExpertLogin = () => {
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>TrafficExpert</Text>
          <Text style={styles.subtitle}>Lebanon</Text>
        </View>

        <View style={styles.spacingLarge} />

        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome</Text>
          <Text style={styles.welcomeSub}>Choose your role to continue</Text>
        </View>

        <View style={styles.spacingMedium} />

        <View style={styles.actions}>
          <GradientButton
            text="Expert Login"
            onPress={openExpertLogin}
            icon="engineering"
          />

          <View style={styles.spacingSmall} />

          <TouchableOpacity
            style={styles.driverBtn}
            onPress={() => navigation.navigate('DriverMain')}
            activeOpacity={0.8}
          >
            <Text style={styles.driverBtnText}>I Need Help - Driver Access</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacingLarge} />

        <View style={styles.dividerRow}>
          <View style={styles.line} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.line} />
        </View>

        <View style={styles.spacingXLarge} />

        <View style={styles.emergencyBox}>
          <Text style={styles.emergencyTitle}>Emergency Access</Text>
          <View style={styles.spacingSmall} />
          <View style={styles.emergencyRow}>
            {[
              { label: 'Police', number: '112', icon: 'local-police', design: 'MaterialIcons' },
              { label: 'Civil Defense', number: '125', icon: 'fire-extinguisher', design: 'MaterialIcons' },
              { label: 'Red Cross', number: '140', icon: 'first-aid-alt', design: 'Fontisto' },
            ].map(item => (
              <View key={item.number} style={styles.emItem}>
                <Pressable
                  style={styles.emCircle}
                  onPress={() => makePhoneCall(item.number)}
                >

                  {item.design === 'MaterialIcons' ? (
                    <MaterialIcons name={item.icon} style={styles.emIcon} />
                  ) : (
                    <Fontisto name={item.icon} style={styles.emIcon} />
                  )}

                </Pressable>

                <View style={styles.spacingTiny} />
                <Text style={styles.emLabel}>{item.label}</Text>
                <Text style={styles.emNumber}>{item.number}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Expert modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setModalVisible(false)}
          >
            <Pressable
              style={styles.modalContent}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.handle} />

              <View style={styles.modalHeader}>
                {/* <MaterialIcons name="verified-user" size={moderateScale(32)} color="#102C7E" /> */}
                <Text style={styles.modalTitle}>Expert Verification</Text>
                <Text style={styles.modalSubtitle}>Choose your verification method</Text>
              </View>

              <View style={styles.spacingRegular} />

              <TouchableOpacity
                style={styles.optionCard}
                onPress={() => {
                  setModalVisible(false);
                  navigation.navigate('ExpertLogin');
                }}
                activeOpacity={0.7}
              >
                <View style={styles.optionIconWrap}>
                  <MaterialIcons name="login" size={moderateScale(24)} color="#102C7E" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Existing Expert</Text>
                  <Text style={styles.optionDesc}>Login to your account</Text>
                </View>
                <MaterialIcons name="chevron-right" size={moderateScale(24)} color="#CBD5E0" />
              </TouchableOpacity>

              <View style={styles.spacingSmall} />

              <TouchableOpacity
                style={styles.optionCard}
                onPress={() => {
                  setModalVisible(false);
                  navigation.navigate('ExpertRegister');
                }}
                activeOpacity={0.7}
              >
                <View style={styles.optionIconWrap}>
                  <MaterialIcons name="person-add" size={moderateScale(24)} color="#102C7E" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>New Expert</Text>
                  <Text style={styles.optionDesc}>Register and verify membership</Text>
                </View>
                <MaterialIcons name="chevron-right" size={moderateScale(24)} color="#CBD5E0" />
              </TouchableOpacity>

              <View style={styles.spacingRegular} />

              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.cancelButton}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LoginScreen;



const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff'
  },
  container: {
    padding: responsiveSize(24),
    minHeight: height * 0.9, // Ensure minimum height for small devices
  },
  header: {
    alignItems: 'center',
    marginTop: responsiveVertical(20),
  },
  title: {
    fontSize: responsiveSize(32),
    fontWeight: '700',
    color: '#2D3748',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: responsiveSize(16),
    fontWeight: '500',
    color: '#718096',
    marginTop: responsiveVertical(8),
    textAlign: 'center',
  },

  welcomeSection: {
    alignItems: 'center'
  },
  welcomeTitle: {
    fontSize: responsiveSize(28),
    fontWeight: '700',
    color: '#2D3748',
    textAlign: 'center',
  },
  welcomeSub: {
    fontSize: responsiveSize(16),
    color: '#718096',
    marginTop: responsiveVertical(8),
    textAlign: 'center',
  },

  // Spacing utilities
  spacingTiny: {
    height: responsiveVertical(8)
  },
  spacingSmall: {
    height: responsiveVertical(16)
  },
  spacingRegular: {
    height: responsiveVertical(24)
  },
  spacingMedium: {
    height: responsiveVertical(40)
  },
  spacingLarge: {
    height: responsiveVertical(60)
  },
  spacingXLarge: {
    height: responsiveVertical(80)
  },

  actions: {
    marginTop: 0,
    width: '100%',
  },

  driverBtn: {
    width: '100%',
    height: responsiveVertical(56),
    borderRadius: responsiveSize(16),
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  driverBtnText: {
    fontSize: responsiveSize(16),
    fontWeight: '600',
    color: '#4A5568',
    textAlign: 'center',
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0'
  },
  orText: {
    marginHorizontal: responsiveSize(16),
    color: '#718096',
    fontSize: responsiveSize(14),
  },

  emergencyBox: {
    padding: responsiveSize(16),
    borderRadius: responsiveSize(12),
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#ffa4a4ff',
    width: '100%',
  },
  emergencyTitle: {
    color: '#718096',
    fontWeight: '500',
    fontSize: responsiveSize(14),
    textAlign: 'center',
  },
  emergencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap', // Allow wrapping on very small screens
  },
  emItem: {
    alignItems: 'center',
    marginVertical: responsiveVertical(4),
    minWidth: responsiveSize(80), // Ensure minimum width for items
  },
  emCircle: {
    width: responsiveSize(50),
    height: responsiveSize(50),
    borderRadius: responsiveSize(25),
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ffa4a4ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emIcon: {
    fontSize: responsiveSize(20),
    color: '#E53E3E',
  },
  emLabel: {
    color: '#4A5568',
    fontSize: responsiveSize(10),
    marginTop: responsiveVertical(8),
    fontWeight: '500',
    textAlign: 'center',
  },
  emNumber: {
    color: '#E53E3E',
    fontWeight: '800',
    fontSize: responsiveSize(12),
    textAlign: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#F7FAFC',
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    padding: scale(24),
    paddingBottom: Platform.OS === 'ios' ? verticalScale(40) : verticalScale(24),
  },
  handle: {
    width: scale(40),
    height: verticalScale(4),
    backgroundColor: '#CBD5E0',
    borderRadius: moderateScale(2),
    alignSelf: 'center',
    marginBottom: verticalScale(20),
  },
  modalHeader: {
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: moderateScale(22),
    fontWeight: '700',
    color: '#2D3748',
    marginTop: verticalScale(12),
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: moderateScale(14),
    color: '#718096',
    marginTop: verticalScale(6),
    letterSpacing: 0.2,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: scale(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: moderateScale(4),
    elevation: 2,
  },
  optionIconWrap: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(12),
    backgroundColor: 'rgba(16, 44, 126, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
    marginLeft: scale(12),
  },
  optionTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#2D3748',
    letterSpacing: 0.2,
  },
  optionDesc: {
    fontSize: moderateScale(12),
    color: '#718096',
    marginTop: verticalScale(2),
    letterSpacing: 0.2,
  },
  cancelButton: {
    padding: scale(16),
    alignItems: 'center',
  },
  cancelText: {
    color: '#718096',
    fontSize: moderateScale(15),
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});