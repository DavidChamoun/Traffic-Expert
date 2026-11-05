// src/utils/location.ts
import { Platform, Alert, PermissionsAndroid } from 'react-native';
// import Geolocation, {
//   GeoPosition,
//   GeoError,
// } from 'react-native-geolocation-service';
import Geolocation from '@react-native-community/geolocation';
import notifee from '@notifee/react-native';



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

// async function notifyFetching() {
//   const channelId = await notifee.createChannel({
//     id: 'location',
//     name: 'Location Fetching',
//     importance: 4, // HIGH importance
//   });

//   await notifee.displayNotification({
//     title: 'Fetching Location',
//     body: 'Please wait…',
//     android: {
//       channelId,
//       ongoing: true, // makes it persistent until canceled
//     },
//   });
// }

let isChannelCreated = false;

async function notifyFetching() {
  try {
    if (!isChannelCreated) {
      await notifee.createChannel({
        id: 'location_silent',
        name: 'Location Fetching',
        sound: undefined,                          // disable sound
        vibration: false,                          // disable vibration
      });
      isChannelCreated = true;
    }

    await notifee.displayNotification({
      id: 'location_fetching_notice',
      title: 'Fetching Location',
      body: 'Please wait…',
      android: {
        channelId: 'location_silent',
        ongoing: true,      // persistent
        autoCancel: false,
        onlyAlertOnce: true // prevents re-alerting
      },
    });
  } catch (err) {
    console.warn('Failed to display location notification:', err);
  }
}

interface LocationCoords {
  latitude: number;
  longitude: number;
}

export const getCurrentLocation = (): Promise<LocationCoords> => {
  notifyFetching();
  return new Promise((resolve, reject) => {
    // Try high accuracy first
    Geolocation.getCurrentPosition(
      (position) => {
        const geoPoint: LocationCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        console.log('Got HIGH accuracy location');
        notifee.cancelNotification('location_fetching_notice').catch(() => {});
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
            notifee.cancelNotification('location_fetching_notice').catch(() => {});
            resolve(geoPoint);
          },
          (fallbackError) => {
            notifee.cancelNotification('location_fetching_notice').catch(() => {});
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

export const requestLocationPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    // Step 1: Request foreground permissions FIRST
    const foregroundPermissions = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    ]);

    const foregroundGranted =
      foregroundPermissions['android.permission.ACCESS_FINE_LOCATION'] === 'granted' ||
      foregroundPermissions['android.permission.ACCESS_COARSE_LOCATION'] === 'granted';

    if (!foregroundGranted) {
      return false;
    }

    // Step 2: For Android 10+, request background permission SEPARATELY
    // On Android 11+, this MUST be a separate request with user education
    if (Platform.Version >= 29) {
      // Show rationale before requesting (required for good UX and Play Store compliance)
      await new Promise<void>((resolve) => {
        Alert.alert(
          'Background Location Required',
          'To track your location when the app is in the background, please select "Allow all the time" on the next screen.',
          [{ text: 'Continue', onPress: () => resolve() }]
        );
      });

      const backgroundPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
      );

      return backgroundPermission === 'granted';
    }

    return true;
  } catch (error) {
    console.error('Permission request failed:', error);
    return false;
  }
}
