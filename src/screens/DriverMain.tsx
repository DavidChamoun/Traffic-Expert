// src/screens/DriverMain.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  Dimensions,
  Platform,
  useColorScheme
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { getExpertSession } from '../session/session';
import MapPage from './MapPage.tsx';
import ExpertsList from './ExpertsList.tsx';
import AdvicePage from './AdvicePage.tsx';
import ExpertProfile from './ExpertProfile.tsx';
import firestore from '@react-native-firebase/firestore';
import { requestBatteryUnrestricted } from '../utils/permissions.ts';
import { isTrackingActive, startTracking } from '../utils/backgroundLocationService.ts';
import useDoubleBackExit from '../utils/doubleBackService.ts';

const { width, height } = Dimensions.get('window');

// Responsive helper functions
const scale = (size: number) => (width / 375) * size;
const verticalScale = (size: number) => (height / 812) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;



const TABS = [
  { key: 'map', label: 'Map', icon: 'map' },
  { key: 'experts', label: 'Experts', icon: 'list-alt' },
  { key: 'advice', label: 'Advice', icon: 'help-outline' },
];

const DriverMain: React.FC<any> = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [session, setSession] = useState<{ expertId: string } | null>(null);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const styles = getStyles(isDark);




  useEffect(() => {
    const loadSession = async () => {
      const storedSession = await getExpertSession();
      setSession(storedSession);
    };

    const checkAndRestartTracking = async () => {
      const session = await getExpertSession();
      if (!session?.expertId) return;

      if (await isTrackingActive()) {
        return;
      }

      try {
        const doc = await firestore()
          .collection('experts')
          .doc(session.expertId)
          .get();

        const data = doc.data();
        const isTrackingEnabled = data?.isTrackingEnabled;

        if (isTrackingEnabled) {
          // Ask for battery unrestricted if needed
          await requestBatteryUnrestricted();

          // Start background tracking
          await startTracking();
        }
      } catch (error) {
        console.warn('Failed to check session or restart tracking:', error);
      }
    };

    checkAndRestartTracking();

    loadSession();
  }, []);


  const tabs = session?.expertId ? [...TABS, { key: 'profile', label: 'Profile', icon: 'person-outline' }] : TABS;

  const getTitle = () => {
    switch (currentIndex) {
      case 0:
        return 'Find Nearest Expert';
      case 1:
        return 'All Experts';
      case 2:
        return 'Safety Guide';
      case 3:
        return 'Expert Profile';
      default:
        return 'Traffic Expert';
    }
  };

  const renderPage = () => {
    if (currentIndex === 0) return <MapPage onCenterPress={() => showSnack('Centering map on your location')} />;
    if (currentIndex === 1) return <ExpertsList />;
    if (currentIndex === 2) return <AdvicePage />;
    if (currentIndex === 3) return <ExpertProfile />;
    return null;
  };

  const showSnack = (message: string) => {
    Alert.alert('', message);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.appBar}>
        {currentIndex !== 0 && (
          <TouchableOpacity onPress={() => (navigation.replace('DriverMain'))} style={styles.appBarIcon}>
            <MaterialIcons name="arrow-back" size={moderateScale(22)} color="#2D3748" />
          </TouchableOpacity>
        )}

        {currentIndex === 0 && (
          <View style={styles.appBarIcon}>
            <MaterialIcons name="arrow-back" size={moderateScale(22)} color="#2D3748" style={{ opacity: 0 }} />
          </View>
        )}

        <Text style={styles.title}>{getTitle()}</Text>

        <View style={styles.rightActions}>
          {/* {currentIndex === 0 && (
            <TouchableOpacity style={styles.iconCircle} onPress={() => showSnack('Refresh Goes here')}>
              <MaterialIcons name="refresh" size={moderateScale(20)} color="#102C7E" />
            </TouchableOpacity>
          )} */}
        </View>
      </View>

      <View style={styles.content}>{renderPage()}</View>

      <View style={styles.bottomBar}>
        {tabs.map((t, idx) => {
          const active = idx === currentIndex;
          return (
            <TouchableOpacity
              key={t.key}
              style={styles.tabItem}
              activeOpacity={0.8}
              onPress={() => setCurrentIndex(idx)}
            >
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: active ? 'rgba(16,44,126,0.1)' : 'rgba(0,0,0,0)',
                    borderRadius: active ? 8 : 0,
                  },
                ]}
              >
                <MaterialIcons name={t.icon as any} size={moderateScale(22)} color={active ? (isDark ? '#002fbdff' : '#102C7E') : '#A0AEC0'} />
              </View>
              <Text style={[styles.tabLabel, { color: active ? (isDark ? '#002fbdff' : '#102C7E') : '#A0AEC0', fontFamily: active ? 'Outfit-Medium' : 'Outfit-Light' }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

export default DriverMain;

const getStyles = (isDark: boolean) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: isDark ? '#0A0A0F' : '#fff',
  },
  appBar: {
    marginTop: Platform.OS === 'ios' ? verticalScale(10) : verticalScale(20),
    height: verticalScale(56),
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: isDark ? '#2D2D3A' : '#EEE',
    paddingHorizontal: scale(12),
    backgroundColor: isDark ? '#0A0A0F' : '#fff',
  },
  appBarIcon: {
    padding: moderateScale(6),
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: moderateScale(18),
    fontFamily: 'Outfit-SemiBold',
    color: isDark ? '#F7FAFC' : '#2D3748',
  },
  rightActions: {
    width: scale(40),
    alignItems: 'flex-end',
  },
  iconCircle: {
    padding: moderateScale(8),
    borderRadius: moderateScale(20),
    backgroundColor: isDark ? 'rgba(139,92,246,0.1)' : 'rgba(16,44,126,0.06)',
  },
  content: {
    flex: 1,
    backgroundColor: isDark ? '#0A0A0F' : '#FFFFFF',
  },
  bottomBar: {
    height: verticalScale(80),
    borderTopWidth: 1,
    borderTopColor: isDark ? '#2D2D3A' : 'rgba(0,0,0,0)',
    backgroundColor: isDark ? '#0A0A0F' : '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: verticalScale(12),
    paddingBottom: Platform.OS === 'ios' ? verticalScale(15) : verticalScale(20),
    shadowColor: isDark ? '#8B5CF6' : '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: isDark ? 0.1 : 0.07,
    shadowRadius: moderateScale(8),
    elevation: isDark ? 0 : 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: scale(80),
    fontFamily: 'Outfit-Regular',
  },
  iconWrap: {
    padding: moderateScale(8),
    borderRadius: moderateScale(12),
  },
  tabLabel: {
    marginTop: verticalScale(4),
    fontSize: moderateScale(11),
  },
});