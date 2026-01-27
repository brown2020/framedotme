"use client";

import useProfileStore from "@/zustand/useProfileStore";
import { useCallback, useEffect, useState } from "react";
import { isIOSReactNativeWebView } from "@/utils/platform";
import { usePaymentsStore } from "@/zustand/usePaymentsStore";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase/firebaseClient";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuthStore } from "@/zustand/useAuthStore";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { logger } from "@/utils/logger";

export default function ProfileComponent() {
  const profile = useProfileStore((state) => state.profile);
  const router = useRouter();

  const [showCreditsSection, setShowCreditsSection] = useState(true);
  const addCredits = useProfileStore((state) => state.addCredits);
  const addPayment = usePaymentsStore((state) => state.addPayment);
  const deleteAccount = useProfileStore((state) => state.deleteAccount);
  const clearAuthDetails = useAuthStore((s) => s.clearAuthDetails);
  const uid = useAuthStore((s) => s.uid);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const handleMessageFromRN = async (event: MessageEvent) => {
      if (!uid) return;
      
      const message = event.data;
      if (message?.type === "IAP_SUCCESS") {
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
      }
    };

    // Listen for messages from the RN WebView
    window.addEventListener("message", handleMessageFromRN);

    return () => {
      window.removeEventListener("message", handleMessageFromRN);
    };
  }, [addCredits, addPayment, uid]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowCreditsSection(!isIOSReactNativeWebView());
  }, []);

  const handleBuyClick = useCallback(() => {
    if (showCreditsSection) {
      window.location.href = "/payment-attempt";
    } else {
      window.ReactNativeWebView?.postMessage("INIT_IAP");
    }
  }, [showCreditsSection]);

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const onDeleteConfirm = useCallback(async () => {
    if (!uid) return;
    
    setShowDeleteModal(false);
    try {
      await deleteAccount(uid);
      await signOut(auth);
      clearAuthDetails();
      toast.success("Account deleted successfully.");
      router.replace("/");
    } catch (error) {
      logger.error("Error on deletion of account", error);
    }
  }, [deleteAccount, clearAuthDetails, router, uid]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row px-5 py-3 gap-3 border border-gray-500 rounded-md">
        <div className="flex gap-2 w-full items-center">
          <div className="flex-1">
            Usage Credits: {Math.round(profile.credits)}
          </div>
          <button
            className="bg-blue-500 text-white px-3 py-2 rounded-md hover:opacity-50 flex-1 text-center"
            onClick={handleBuyClick}
          >
            Buy 10,000 Credits
          </button>
        </div>
        <div className="text-sm text-gray-600 mt-2">
          You can either buy credits or add your own API keys.
        </div>
      </div>

      <div className="flex flex-col px-5 py-3 gap-3 border border-gray-500 rounded-md">
        <button
          className="btn-primary bg-[#e32012] self-start rounded-md hover:bg-[#e32012]/30"
          onClick={handleDeleteClick}
        >
          Delete Account
        </button>
      </div>

      <DeleteConfirmModal
        showDeleteModal={showDeleteModal}
        onHideModal={() => setShowDeleteModal(false)}
        onDeleteConfirm={onDeleteConfirm}
      />
    </div>
  );
}
