import { logger } from "@/utils/logger";

/**
 * Safe wrapper for localStorage operations with error handling
 */
class BrowserStorageService {
  private isAvailable(): boolean {
    try {
      const testKey = "__storage_test__";
      window.localStorage.setItem(testKey, "test");
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

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

// Auth-specific storage keys
export const AUTH_STORAGE_KEYS = {
  EMAIL: "frameEmail",
  NAME: "frameName",
  TOKEN_REFRESH: (cookieName: string) => `lastTokenRefresh_${cookieName}`,
} as const;
