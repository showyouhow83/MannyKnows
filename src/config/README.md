# Analytics Configuration

This directory contains centralized configuration for all analytics features.

## Quick Configuration

Edit `src/config/analytics.ts` to control analytics features:

```typescript
export const ANALYTICS_CONFIG = {
  enabled: true,                   // Master switch for all analytics
  webVitalsEnabled: true,          // Track Core Web Vitals (recommended)
  sessionRecordingEnabled: false,  // Record user sessions (performance impact)
  autocaptureEnabled: true,        // Auto-track clicks, forms, etc.
  capturePageViews: true,          // Track page navigation
  debugMode: false,               // Enable console logging
  disableInDevelopment: false     // Disable in dev environment
};
```

## Presets

Use predefined presets for common scenarios:

```typescript
import { ANALYTICS_PRESETS } from '../config/analytics.ts';

// In BaseLayout.astro
<PostHogAdvanced {...ANALYTICS_PRESETS.PERFORMANCE} />
```

Available presets:
- **FULL**: All features enabled (high performance impact)
- **PERFORMANCE**: Recommended for production (Web Vitals + basic tracking)
- **MINIMAL**: Basic page views only
- **DEV**: Development mode with debug logging

## Features

### Web Vitals Tracking
Tracks Core Web Vitals (CLS, LCP, FID) and page load times. Recommended for all sites.

### Session Recording
Records user interactions for replay. **High performance impact** - use sparingly.

### Autocapture
Automatically tracks clicks, form submissions, and interactions.

### Page Views
Basic navigation tracking. Minimal performance impact.

## Performance Notes

- **Web Vitals**: Minimal impact, provides valuable performance insights
- **Session Recording**: High impact, only enable when needed for specific debugging
- **Autocapture**: Medium impact, good balance of insights vs performance
- **Page Views**: Minimal impact, always recommended

## Environment Control

Set `disableInDevelopment: true` to disable analytics during development while keeping configuration for production.
