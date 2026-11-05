/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('react-native-background-fetch', () => ({
  configure: jest.fn(),
  status: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
}));
jest.mock('@gabriel-sisjr/react-native-background-location', () => ({
  start: jest.fn(),
  stop: jest.fn(),
  isRunning: jest.fn(),
}));
jest.mock('react-native-permissions', () => require('react-native-permissions/mock'));
jest.mock('@react-native-community/geolocation', () => ({
  addListener: jest.fn(),
  getCurrentPosition: jest.fn(),
  removeListeners: jest.fn(),
  requestAuthorization: jest.fn(),
  setConfiguration: jest.fn(),
  startObserving: jest.fn(),
  stopObserving: jest.fn(),
}));
jest.mock('@notifee/react-native', () => ({
  requestPermission: jest.fn(),
  displayNotification: jest.fn(),
  createChannel: jest.fn(),
}));
jest.mock('react-native-android-location-enabler', () => ({
  promptForEnableLocationIfNeeded: jest.fn().mockResolvedValue('enabled'),
}));
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockMapView = (props: any) => React.createElement(View, props, props.children);
  const MockMarker = (props: any) => React.createElement(View, props, props.children);
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
    PROVIDER_GOOGLE: 'google',
  };
});
jest.mock('react-native-battery-optimization-check', () => ({
  BatteryOptimizationCheck: {
    isBatteryOptimizationEnabled: jest.fn().mockResolvedValue(false),
    openBatteryOptimizationSettings: jest.fn(),
  },
}));
jest.mock('react-native-device-info', () => ({
  getManufacturer: jest.fn().mockResolvedValue('Google'),
}));
jest.mock('@react-native-firebase/auth', () => () => ({
  currentUser: null,
  signInWithPhoneNumber: jest.fn(),
}));
jest.mock('@react-native-firebase/firestore', () => () => ({
  collection: jest.fn().mockReturnThis(),
  doc: jest.fn().mockReturnThis(),
  get: jest.fn().mockResolvedValue({ exists: false }),
}));

import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
