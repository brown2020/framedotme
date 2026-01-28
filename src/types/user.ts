/**
 * User type definitions
 * Re-exports from domain-specific type files for backward compatibility
 * 
 * Prefer importing from domain-specific files (e.g., @/types/auth)
 * when possible for better code organization
 */

// Auth types
export type {
  AuthContext,
  AuthState,
} from "./auth";

// Profile types
export type {
  Profile,
} from "./profile";

// Default values
export {
  DEFAULT_AUTH_STATE,
  DEFAULT_PROFILE,
} from "@/constants/defaults";
