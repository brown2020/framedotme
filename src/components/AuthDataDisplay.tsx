"use client";

import type { ReactElement } from "react";
import Image from "next/image";
import { useAuthStore } from "@/zustand/useAuthStore";

export function AuthDataDisplay(): ReactElement {
  // Use individual selectors to avoid creating new objects on every render
  const uid = useAuthStore((s) => s.uid);
  const authEmail = useAuthStore((s) => s.authEmail);
  const authDisplayName = useAuthStore((s) => s.authDisplayName);
  const authPhotoUrl = useAuthStore((s) => s.authPhotoUrl);
  const authEmailVerified = useAuthStore((s) => s.authEmailVerified);
  const premium = useAuthStore((s) => s.premium);
  const lastSignIn = useAuthStore((s) => s.lastSignIn);

  const authData = {
    uid,
    authEmail,
    authDisplayName,
    authPhotoUrl,
    authEmailVerified,
    premium,
    lastSignIn,
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold text-gray-900">Account Information</h2>

      <div className="flex items-center gap-4">
        {authData.authPhotoUrl ? (
          <Image
            src={authData.authPhotoUrl}
            alt="Profile"
            width={80}
            height={80}
            className="rounded-full border-2 border-blue-200 shadow-md"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl border-2 border-blue-200">
            {authData.authDisplayName?.charAt(0)?.toUpperCase() ||
              authData.authEmail?.charAt(0)?.toUpperCase() ||
              "?"}
          </div>
        )}
        <div>
          <div className="text-xl font-bold text-gray-900">
            {authData.authDisplayName || "User"}
          </div>
          <div className="text-gray-600">{authData.authEmail || "N/A"}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-500 mb-1">Email Verified</div>
          <div className="font-semibold text-gray-900">
            {authData.authEmailVerified ? "✓ Verified" : "✗ Not Verified"}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-500 mb-1">Account Type</div>
          <div className="font-semibold text-gray-900">
            {authData.premium ? "Premium" : "Free"}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-500 mb-1">Last Sign In</div>
          <div className="font-semibold text-gray-900">
            {lastSignIn
              ? lastSignIn.toDate().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "N/A"}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-500 mb-1">User ID</div>
          <div className="font-mono text-xs text-gray-700 break-all">
            {authData.uid || "N/A"}
          </div>
        </div>
      </div>
    </div>
  );
}
