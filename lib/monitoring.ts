import * as Sentry from '@sentry/react-native';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

// Initialize crash/error reporting. No-ops until EXPO_PUBLIC_SENTRY_DSN is set,
// so local/dev runs don't send events.
export function initMonitoring() {
  if (!dsn) return;
  Sentry.init({
    dsn,
    // Lower sample rate in production to control cost; raise while debugging.
    tracesSampleRate: 0.2,
    enableAutoSessionTracking: true,
    environment: process.env.EXPO_PUBLIC_ENV ?? 'production',
  });
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (dsn) {
    Sentry.captureException(error, context ? { extra: context } : undefined);
  } else {
    console.error('[monitoring]', error, context ?? '');
  }
}

export const isMonitoringEnabled = !!dsn;
