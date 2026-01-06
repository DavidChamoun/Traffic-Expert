// npm install react-native-background-actions


// import Geolocation from 'react-native-geolocation-service';
// import BackgroundService from 'react-native-background-actions';
// import firestore from '@react-native-firebase/firestore';

// const sleep = (time: number) => new Promise<void>((resolve) => setTimeout(() => resolve(), time));

// // Background task that runs continuously
// const trackingTask = async (taskData?: { expertId: string; delay?: number }) => {
//   console.log('[Background] Task started with expertId:', taskData?.expertId);

//   if (!taskData?.expertId) {
//     console.error('[Background] No expertId provided');
//     return;
//   }

//   // This promise keeps the task running
//   await new Promise<void>(async (resolve) => {
//     while (BackgroundService.isRunning()) {
//       try {
//         console.log('[Background] Fetching location...');

//         // Get current location using Promise wrapper
//         const position = await new Promise<any>((resolvePos, rejectPos) => {
//           Geolocation.getCurrentPosition(
//             (pos) => resolvePos(pos),
//             (error) => rejectPos(error),
//             {
//               enableHighAccuracy: false,
//               timeout: 15000,
//               maximumAge: 10000,
//             }
//           );
//         });

//         const { latitude, longitude } = position.coords;
//         console.log('[Background] Location:', latitude, longitude);

//         // Update Firestore
//         await firestore()
//           .collection('experts')
//           .doc(taskData.expertId)
//           .update({
//             location: new firestore.GeoPoint(latitude, longitude),
//             lastUpdated: firestore.FieldValue.serverTimestamp(),
//           });

//         console.log('✅ [Background] Location updated in Firestore');

//       } catch (error) {
//         console.error('❌ [Background] Error:', error);
//       }

//       // Wait 30 seconds before next update
//       await sleep(30000);
//     }

//     resolve(); // Resolve when loop exits
//   });
// };

// // Options for the background service
// const backgroundOptions = {
//   taskName: 'ExpertLocationTracking',
//   taskTitle: 'Expert Location Active',
//   taskDesc: 'Your location is being shared for emergency assistance',
//   taskIcon: {
//     name: 'ic_launcher',
//     type: 'mipmap',
//   },
//   color: '#ff00ff',
//   linkingURI: 'trafficexpert://chat',
//   parameters: {
//     delay: 30000,
//   },
// };

// export const startBackgroundLocationTracking = async (expertId: string) => {
//   try {
//     console.log('[Background] Starting tracking for:', expertId);

//     // Stop existing service if running
//     if (BackgroundService.isRunning()) {
//       console.log('[Background] Stopping existing service...');
//       await BackgroundService.stop();
//       await sleep(1000);
//     }

//     await BackgroundService.start(trackingTask, {
//       ...backgroundOptions,
//       parameters: {
//         delay: 30000,
//         expertId,
//       },
//     });

//     console.log('✅ Background location tracking started');
//   } catch (error) {
//     console.error('❌ Failed to start background tracking:', error);
//     throw error;
//   }
// };

// export const stopBackgroundLocationTracking = async () => {
//   try {
//     await BackgroundService.stop();
//     console.log('✅ Background location tracking stopped');
//   } catch (error) {
//     console.error('❌ Failed to stop background tracking:', error);
//   }
// };

// export const isTrackingRunning = (): boolean => {
//   return BackgroundService.isRunning();
// };

// src/utils/backgroundLocationService.ts
// import BackgroundFetch from 'react-native-background-fetch';
// import Geolocation from 'react-native-geolocation-service';
// import firestore from '@react-native-firebase/firestore';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { AppState, AppStateStatus, Platform, NativeModules, Alert } from 'react-native';

// const { ToastAndroid } = require('react-native');

// let currentExpertId: string | null = null;
// let appState = AppState.currentState;
// let subscription: any = null;
// let isBackgroundFetchConfigured = false;

// const EXPERT_ID_KEY = 'tracking_expert_id';

// console.log('[📍 Location Service] Module loaded');

// // Update location in Firestore - core function
// const updateLocation = async (expertId: string): Promise<boolean> => {
//   if (!expertId) {
//     console.log('[📍 Location Service] ⚠️ No expert ID provided');
//     return false;
//   }

//   try {
//     console.log(`[📍 Location Service] Fetching location for expert: ${expertId}`);

//     const position = await new Promise<any>((resolve, reject) => {
//       const timeoutId = setTimeout(() => {
//         reject(new Error('Location timeout'));
//       }, 20000);

//       Geolocation.getCurrentPosition(
//         (pos) => {
//           clearTimeout(timeoutId);
//           resolve(pos);
//         },
//         (error) => {
//           clearTimeout(timeoutId);
//           reject(error);
//         },
//         {
//           enableHighAccuracy: false,
//           timeout: 20000,
//           maximumAge: 5000,
//         }
//       );
//     });

//     const { latitude, longitude } = position.coords;
//     console.log(`[📍 Location Service] ✅ Got location: ${latitude}, ${longitude}`);

//     // Update Firestore
//     await firestore()
//       .collection('experts')
//       .doc(expertId)
//       .update({
//         location: new firestore.GeoPoint(latitude, longitude),
//         lastUpdated: firestore.FieldValue.serverTimestamp(),
//       });

//     console.log(`[✅ Location Service] Updated Firestore for expert: ${expertId}`);
//     return true;

//   } catch (error) {
//     console.error(`[❌ Location Service] Error: ${error}`);
//     return false;
//   }
// };

// // Background Fetch Task - Runs every ~15 minutes on Android
// const backgroundFetchTask = async (taskId: string) => {
//   console.log(`[⏰ BackgroundFetch] Task executing: ${taskId}`);

//   try {
//     const storedId = await AsyncStorage.getItem(EXPERT_ID_KEY);
//     console.log(`[⏰ BackgroundFetch] Expert ID: ${storedId}`);

//     if (storedId) {
//       await updateLocation(storedId);
//       BackgroundFetch.finish(taskId);
//     } else {
//       console.log('[⏰ BackgroundFetch] No expert ID, skipping');
//       BackgroundFetch.finish(taskId);
//     }

//   } catch (error) {
//     console.error(`[❌ BackgroundFetch] Error: ${error}`);
//     BackgroundFetch.finish(taskId);
//   }
// };

// // Configure background fetch once
// const configureBackgroundFetch = async () => {
//   if (isBackgroundFetchConfigured) {
//     return;
//   }

//   try {
//     console.log('[⚙️ BackgroundFetch] Configuring...');

//     const status = await BackgroundFetch.configure(
//       {
//         minimumFetchInterval: 15, // 15 minutes
//         stopOnTerminate: false, // ⭐ Continue after app terminates
//         startOnBoot: true, // ⭐ Start after device boot
//         enableHeadless: true, // ⭐ Run headless
//         requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY,
//         requiresBatteryNotLow: false,
//         requiresDeviceIdle: false,
//         requiresCharging: false,
//       },
//       backgroundFetchTask,
//       (error) => {
//         console.error(`[❌ BackgroundFetch] Config error: ${error}`);
//       }
//     );

//     console.log(`[✅ BackgroundFetch] Configured with status: ${status}`);
//     isBackgroundFetchConfigured = true;

//   } catch (error) {
//     console.error(`[❌ BackgroundFetch] Failed to configure: ${error}`);
//   }
// };

// // Handle app state changes
// const handleAppStateChange = async (nextAppState: AppStateStatus) => {
//   console.log(`[📱 AppState] Changed: ${appState} → ${nextAppState}`);
//   appState = nextAppState;

//   if (nextAppState === 'active' && currentExpertId) {
//     console.log('[📱 AppState] App in foreground, updating location');
//     await updateLocation(currentExpertId);
//   }
// };

// // ===== PUBLIC API =====

// export const startBackgroundLocationTracking = async (expertId: string): Promise<boolean> => {
//   try {
//     console.log(`[🚀 START] Location tracking for: ${expertId}`);

//     if (!expertId) {
//       console.error('[❌ START] No expert ID');
//       return false;
//     }

//     currentExpertId = expertId;

//     // Save expert ID to persistent storage
//     console.log('[💾 START] Saving expert ID');
//     await AsyncStorage.setItem(EXPERT_ID_KEY, expertId);

//     // Do immediate location update
//     console.log('[🔄 START] Initial location update');
//     setTimeout(() => {
//       updateLocation(expertId).catch(err =>
//         console.error(`[⚠️ START] Initial update failed: ${err}`)
//       );
//     }, 500);

//     // Configure and start background fetch
//     console.log('[⚙️ START] Configuring background fetch');
//     await configureBackgroundFetch();

//     console.log('[▶️ START] Starting background fetch');
//     const fetchStatus = await BackgroundFetch.start();
//     console.log(`[✅ START] Background fetch status: ${fetchStatus}`);

//     // Listen to app state changes
//     if (subscription) {
//       subscription.remove();
//     }
//     subscription = AppState.addEventListener('change', handleAppStateChange);

//     // Show toast
//     if (Platform.OS === 'android') {
//       ToastAndroid.show('🟢 Location tracking started', ToastAndroid.LONG);
//     }

//     console.log(`[✨ START] Success! Tracking expert: ${expertId}`);
//     return true;

//   } catch (error) {
//     console.error(`[❌ START] Failed: ${error}`);
//     currentExpertId = null;
//     return false;
//   }
// };

// export const stopBackgroundLocationTracking = async (): Promise<void> => {
//   try {
//     console.log('[⏹️ STOP] Stopping tracking');

//     // Remove expert ID
//     await AsyncStorage.removeItem(EXPERT_ID_KEY);

//     // Stop background fetch
//     try {
//       await BackgroundFetch.stop();
//       console.log('[✅ STOP] Background fetch stopped');
//     } catch (err) {
//       console.error(`[⚠️ STOP] Error stopping fetch: ${err}`);
//     }

//     // Remove listener
//     if (subscription) {
//       subscription.remove();
//       subscription = null;
//     }

//     currentExpertId = null;

//     // Show toast
//     if (Platform.OS === 'android') {
//       ToastAndroid.show('🔴 Location tracking stopped', ToastAndroid.LONG);
//     }

//     console.log('[✨ STOP] Stopped successfully');

//   } catch (error) {
//     console.error(`[❌ STOP] Error: ${error}`);
//   }
// };

// export const isTrackingRunning = (): boolean => {
//   return currentExpertId !== null;
// };

// export const getCurrentExpertId = (): string | null => {
//   return currentExpertId;
// };

// export const manualLocationUpdate = async (): Promise<void> => {
//   if (currentExpertId) {
//     console.log('[🔄 MANUAL] Triggered');
//     const success = await updateLocation(currentExpertId);
//     console.log(`[📍 MANUAL] Result: ${success ? 'success' : 'failed'}`);
//   } else {
//     console.log('[❌ MANUAL] No expert ID set');
//   }
// };



//npm install react-native-background-fetch
import BackgroundFetch from 'react-native-background-fetch';
import { getCurrentLocation } from './location';
import { getExpertSession } from '../session/session';
import firestore from '@react-native-firebase/firestore';
import { updateExpertLocation } from './firestoreService';
import { ToastAndroid } from 'react-native';


export async function initBackgroundFetch() {
  const status = await BackgroundFetch.configure(
    {
      minimumFetchInterval: 15, // Android minimum (minutes)
      stopOnTerminate: false,   // continue after app is killed (Android)
      startOnBoot: true,        // restart after device reboot
      enableHeadless: true,
      requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY,
    },
    async (taskId) => {
      console.log('[BackgroundFetch] task start:', taskId);

      // ✅ CALL YOUR FUNCTION HERE
      console.log('Call to getCurrentLocation');
      try {
        console.log('Updating current location...');
        const location = await getCurrentLocation();
        const session = await getExpertSession();
        if (!session) return;

        await updateExpertLocation(
          session.expertId,
          location.latitude,
          location.longitude
        );
      } catch (error) {
        console.error('Failed to update location..');
      }
      BackgroundFetch.finish(taskId);
    },
    async (taskId) => {
      console.warn('[BackgroundFetch] TIMEOUT:', taskId);
      BackgroundFetch.finish(taskId);
    }
  );

  console.log('[BackgroundFetch] configured with status:', status);
}


export async function startTracking() {
  await initBackgroundFetch();
  await BackgroundFetch.start();
  ToastAndroid.show('Location tracking started', ToastAndroid.LONG);
}

export async function stopTracking() {
  await BackgroundFetch.stop();
  ToastAndroid.show('Location tracking stopped', ToastAndroid.LONG);
}
