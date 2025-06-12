
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for additional asset extensions
config.resolver.assetExts.push('db', 'mp3', 'ttf', 'obj', 'png', 'jpg');

// Add support for TypeScript path mapping
config.resolver.alias = {
  '@': './src',
  '@components': './src/components',
  '@screens': './src/screens',
  '@services': './src/services',
  '@utils': './src/utils',
  '@store': './src/store',
  '@assets': './assets'
};

module.exports = config;
