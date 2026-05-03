/**
 * Suppress browser tracking prevention console warnings
 * Patches console methods to filter out tracking prevention messages
 */
export function suppressTrackingWarnings() {
  if (typeof window === 'undefined') return;

  const originalWarn = console.warn;
  const originalLog = console.log;
  const originalError = console.error;

  const trackingWarningPatterns = [
    'Tracking Prevention',
    'tracking prevention',
    'blocked access to storage',
    'Blocked access to storage',
  ];

  const isTrackingWarning = (message: string) => {
    return trackingWarningPatterns.some((pattern) => message?.includes?.(pattern));
  };

  console.warn = function (...args: any[]) {
    const message = args[0]?.toString?.() || '';
    if (!isTrackingWarning(message)) {
      originalWarn.apply(console, args);
    }
  };

  console.log = function (...args: any[]) {
    const message = args[0]?.toString?.() || '';
    if (!isTrackingWarning(message)) {
      originalLog.apply(console, args);
    }
  };

  console.error = function (...args: any[]) {
    const message = args[0]?.toString?.() || '';
    if (!isTrackingWarning(message)) {
      originalError.apply(console, args);
    }
  };
}
