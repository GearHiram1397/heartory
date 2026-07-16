type Props = Record<string, unknown>;

// Provider-agnostic analytics. No-ops until EXPO_PUBLIC_ANALYTICS_KEY is set —
// swap the TODO bodies for your provider (PostHog / Segment / Amplitude).
const enabled = !!process.env.EXPO_PUBLIC_ANALYTICS_KEY;

export const analytics = {
  track(event: string, props?: Props) {
    if (!enabled) {
      if (__DEV__) console.log('[analytics] track', event, props ?? {});
      return;
    }
    // TODO: forward to your analytics provider.
  },

  identify(userId: string, traits?: Props) {
    if (!enabled) return;
    // TODO: associate the user with your analytics provider.
  },

  screen(name: string, props?: Props) {
    if (!enabled) return;
    // TODO: record a screen view.
  },
};
