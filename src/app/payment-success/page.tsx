"use client";

import PaymentSuccessPage from "@/components/PaymentSuccessPage";
import { useSearchParams } from "next/navigation";
import { logger } from "@/utils/logger";

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const payment_intent = searchParams.get("payment_intent") || "";

  logger.debug("searchParams in calling page", searchParams);
  logger.debug("payment_intent in calling page", payment_intent);
  
  return <PaymentSuccessPage payment_intent={payment_intent} />;
}
