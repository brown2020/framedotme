/**
 * Routes that are publicly accessible without authentication
 */
const PUBLIC_ROUTES = [
  "/",
  "/about",
  "/terms",
  "/privacy",
  "/support",
] as const;

/**
 * Checks if a route is publicly accessible
 */
export const isPublicRoute = (pathname: string): boolean => {
  // Check exact matches
  if (PUBLIC_ROUTES.includes(pathname as typeof PUBLIC_ROUTES[number])) {
    return true;
  }

  // Check for image paths
  if (pathname.includes("images/")) {
    return true;
  }

  return false;
};

/**
 * Determines if a redirect to home is needed based on auth state
 */
export const shouldRedirectToHome = (
  loading: boolean,
  uid: string | undefined,
  pathname: string
): boolean => {
  // Don't redirect while loading
  if (loading) {
    return false;
  }

  // Don't redirect if user is authenticated
  if (uid) {
    return false;
  }

  // Don't redirect if route is public
  if (isPublicRoute(pathname)) {
    return false;
  }

  return true;
};
