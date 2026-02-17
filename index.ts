import 'react-native-get-random-values';
import './src/lib/polyfills';

// Emergency Polyfill for NativeJSLogger to prevent crash when native module is mismatched
try {
    const NativeJSLogger = require('expo-modules-core/build/sweet/NativeJSLogger').default;
    if (NativeJSLogger && typeof NativeJSLogger.addListener !== 'function') {
        console.warn('[Emergency] NativeJSLogger.addListener is missing, apply temporary dummy');
        NativeJSLogger.addListener = () => ({ remove: () => { } });
        NativeJSLogger.removeListeners = () => { };
    }
} catch (e) {
    // Ignore if module not found or other issues
}

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
