import { useEffect } from "react";
import { usePaymentsStore } from "@/zustand/usePaymentsStore";
import useProfileStore from "@/zustand/useProfileStore";
import { logger } from "@/utils/logger";

/**
 * Hook to handle In-App Purchase (IAP) messages from React Native WebView
 * Listens for IAP_SUCCESS messages and updates payment and credit state accordingly
 * 
 * @param uid - The authenticated user's unique identifier
 * 
 * @example
 * ```typescript
 * useIAPHandler(user.uid);
 * ```
 */
export const useIAPHandler = (uid: string | undefined) => {
  const addCredits = useProfileStore((state) => state.addCredits);
  const addPayment = usePaymentsStore((state) => state.addPayment);

  useEffect(() => {
    const handleMessageFromRN = async (event: MessageEvent) => {
      if (!uid) return;
      
      const message = event.data;
      if (message?.type === "IAP_SUCCESS") {
        try {
          await addPayment(uid, {
            id: message.message,
            amount: message.amount,
            status: "succeeded",
            mode: "iap",
            platform: message.platform,
            productId: message.productId,
            currency: message.currency,
          });
          await addCredits(uid, 10000);
        } catch (error) {
          logger.error("Failed to process IAP payment", error);
        }
      }
    };

    window.addEventListener("message", handleMessageFromRN);

    return () => {
      window.removeEventListener("message", handleMessageFromRN);
    };
  }, [addCredits, addPayment, uid]);
};
