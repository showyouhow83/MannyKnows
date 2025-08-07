/**
 * Debug Utilities for MannyKnows
 * Provides conditional logging based on environment
 */

// Check if we're in development mode
const isDev = !import.meta.env.PROD;

/**
 * Conditional console.log that only runs in development
 * @param message - The primary message to log
 * @param data - Optional additional data to log
 */
export function devLog(message: string, data?: any): void {
  if (isDev) {
    if (data !== undefined) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }
}

/**
 * Performance logging for debugging
 * @param label - Performance marker label
 * @param fn - Function to measure
 */
export function perfLog<T>(label: string, fn: () => T): T {
  if (isDev) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`⏱️ ${label}: ${(end - start).toFixed(2)}ms`);
    return result;
  }
  return fn();
}

/**
 * Error logging that works in both dev and production
 * @param message - Error message
 * @param error - Optional error object
 */
export function errorLog(message: string, error?: any): void {
  if (error) {
    console.error(message, error);
  } else {
    console.error(message);
  }
}

/**
 * Warning logging that works in both dev and production
 * @param message - Warning message
 * @param data - Optional additional data
 */
export function warnLog(message: string, data?: any): void {
  if (data !== undefined) {
    console.warn(message, data);
  } else {
    console.warn(message);
  }
}

/**
 * Development-only assertions
 * @param condition - Condition to assert
 * @param message - Message to log if assertion fails
 */
export function devAssert(condition: boolean, message: string): void {
  if (isDev && !condition) {
    console.error(`Assertion failed: ${message}`);
  }
}

export { isDev };
