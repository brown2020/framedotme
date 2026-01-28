/**
 * Firestore collection and document path constants
 * Centralized to prevent typos and ensure consistency
 */

export const COLLECTIONS = {
  USERS: 'users',
} as const;

/**
 * Legacy collection name for recordings (formerly "botcasts").
 * This name is preserved in Firestore paths for backwards compatibility with existing user data.
 * All new code should reference this constant rather than the literal string.
 * 
 * IMPORTANT: Changing this value will break access to existing recordings.
 * Any migration must handle data transfer from old to new collection.
 */
export const LEGACY_RECORDINGS_COLLECTION = 'botcasts' as const;

export const SUBCOLLECTIONS = {
  PROFILE: 'profile',
  PAYMENTS: 'payments',
  RECORDINGS: LEGACY_RECORDINGS_COLLECTION,
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
 * Constructs a user recordings collection path
 * Note: Uses LEGACY_RECORDINGS_COLLECTION for backwards compatibility
 */
export function getUserRecordingsPath(uid: string): string {
  return `${getUserPath(uid)}/${SUBCOLLECTIONS.RECORDINGS}`;
}

/**
 * Constructs a user recorder settings document path
 */
export function getUserRecorderSettingsPath(uid: string): string {
  return `${getUserPath(uid)}/${SUBCOLLECTIONS.SETTINGS}/${DOCUMENTS.RECORDER}`;
};
