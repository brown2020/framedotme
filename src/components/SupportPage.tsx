"use client";

import type { ReactElement } from "react";
import { useCallback, useState } from "react";
import { useSignOut } from "@/hooks/useSignOut";
import { ConfirmDialog } from "./ui/confirm-dialog";

interface Props {
  companyName: string;
  companyEmail: string;
  companyAddress: string;
  companyLocation: string;
  updatedAt: string;
}

export function SupportPage({
  companyName,
  companyEmail,
  companyAddress,
  companyLocation,
  updatedAt,
}: Props): ReactElement {
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { performSignOut } = useSignOut();

  const handleHardReset = useCallback(async () => {
    setShowResetDialog(false);
    setIsResetting(true);

    try {
      await performSignOut({
        successMessage: "Application reset complete. Redirecting...",
        redirectDelay: 1000,
      });
    } catch {
      setIsResetting(false);
    }
  }, [performSignOut]);

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-linear-to-br from-blue-50 via-white to-purple-50">
      <div className="w-full max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="bg-linear-to-r from-green-600 to-blue-600 rounded-3xl p-12 mb-8 text-white text-center shadow-xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            Support Center
          </h1>
          <p className="text-green-100">We&apos;re here to help</p>
        </div>

        {/* Contact Information Card */}
        <div className="bg-white rounded-3xl shadow-lg p-8 md:p-12 mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Contact Us</h2>

          <p className="text-gray-700 mb-6 text-lg">
            {companyName} welcomes your questions or comments regarding this
            application. If you have any questions or doubts about the
            application, please contact us at:
          </p>

          <div className="bg-blue-50 rounded-2xl p-6 mb-6">
            <div className="space-y-2 text-gray-800">
              <p className="font-semibold text-xl">{companyName}</p>
              <p>{companyAddress}</p>
              <p>{companyLocation}</p>
            </div>
          </div>

          <div className="bg-purple-50 rounded-2xl p-6">
            <p className="text-gray-700 mb-2 font-semibold">Email Address:</p>
            <a
              href={`mailto:${companyEmail}`}
              className="text-blue-600 hover:text-blue-800 transition-colors text-lg font-semibold underline"
            >
              {companyEmail}
            </a>
          </div>
        </div>

        {/* Hard Reset Section */}
        <div className="bg-white rounded-3xl shadow-lg p-8 md:p-12 border-2 border-red-200">
          <div className="flex items-start gap-4 mb-6">
            <div className="text-4xl">⚠️</div>
            <div>
              <h2 className="text-3xl font-bold text-red-700 mb-2">
                Troubleshooting
              </h2>
              <p className="text-gray-600">
                Having technical issues? Try a hard reset.
              </p>
            </div>
          </div>

          <div className="bg-red-50 rounded-2xl p-6 mb-6">
            <p className="text-gray-700 mb-4 font-medium">A hard reset will:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Sign you out completely from your account</li>
              <li>Clear all authentication cookies and tokens</li>
              <li>Reset all local application data and preferences</li>
              <li>Return the application to a pristine state</li>
            </ul>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowResetDialog(true)}
              disabled={isResetting}
              className="bg-red-600 text-white px-8 py-4 rounded-xl hover:bg-red-700 transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 hover:shadow-lg"
            >
              {isResetting ? "Resetting..." : "Perform Hard Reset"}
            </button>
            <p className="text-sm text-gray-500 italic">
              Note: You will need to sign in again after resetting
            </p>
          </div>
        </div>

        {/* Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showResetDialog}
          onCancel={() => setShowResetDialog(false)}
          onConfirm={handleHardReset}
          title="Confirm Hard Reset"
          message="This will sign you out and clear all application data. You will need to sign in again. Are you sure you want to continue?"
          confirmLabel="Yes, Reset Everything"
          cancelLabel="Cancel"
          variant="destructive"
        />
      </div>
    </div>
  );
}
