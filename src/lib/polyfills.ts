/**
 * Robust Polyfill for AbortSignal.any which is missing in some React Native environments
 * but required by the Firebase Vertex AI SDK.
 */
import 'react-native-get-random-values';
import 'text-encoding';
(function () {
    const g = (typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : {}) as any;

    if (typeof g.AbortSignal !== 'undefined' && !g.AbortSignal.any) {
        try {
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
            console.error('Failed to polyfill AbortSignal.any:', e);
        }
    }

    if (typeof g.AbortSignal !== 'undefined' && !g.AbortSignal.timeout) {
        try {
            Object.defineProperty(g.AbortSignal, 'timeout', {
                value: function (ms: number) {
                    const controller = new AbortController();
                    setTimeout(() => controller.abort(), ms);
                    return controller.signal;
                },
                writable: true,
                configurable: true
            });
        } catch (e) { }
    }
})();
