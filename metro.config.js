const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    extraNodeModules: {
      '@env': path.resolve(__dirname, 'src/config/env.raw.js'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);

