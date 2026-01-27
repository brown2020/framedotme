/**
 * Environment variable validation utilities
 * Provides type-safe access to environment variables with runtime validation
 */

import { logger } from "@/utils/logger";

/**
 * Validates that required environment variables are present
 * @param vars - Array of environment variable names to validate
 * @throws Error if any required variables are missing
 */
export function validateRequiredEnvVars(vars: readonly string[]): void {
  const missing = vars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    const error = `Missing required environment variable(s): ${missing.join(", ")}`;
    logger.error(error);
    throw new Error(error);
  }
}

/**
 * Gets an environment variable with a fallback value
 * @param key - Environment variable name
 * @param fallback - Default value if variable is not set
 * @returns The environment variable value or fallback
 */
export function getEnvVar(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

/**
 * Gets a required environment variable
 * @param key - Environment variable name
 * @throws Error if variable is not set
 * @returns The environment variable value
 */
export function getRequiredEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    const error = `Missing required environment variable: ${key}`;
    logger.error(error);
    throw new Error(error);
  }
  return value;
}

/**
 * Type-safe configuration object builder
 * Validates and extracts environment variables into a structured config
 */
export function buildConfig<T extends Record<string, string>>(
  schema: Record<keyof T, { key: string; required?: boolean; default?: string }>
): T {
  const config = {} as T;
  const missing: string[] = [];

  for (const [field, spec] of Object.entries(schema)) {
    const value = process.env[spec.key];
    
    if (!value && spec.required) {
      missing.push(spec.key);
    }
    
    config[field as keyof T] = (value ?? spec.default ?? "") as T[keyof T];
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return config;
}
