import Geolocation from 'react-native-geolocation-service';
import BackgroundService from 'react-native-background-actions';
import firestore from '@react-native-firebase/firestore';

const sleep = (time: number) => new Promise<void>((resolve) => setTimeout(() => resolve(), time));

// Background task that runs continuously
const trackingTask = async (taskData?: { expertId: string; delay?: number }) => {
  console.log('[Background] Task started with expertId:', taskData?.expertId);

  if (!taskData?.expertId) {
    console.error('[Background] No expertId provided');
    return;
  }

  // This promise keeps the task running
  await new Promise<void>(async (resolve) => {
    while (BackgroundService.isRunning()) {
      try {
        console.log('[Background] Fetching location...');

        // Get current location using Promise wrapper
        const position = await new Promise<any>((resolvePos, rejectPos) => {
          Geolocation.getCurrentPosition(
            (pos) => resolvePos(pos),
            (error) => rejectPos(error),
            {
              enableHighAccuracy: false,
              timeout: 15000,
              maximumAge: 10000,
            }
          );
        });

        const { latitude, longitude } = position.coords;
        console.log('[Background] Location:', latitude, longitude);

        // Update Firestore
        await firestore()
          .collection('experts')
          .doc(taskData.expertId)
          .update({
            location: new firestore.GeoPoint(latitude, longitude),
            lastUpdated: firestore.FieldValue.serverTimestamp(),
          });

        console.log('✅ [Background] Location updated in Firestore');

      } catch (error) {
        console.error('❌ [Background] Error:', error);
      }

      // Wait 30 seconds before next update
      await sleep(30000);
    }

    resolve(); // Resolve when loop exits
  });
};

// Options for the background service
const backgroundOptions = {
  taskName: 'ExpertLocationTracking',
  taskTitle: 'Expert Location Active',
  taskDesc: 'Your location is being shared for emergency assistance',
  taskIcon: {
    name: 'ic_launcher',
    type: 'mipmap',
  },
  color: '#ff00ff',
  linkingURI: 'trafficexpert://chat',
  parameters: {
    delay: 30000,
  },
};

export const startBackgroundLocationTracking = async (expertId: string) => {
  try {
    console.log('[Background] Starting tracking for:', expertId);

    // Stop existing service if running
    if (BackgroundService.isRunning()) {
      console.log('[Background] Stopping existing service...');
      await BackgroundService.stop();
      await sleep(1000);
    }

    await BackgroundService.start(trackingTask, {
      ...backgroundOptions,
      parameters: {
        delay: 30000,
        expertId,
      },
    });

    console.log('✅ Background location tracking started');
  } catch (error) {
    console.error('❌ Failed to start background tracking:', error);
    throw error;
  }
};

export const stopBackgroundLocationTracking = async () => {
  try {
    await BackgroundService.stop();
    console.log('✅ Background location tracking stopped');
  } catch (error) {
    console.error('❌ Failed to stop background tracking:', error);
  }
};

export const isTrackingRunning = (): boolean => {
  return BackgroundService.isRunning();
};