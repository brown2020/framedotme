import { logger } from "@/utils/logger";

/**
 * Safe wrapper for localStorage operations with error handling
 */
class BrowserStorageService {
  private _isAvailable: boolean | null = null;

  /**
   * Checks if localStorage is available in the current environment
   * Result is cached after first check for performance
   * @returns True if localStorage is available, false otherwise
   */
  private isAvailable(): boolean {
    // Cache the availability check
    if (this._isAvailable !== null) {
      return this._isAvailable;
    }

    try {
      const testKey = "__storage_test__";
      window.localStorage.setItem(testKey, "test");
      window.localStorage.removeItem(testKey);
      this._isAvailable = true;
      return true;
    } catch {
      this._isAvailable = false;
      return false;
    }
  }

  /**
   * Sets an item in localStorage
   * @param key - Storage key
   * @param value - String value to store
   * @returns True if successful, false otherwise
   */
  setItem(key: string, value: string): boolean {
    if (!this.isAvailable()) {
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
  }

  /**
   * Gets an item from localStorage
   * @param key - Storage key
   * @returns The stored value, or null if not found or unavailable
   */
  getItem(key: string): string | null {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      logger.error(`Failed to get localStorage item: ${key}`, error);
      return null;
    }
  }

  /**
   * Removes an item from localStorage
   * @param key - Storage key
   * @returns True if successful, false otherwise
   */
  removeItem(key: string): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      logger.error(`Failed to remove localStorage item: ${key}`, error);
      return false;
    }
  }

  /**
   * Clears all items from localStorage
   * @returns True if successful, false otherwise
   */
  clear(): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      window.localStorage.clear();
      return true;
    } catch (error) {
      logger.error("Failed to clear localStorage", error);
      return false;
    }
  }
}

export const browserStorage = new BrowserStorageService();
