import { Alert, Linking, Platform } from 'react-native';
import {
  check,
  request,
  RESULTS,
  PERMISSIONS,
  openSettings,
} from 'react-native-permissions';
import Geolocation from '@react-native-community/geolocation';
import { promptForEnableLocationIfNeeded } from 'react-native-android-location-enabler';
import notifee, { AuthorizationStatus } from '@notifee/react-native';
import {
  BatteryOptEnabled,
  OpenOptimizationSettings,
} from 'react-native-battery-optimization-check';




/**
 * Step 1: Request app-level location permission
 */
async function requestLocationPermission(): Promise<boolean> {
  const permission =
    Platform.OS === 'ios'
      ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
      : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

  const status = await check(permission);

  if (status === RESULTS.GRANTED) return true;

  if (status === RESULTS.DENIED) {
    const result = await request(permission);
    return result === RESULTS.GRANTED;
  }

  if (status === RESULTS.BLOCKED) {
    Alert.alert(
      'Location Permission Required',
      'Please enable location permission from settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => openSettings() },
      ],
    );
  }

  return false;
}

/**
 * Step 2: Ensure device location (GPS) is ON
 */
async function ensureLocationEnabled(): Promise<boolean> {
  if (Platform.OS === 'android') {
    try {
      await promptForEnableLocationIfNeeded({
        interval: 10000,
      });
      return true;
    } catch (error) {
      // User cancelled or GPS not enabled

      return false;
    }
  }

  // iOS: cannot toggle location services programmatically
  return new Promise(resolve => {
    Geolocation.getCurrentPosition(
      () => resolve(true),
      () => {
        Alert.alert(
          'Location Services Off',
          'Please enable Location Services from Settings.',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Open Settings', onPress: () => openSettings() },
          ],
        );
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  });
}

export async function isLocationTurnedOn(): Promise<boolean> {
  if (Platform.OS === 'android') {
    try {
      await promptForEnableLocationIfNeeded({
        interval: 10000,
      });
      return true;
    } catch (error) {
      // User cancelled or didn’t enable GPS
      return false;
    }
  }

  if (Platform.OS === 'ios') {
    // iOS does not allow programmatically toggling GPS
    // So just check if permission is granted and location services are ON
    const status = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
    return status === RESULTS.GRANTED;
  }

  return false;
}

/**
 * Public API
 */
export async function checkAndPrepareLocation(): Promise<boolean> {
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) return false;

  const isEnabled = await ensureLocationEnabled();
  return isEnabled;
}




export async function requestBatteryUnrestricted() {
  if (Platform.OS !== 'android') return;

  // Check if optimization is *enabled* for your app
  const isOptimized = await BatteryOptEnabled();
  if (!isOptimized) {
    // Already unrestricted → do nothing
    return;
  }
  
  // Show alert only if optimization is enabled
  Alert.alert(
    'Allow Unrestricted Battery Usage',
    'For reliable location tracking in the background, allow unlimited battery usage for this app.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Open Settings',
        onPress: () => OpenOptimizationSettings(),
      },
    ]
  );

}



/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const settings = await notifee.requestPermission();

    if (settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
      return true;
    }

    if (settings.authorizationStatus === AuthorizationStatus.DENIED) {
      Alert.alert(
        'Notification Permission Required',
        'Please enable notifications from settings to receive important updates.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => openSettings() },
        ],
      );
    }

    return false;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

/**
 * Check if notification permission is granted
 */
export async function checkNotificationPermission(): Promise<boolean> {
  try {
    const settings = await notifee.getNotificationSettings();
    return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
  } catch (error) {
    console.error('Error checking notification permission:', error);
    return false;
  }
}
