"use client";

import type { ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import toast from "react-hot-toast";

import { auth } from "@/firebase/firebaseClient";
import { useIAPHandler } from "@/hooks/useIAPHandler";
import { logger } from "@/utils/logger";
import { isReactNativeWebView } from "@/utils/platform";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { useAuthStore } from "@/zustand/useAuthStore";
import useProfileStore from "@/zustand/useProfileStore";

export default function ProfileComponent(): ReactElement {
  const profile = useProfileStore((state) => state.profile);
  const router = useRouter();

  const [showCreditsSection, setShowCreditsSection] = useState(true);
  const deleteAccount = useProfileStore((state) => state.deleteAccount);
  const clearAuthDetails = useAuthStore((s) => s.clearAuthDetails);
  const uid = useAuthStore((s) => s.uid);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Handle IAP messages from React Native WebView
  useIAPHandler(uid);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowCreditsSection(!isReactNativeWebView());
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
      toast.error("Failed to delete account. Please try again.");
    }
  }, [deleteAccount, clearAuthDetails, router, uid]);

  return (
    <div className="flex flex-col gap-4">
      <section 
        className="flex flex-col sm:flex-row px-5 py-3 gap-3 border border-gray-500 rounded-md"
        aria-labelledby="credits-section"
      >
        <div className="flex gap-2 w-full items-center">
          <div className="flex-1" id="credits-section">
            <strong>Usage Credits:</strong> {Math.round(profile.credits)}
          </div>
          <button
            className="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition-colors flex-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={handleBuyClick}
            aria-label="Purchase 10,000 credits"
          >
            Buy 10,000 Credits
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          You can either buy credits or add your own API keys.
        </p>
      </section>

      <section 
        className="flex flex-col px-5 py-3 gap-3 border border-gray-500 rounded-md"
        aria-labelledby="danger-zone"
      >
        <h2 id="danger-zone" className="sr-only">Danger Zone</h2>
        <button
          className="btn-primary bg-[#e32012] self-start rounded-md hover:bg-[#e32012]/50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
          onClick={handleDeleteClick}
          aria-label="Delete your account permanently"
        >
          Delete Account
        </button>
      </section>

      <DeleteConfirmModal
        showDeleteModal={showDeleteModal}
        onHideModal={() => setShowDeleteModal(false)}
        onDeleteConfirm={onDeleteConfirm}
      />
    </div>
  );
}
