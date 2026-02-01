"use client";

import type { ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import toast from "react-hot-toast";

import { auth } from "@/firebase/firebaseClient";
import { useIAPHandler } from "@/hooks/useIAPHandler";
import { useSignOut } from "@/hooks/useSignOut";
import { logger } from "@/utils/logger";
import { isReactNativeWebView } from "@/utils/platform";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { useAuthStore } from "@/zustand/useAuthStore";
import useProfileStore from "@/zustand/useProfileStore";

export function ProfileComponent(): ReactElement {
  const profile = useProfileStore((state) => state.profile);
  const [showCreditsSection, setShowCreditsSection] = useState(true);
  const deleteAccount = useProfileStore((state) => state.deleteAccount);
  const uid = useAuthStore((s) => s.uid);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { performSignOut, resetAllStores, clearAllCookies, clearAllStorage } = useSignOut();

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

  const handleSignOut = useCallback(async () => {
    await performSignOut();
  }, [performSignOut]);

  const onDeleteConfirm = useCallback(async () => {
    if (!uid) return;

    setShowDeleteModal(false);
    try {
      // 1. Delete account from Firestore
      await deleteAccount(uid);

      // 2. Sign out from Firebase
      await signOut(auth);

      // 3. Clear all state and storage using shared utilities
      resetAllStores();
      clearAllCookies();
      clearAllStorage();

      toast.success("Account deleted successfully.");

      // 4. Force a full page reload
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    } catch (error) {
      logger.error("Error on deletion of account", error);
      toast.error("Failed to delete account. Please try again.");
    }
  }, [deleteAccount, uid, resetAllStores, clearAllCookies, clearAllStorage]);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
      
      {/* Credits Section */}
      <section
        className="bg-blue-50 rounded-xl p-6 border border-blue-200"
        aria-labelledby="credits-section"
      >
        <h3 id="credits-section" className="text-lg font-bold text-gray-900 mb-4">
          Usage Credits
        </h3>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <div className="text-3xl font-bold text-blue-600">
              {Math.round(profile.credits).toLocaleString()}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Available credits for recordings
            </p>
          </div>
          <button
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all font-semibold shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={handleBuyClick}
            aria-label="Purchase 10,000 credits"
          >
            Buy 10,000 Credits
          </button>
        </div>
      </section>

      {/* Account Actions */}
      <section
        className="bg-gray-50 rounded-xl p-6 border border-gray-200"
        aria-labelledby="account-actions"
      >
        <h3 id="account-actions" className="text-lg font-bold text-gray-900 mb-4">
          Account Actions
        </h3>
        <button
          className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-all font-semibold shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
          onClick={handleSignOut}
          aria-label="Sign out of your account"
        >
          Sign Out
        </button>
      </section>

      {/* Danger Zone */}
      <section
        className="bg-red-50 rounded-xl p-6 border-2 border-red-300"
        aria-labelledby="danger-zone"
      >
        <h3 id="danger-zone" className="text-lg font-bold text-red-700 mb-2">
          Danger Zone
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button
          className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all font-semibold shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500"
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
