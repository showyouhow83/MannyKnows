// Analytics Configuration
// Central place to control all analytics features

export const ANALYTICS_CONFIG = {
  // Core PostHog settings
  enabled: true,
  
  // Feature toggles
  webVitalsEnabled: true,          // Track Core Web Vitals (CLS, LCP, FID)
  sessionRecordingEnabled: false,  // Record user sessions (performance impact)
  autocaptureEnabled: true,        // Auto-track clicks, form submissions, etc.
  capturePageViews: true,          // Track page navigation
  
  // Development settings
  debugMode: false,               // Enable console logging
  disableInDevelopment: false     // Disable in dev environment
};

// Easy presets for different environments
export const ANALYTICS_PRESETS = {
  // Full analytics suite (use carefully - high performance impact)
  FULL: {
    ...ANALYTICS_CONFIG,
    webVitalsEnabled: true,
    sessionRecordingEnabled: true,
    debugMode: true
  },
  
  // Performance focused (recommended for production)
  PERFORMANCE: {
    ...ANALYTICS_CONFIG,
    webVitalsEnabled: true,
    sessionRecordingEnabled: false,
    autocaptureEnabled: true,
    debugMode: false
  },
  
  // Minimal tracking
  MINIMAL: {
    ...ANALYTICS_CONFIG,
    webVitalsEnabled: false,
    sessionRecordingEnabled: false,
    autocaptureEnabled: false,
    capturePageViews: true,
    debugMode: false
  },
  
  // Development mode
  DEV: {
    ...ANALYTICS_CONFIG,
    debugMode: true,
    disableInDevelopment: false
  }
};
