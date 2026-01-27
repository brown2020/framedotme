import type { ReactNode, ReactElement, ComponentType } from "react";

/**
 * Provider configuration with children prop
 */
interface ProviderConfig {
  component: ComponentType<{ children: ReactNode }>;
  props?: Record<string, unknown>;
}

interface ProviderComposerProps {
  providers: readonly ProviderConfig[];
  children: ReactNode;
}

/**
 * Composes multiple React providers in the specified order
 * Enforces proper nesting order and prevents accidental reordering
 * 
 * @param providers - Array of provider configurations (outermost to innermost)
 * @param children - Child components to wrap
 * @returns Composed provider tree
 * 
 * @example
 * ```tsx
 * const providers = [
 *   { component: ErrorBoundary },
 *   { component: AuthProvider },
 *   { component: ThemeProvider, props: { theme: 'dark' } }
 * ];
 * 
 * <ProviderComposer providers={providers}>
 *   <App />
 * </ProviderComposer>
 * ```
 */
export function ProviderComposer({
  providers,
  children,
}: ProviderComposerProps): ReactElement {
  return providers.reduceRight(
    (acc, { component: Provider, props = {} }) => (
      <Provider {...props}>{acc}</Provider>
    ),
    children
  ) as ReactElement;
}
