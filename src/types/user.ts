/**
 * User type definitions
 * Re-exports from domain-specific type files for backward compatibility
 * 
 * Prefer importing from domain-specific files (e.g., @/types/auth.types)
 * when possible for better code organization
 */

// Auth types
export type {
  AuthContext,
  AuthState,
} from "./auth.types";

export {
  DEFAULT_AUTH_STATE,
} from "./auth.types";

// Profile types
export type {
  Profile,
} from "./profile.types";

export {
  DEFAULT_PROFILE,
} from "./profile.types";
