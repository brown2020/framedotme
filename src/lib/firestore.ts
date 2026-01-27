/**
 * Firestore collection and document path constants
 * Centralized to prevent typos and ensure consistency
 */

export const COLLECTIONS = {
  USERS: 'users',
} as const;

export const SUBCOLLECTIONS = {
  PROFILE: 'profile',
  PAYMENTS: 'payments',
  BOTCASTS: 'botcasts',
  SETTINGS: 'settings',
} as const;

export const DOCUMENTS = {
  USER_DATA: 'userData',
  RECORDER: 'recorder',
} as const;

/**
 * Constructs a user document path
 */
export function getUserPath(uid: string): string {
  return `${COLLECTIONS.USERS}/${uid}`;
}

/**
 * Constructs a user profile document path
 */
export function getUserProfilePath(uid: string): string {
  return `${getUserPath(uid)}/${SUBCOLLECTIONS.PROFILE}/${DOCUMENTS.USER_DATA}`;
}

/**
 * Constructs a user payments collection path
 */
export function getUserPaymentsPath(uid: string): string {
  return `${getUserPath(uid)}/${SUBCOLLECTIONS.PAYMENTS}`;
}

/**
 * Constructs a user botcasts collection path
 */
export function getUserBotcastsPath(uid: string): string {
  return `${getUserPath(uid)}/${SUBCOLLECTIONS.BOTCASTS}`;
}

/**
 * Constructs a user recorder settings document path
 */
export function getUserRecorderSettingsPath(uid: string): string {
  return `${getUserPath(uid)}/${SUBCOLLECTIONS.SETTINGS}/${DOCUMENTS.RECORDER}`;
}
