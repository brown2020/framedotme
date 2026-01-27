import { Component, ErrorInfo, ReactNode } from "react";
import { logger } from "@/utils/logger";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FeatureErrorBoundaryProps {
  children: ReactNode;
  featureName: string;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface FeatureErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Feature-specific error boundary that isolates errors to specific parts of the app
 * Provides better UX by allowing other features to continue working
 * 
 * @example
 * ```typescript
 * <FeatureErrorBoundary featureName="Recordings">
 *   <RecordingsPage />
 * </FeatureErrorBoundary>
 * ```
 */
export class FeatureErrorBoundary extends Component<
  FeatureErrorBoundaryProps,
  FeatureErrorBoundaryState
> {
  constructor(props: FeatureErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): FeatureErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(`${this.props.featureName} Error Boundary caught error`, {
      error,
      errorInfo,
      featureName: this.props.featureName,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  override render() {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="flex flex-col items-center justify-center p-8 gap-4">
          <Alert variant="destructive" className="max-w-2xl">
            <AlertDescription>
              <div className="flex flex-col gap-3">
                <h3 className="font-semibold text-lg">
                  {this.props.featureName} Error
                </h3>
                <p>
                  Something went wrong in the {this.props.featureName} feature.
                  This error has been isolated to prevent affecting other parts
                  of the app.
                </p>
                {this.state.error && (
                  <p className="text-sm text-muted-foreground">
                    {this.state.error.message}
                  </p>
                )}
                <Button onClick={this.handleReset} variant="outline" className="w-fit">
                  Try Again
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}
