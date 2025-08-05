/**
 * Production Performance Configuration
 * 
 * Optimized settings for production builds with debug code stripped
 * and performance monitoring enabled.
 */

export const PRODUCTION_CONFIG = {
  // Animation settings optimized for performance
  animations: {
    enabled: true,
    respectReducedMotion: true,
    debugMode: false, // Always false in production
    performanceMonitoring: false, // Disabled to avoid performance overhead
    defaultDuration: 600,
    defaultEasing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },

  // Analytics configuration optimized for performance
  analytics: {
    enabled: true,
    webVitalsEnabled: true, // Important for performance monitoring
    sessionRecordingEnabled: false, // Disabled for performance
    autocaptureEnabled: true,
    capturePageViews: true,
    debugMode: false,
    disableInDevelopment: false
  },

  // CSS/Bundle optimization
  css: {
    purgeUnusedClasses: true,
    minimizeKeyframes: true,
    enableHardwareAcceleration: true
  },

  // JavaScript optimization
  javascript: {
    stripConsoleLog: true,
    stripDebugCode: true,
    minifyAnimations: true,
    usePassiveListeners: true
  }
};

export const DEVELOPMENT_CONFIG = {
  // Development settings with debugging enabled
  animations: {
    enabled: true,
    respectReducedMotion: true,
    debugMode: true, // Enabled for development
    performanceMonitoring: true, // Enabled for debugging
    defaultDuration: 600,
    defaultEasing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },

  analytics: {
    enabled: true,
    webVitalsEnabled: true,
    sessionRecordingEnabled: false, // Still disabled for performance
    autocaptureEnabled: true,
    capturePageViews: true,
    debugMode: true, // Enabled for development
    disableInDevelopment: false
  },

  css: {
    purgeUnusedClasses: false, // Keep all classes for debugging
    minimizeKeyframes: false,
    enableHardwareAcceleration: true
  },

  javascript: {
    stripConsoleLog: false, // Keep console logs
    stripDebugCode: false,
    minifyAnimations: false,
    usePassiveListeners: true
  }
};

/**
 * Get configuration based on environment
 */
export function getConfig() {
  const isProduction = process.env.NODE_ENV === 'production' || import.meta.env.PROD;
  return isProduction ? PRODUCTION_CONFIG : DEVELOPMENT_CONFIG;
}

/**
 * Performance monitoring utilities (only in development)
 */
export const PerformanceMonitor = {
  measureAnimationPerformance: (name: string, fn: () => void) => {
    if (process.env.NODE_ENV !== 'production') {
      const start = performance.now();
      fn();
      const end = performance.now();
      console.log(`[Performance] ${name} took ${(end - start).toFixed(2)}ms`);
    } else {
      fn();
    }
  },

  trackMemoryUsage: () => {
    if (process.env.NODE_ENV !== 'production' && 'memory' in performance) {
      const memory = (performance as any).memory;
      console.log('[Performance] Memory Usage:', {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB',
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + 'MB',
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
      });
    }
  },

  warnSlowAnimations: (duration: number, threshold: number = 16) => {
    if (process.env.NODE_ENV !== 'production' && duration > threshold) {
      console.warn(`[Performance] Slow animation detected: ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`);
    }
  }
};

/**
 * Console log wrapper that strips in production
 */
export const logger = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(...args);
    }
  },
  
  error: (...args: any[]) => {
    // Always log errors, even in production
    console.error(...args);
  }
};
