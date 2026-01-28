import { logger } from "@/utils/logger";

/**
 * Checks if localStorage is available in the current environment
 * Cached after first check for performance
 */
let isAvailableCache: boolean | null = null;

function isLocalStorageAvailable(): boolean {
  if (isAvailableCache !== null) {
    return isAvailableCache;
  }

  try {
    const testKey = "__storage_test__";
    window.localStorage.setItem(testKey, "test");
    window.localStorage.removeItem(testKey);
    isAvailableCache = true;
    return true;
  } catch {
    isAvailableCache = false;
    return false;
  }
}

/**
 * Safe wrapper for localStorage operations with error handling
 */
export const browserStorage = {
  /**
   * Sets an item in localStorage
   * @param key - Storage key
   * @param value - String value to store
   * @returns True if successful, false otherwise
   */
  setItem(key: string, value: string): boolean {
    if (!isLocalStorageAvailable()) {
      logger.warn("localStorage is not available");
      return false;
    }

    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      logger.error(`Failed to set localStorage item: ${key}`, error);
      return false;
    }
  },

  /**
   * Gets an item from localStorage
   * @param key - Storage key
   * @returns The stored value, or null if not found or unavailable
   */
  getItem(key: string): string | null {
    if (!isLocalStorageAvailable()) {
      return null;
    }

    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      logger.error(`Failed to get localStorage item: ${key}`, error);
      return null;
    }
  },

  /**
   * Removes an item from localStorage
   * @param key - Storage key
   * @returns True if successful, false otherwise
   */
  removeItem(key: string): boolean {
    if (!isLocalStorageAvailable()) {
      return false;
    }

    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      logger.error(`Failed to remove localStorage item: ${key}`, error);
      return false;
    }
  },

  /**
   * Clears all items from localStorage
   * @returns True if successful, false otherwise
   */
  clear(): boolean {
    if (!isLocalStorageAvailable()) {
      return false;
    }

    try {
      window.localStorage.clear();
      return true;
    } catch (error) {
      logger.error("Failed to clear localStorage", error);
      return false;
    }
  },
};
