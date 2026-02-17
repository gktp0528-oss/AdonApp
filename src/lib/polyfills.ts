/**
 * Robust Polyfill for AbortSignal.any which is missing in some React Native environments
 * but required by the Firebase Vertex AI SDK.
 */
import 'react-native-get-random-values';
// text-encoding causes issues in React Native, skip it
// import 'text-encoding';

(function () {
    const g = (typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : {}) as any;

    // Check what's available
    console.log('[Polyfills] AbortSignal available:', typeof g.AbortSignal !== 'undefined');
    console.log('[Polyfills] AbortSignal.any available:', typeof g.AbortSignal?.any !== 'undefined');
    console.log('[Polyfills] AbortSignal.timeout available:', typeof g.AbortSignal?.timeout !== 'undefined');

    if (typeof g.AbortSignal !== 'undefined' && !g.AbortSignal.any) {
        try {
            // Check if property is already defined and writable
            const descriptor = Object.getOwnPropertyDescriptor(g.AbortSignal, 'any');
            if (descriptor && !descriptor.configurable) {
                console.log('AbortSignal.any already exists and is not configurable, skipping polyfill');
                return;
            }

            Object.defineProperty(g.AbortSignal, 'any', {
                value: function (signals: AbortSignal[]) {
                    const controller = new AbortController();
                    const onAbort = () => {
                        controller.abort();
                        cleanup();
                    };
                    const cleanup = () => {
                        for (const signal of signals) {
                            signal.removeEventListener('abort', onAbort);
                        }
                    };
                    for (const signal of signals) {
                        if (signal.aborted) {
                            onAbort();
                            return controller.signal;
                        }
                        signal.addEventListener('abort', onAbort);
                    }
                    return controller.signal;
                },
                writable: true,
                configurable: true
            });
            console.log('AbortSignal.any polyfill applied successfully! ✨');
        } catch (e) {
            console.warn('Failed to polyfill AbortSignal.any (this is OK if native support exists):', e);
        }
    }

    if (typeof g.AbortSignal !== 'undefined' && !g.AbortSignal.timeout) {
        try {
            // Check if property is already defined and writable
            const descriptor = Object.getOwnPropertyDescriptor(g.AbortSignal, 'timeout');
            if (descriptor && !descriptor.configurable) {
                return; // Skip if already exists and not configurable
            }

            Object.defineProperty(g.AbortSignal, 'timeout', {
                value: function (ms: number) {
                    const controller = new AbortController();
                    setTimeout(() => controller.abort(), ms);
                    return controller.signal;
                },
                writable: true,
                configurable: true
            });
        } catch (e) {
            console.warn('Failed to polyfill AbortSignal.timeout (this is OK if native support exists)');
        }
    }
})();
