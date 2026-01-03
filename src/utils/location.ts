// src/utils/location.ts
import { Platform, Alert, PermissionsAndroid } from 'react-native';
// import Geolocation, {
//   GeoPosition,
//   GeoError,
// } from 'react-native-geolocation-service';
import {
  check,
  request,
  RESULTS,
  PERMISSIONS,
  openSettings,
} from 'react-native-permissions';
import Geolocation from '@react-native-community/geolocation';
import { promptForEnableLocationIfNeeded } from 'react-native-android-location-enabler';

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

/**
 * Get location when needed
 */
// export async function getCurrentLocation(): Promise<{
//   latitude: number;
//   longitude: number;
// } | null> {
//   console.log('Getting location - simple version');

//   return new Promise((resolve) => {
//     setTimeout(() => {
//       console.log('Timeout reached');
//       resolve(null);
//     }, 15000);

//     Geolocation.getCurrentPosition(
//       (position) => {
//         console.log('Got position');
//         resolve({
//           latitude: position.coords.latitude,
//           longitude: position.coords.longitude,
//         });
//       },
//       (error) => {
//         console.log('Position error:', error);
//         resolve(null);
//       },
//       {
//         enableHighAccuracy: false, // LOW accuracy
//         timeout: 10000,
//         maximumAge: 60000, // Accept old location
//       }
//     );
//   });
// }

interface LocationCoords {
  latitude: number;
  longitude: number;
}

export const getCurrentLocation = (): Promise<LocationCoords> => {
  return new Promise((resolve, reject) => {
    // Try high accuracy first
    Geolocation.getCurrentPosition(
      (position) => {
        const geoPoint: LocationCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        console.log('Got HIGH accuracy location');
        resolve(geoPoint);
      },
      (error) => {
        console.log('High accuracy failed, using network location...');

        // Fallback to network location
        Geolocation.getCurrentPosition(
          (position) => {
            const geoPoint: LocationCoords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            console.log('Got NETWORK location');
            resolve(geoPoint);
          },
          (fallbackError) => {
            reject(fallbackError);
          },
          {
            enableHighAccuracy: false,
            timeout: 20000,
            maximumAge: 10000,
          }
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0,
      }
    );
  });
};

// utils/permissions.ts

export const checkAndPrepareBackgroundLocation = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    console.log('Requesting ACCESS_FINE_LOCATION...');
    
    // Step 1: Request foreground location
    const fineLocationGranted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'This app needs location access to connect you with users in emergencies.',
        buttonPositive: 'OK',
      }
    );

    console.log('Fine location result:', fineLocationGranted);

    if (fineLocationGranted !== PermissionsAndroid.RESULTS.GRANTED) {
      console.log('❌ Fine location denied');
      return false;
    }

    // Step 2: For Android 10+ (API 29+), request background location
    if (Platform.Version >= 29) {
      console.log('Requesting ACCESS_BACKGROUND_LOCATION...');
      
      const backgroundGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        {
          title: 'Background Location Permission',
          message: 'Allow all the time so you can receive emergency calls even when the app is closed.',
          buttonPositive: 'Allow all the time',
        }
      );

      console.log('Background location result:', backgroundGranted);

      if (backgroundGranted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log('⚠️ Background location denied - will only work when app is open');
        // Don't return false - still allow foreground tracking
      }
    }

    return true;
  } catch (err) {
    console.error('❌ Permission error:', err);
    return false;
  }
};


    // "react-native-background-geolocation": "^4.19.3",
