import { useEffect } from "react";
import { submitIapReceipt } from "@/actions/accountActions";
import { logger } from "@/utils/logger";
import toast from "react-hot-toast";

/**
 * Listens for in-app purchase messages from the same origin only.
 * Credits are never applied here. The server refuses unverified receipts.
 */
export const useIAPHandler = (uid: string | undefined) => {
  useEffect(() => {
    const handleMessageFromRN = (event: MessageEvent) => {
      if (!uid) return;
      if (event.origin !== window.location.origin) return;

      const message = event.data;
      if (message?.type !== "IAP_SUCCESS") return;

      void submitIapReceipt().catch((error: unknown) => {
        logger.error("Failed to process IAP payment", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "In-app purchases are not available.",
        );
      });
    };

    window.addEventListener("message", handleMessageFromRN);
    return () => window.removeEventListener("message", handleMessageFromRN);
  }, [uid]);
};
