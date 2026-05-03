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

export const captureEvent = (eventName, _properties = {}) => {
  if (import.meta.env.PROD) {
    void _properties;
    // console.log(`[Event] ${eventName}`, _properties);
    // posthog.capture(eventName, _properties);
  }
};

export const captureError = (error, _context = {}) => {
  if (import.meta.env.PROD) {
    void _context;
    // console.error(`[Error]`, error, _context);
    // Sentry.captureException(error, { extra: _context });
  }
};
