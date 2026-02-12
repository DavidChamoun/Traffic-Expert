// src/screens/SplashScreen.tsx
import React, { useEffect, useRef } from 'react';
import {
  SafeAreaView,
  Animated,
  Image,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { checkAndPrepareLocation, requestNotificationPermission } from '../utils/permissions';

const SplashScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const styles = getStyles(isDark);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start();

    (async () => {
      await checkAndPrepareLocation();
      await requestNotificationPermission();
      setTimeout(() => navigation.replace('Login'), 1000);
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim }}>
        <Image
          source={require('../assets/Images/traffic_expert.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </SafeAreaView>
  );
};

export default SplashScreen;

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#181818' : '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 240,
    height: 240,
  },
});
