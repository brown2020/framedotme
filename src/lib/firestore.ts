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
  RECORDINGS: 'botcasts', // Firestore path still uses 'botcasts' for backwards compatibility
  SETTINGS: 'settings',
} as const;

export const DOCUMENTS = {
  USER_DATA: 'userData',
  RECORDER: 'recorder',
} as const;

/**
 * Constructs a user document path
 */
export const getUserPath = (uid: string): string => {
  return `${COLLECTIONS.USERS}/${uid}`;
};

/**
 * Constructs a user profile document path
 */
export const getUserProfilePath = (uid: string): string => {
  return `${getUserPath(uid)}/${SUBCOLLECTIONS.PROFILE}/${DOCUMENTS.USER_DATA}`;
};

/**
 * Constructs a user payments collection path
 */
export const getUserPaymentsPath = (uid: string): string => {
  return `${getUserPath(uid)}/${SUBCOLLECTIONS.PAYMENTS}`;
};

/**
 * Constructs a user recordings collection path
 * Note: Firestore path uses 'botcasts' for backwards compatibility
 */
export const getUserRecordingsPath = (uid: string): string => {
  return `${getUserPath(uid)}/${SUBCOLLECTIONS.RECORDINGS}`;
};

/**
 * Constructs a user recorder settings document path
 */
export const getUserRecorderSettingsPath = (uid: string): string => {
  return `${getUserPath(uid)}/${SUBCOLLECTIONS.SETTINGS}/${DOCUMENTS.RECORDER}`;
};
