/**
 * @format
 */

// import { AppRegistry } from 'react-native';
// import App from './App';
// import { name as appName } from './app.json';
// import BackgroundFetch from 'react-native-background-fetch';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import Geolocation from 'react-native-geolocation-service';
// import firestore from '@react-native-firebase/firestore';

// console.log('[🔧 Headless] Initialized');

// // Headless task - runs when app is closed
// const headlessTask = async () => {
//   console.log('[⏰ Headless] Task running');

//   try {
//     const expertId = await AsyncStorage.getItem('tracking_expert_id');
//     console.log(`[⏰ Headless] Expert ID: ${expertId}`);

//     if (expertId) {
//       console.log('[⏰ Headless] Fetching location...');

//       const position = await new Promise<any>((resolve, reject) => {
//         const timeoutId = setTimeout(() => {
//           reject(new Error('Timeout'));
//         }, 20000);

//         Geolocation.getCurrentPosition(
//           (pos) => {
//             clearTimeout(timeoutId);
//             resolve(pos);
//           },
//           (error) => {
//             clearTimeout(timeoutId);
//             reject(error);
//           },
//           {
//             enableHighAccuracy: false,
//             timeout: 20000,
//             maximumAge: 5000,
//           }
//         );
//       });

//       const { latitude, longitude } = position.coords;
//       console.log(`[⏰ Headless] Location: ${latitude}, ${longitude}`);

//       await firestore()
//         .collection('experts')
//         .doc(expertId)
//         .update({
//           location: new firestore.GeoPoint(latitude, longitude),
//           lastUpdated: firestore.FieldValue.serverTimestamp(),
//         });

//       console.log('[✅ Headless] Updated Firestore');
//     }

//   } catch (error) {
//     console.error(`[❌ Headless] Error: ${error}`);
//   }
// };

// // Register the headless task
// BackgroundFetch.registerHeadlessTask(headlessTask);

// AppRegistry.registerComponent(appName, () => App);

import { AppRegistry } from 'react-native';
import BackgroundFetch from 'react-native-background-fetch';
import App from './App';

const HeadlessTask = async ({ taskId }) => {
  console.log('[HeadlessTask] start:', taskId);

  // Run the same function logic
  // Example:
  console.log('Headless background execution');

  BackgroundFetch.finish(taskId);
};

BackgroundFetch.registerHeadlessTask(HeadlessTask);

AppRegistry.registerComponent('TrafficExpert', () => App);
