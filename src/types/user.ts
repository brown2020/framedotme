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

// Profile types
export type {
  Profile,
} from "./profile.types";

// Default values
export {
  DEFAULT_AUTH_STATE,
  DEFAULT_PROFILE,
} from "@/constants/defaults";
