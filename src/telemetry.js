// Atlas Telemetry Stubs

export const initTelemetry = () => {
  const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
  const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;

  if (SENTRY_DSN) {
    console.log('[Telemetry] Sentry integration primed');
    // Sentry.init({ dsn: SENTRY_DSN, tracesSampleRate: 1.0 });
  }

  if (POSTHOG_KEY) {
    console.log('[Telemetry] PostHog integration primed');
    // posthog.init(POSTHOG_KEY, { api_host: 'https://app.posthog.com' });
  }
};

export const captureEvent = (eventName, properties = {}) => {
  if (import.meta.env.PROD) {
    // console.log(`[Event] ${eventName}`, properties);
    // posthog.capture(eventName, properties);
  }
};

export const captureError = (error, context = {}) => {
  if (import.meta.env.PROD) {
    // console.error(`[Error]`, error, context);
    // Sentry.captureException(error, { extra: context });
  }
};
