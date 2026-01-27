"use client";

import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { logger } from "@/utils/logger";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ErrorBoundaryProps {
  children: ReactNode;
  featureName?: string;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const context = this.props.featureName 
      ? `${this.props.featureName} ErrorBoundary` 
      : "ErrorBoundary";
    logger.error(`${context} caught an error`, { error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  override render() {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Feature-specific error boundary UI
      if (this.props.featureName) {
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

      // Global error boundary UI
      return (
        <div className="flex flex-col gap-5 p-5 h-full bg-[#333b51] text-white">
          <h2 className="text-xl">
            Oops, there is an error! It could be related to your internet
            service. Try reloading.
          </h2>
          <button
            className="btn btn-primary mr-auto"
            type="button"
            onClick={this.handleReset}
          >
            Reload App
          </button>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <div>
              <div>
                Here is some error information you can share with the developer:
              </div>
              <p>Error Message: {this.state.error.message}</p>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
