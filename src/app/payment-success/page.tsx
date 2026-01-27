"use client";

import { Suspense } from "react";
import PaymentSuccessComponent from "@/components/PaymentSuccess";
import { useSearchParams } from "next/navigation";
import { logger } from "@/utils/logger";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const payment_intent = searchParams.get("payment_intent") || "";

  logger.debug("searchParams in calling page", searchParams);
  logger.debug("payment_intent in calling page", payment_intent);
  
  return <PaymentSuccessComponent payment_intent={payment_intent} />;
}

import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function PaymentSuccess() {
  return (
    <ErrorBoundary featureName="Payment Success">
      <Suspense fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <LoadingSpinner label="Processing payment..." />
        </div>
      }>
        <PaymentSuccessContent />
      </Suspense>
    </ErrorBoundary>
  );
}
