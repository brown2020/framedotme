"use client";

import type { ReactElement } from "react";
import { AuthDataDisplay } from "@/components/AuthDataDisplay";
import { PaymentsSection } from "@/components/PaymentsSection";
import { ProfileComponent } from "@/components/ProfileComponent";

/**
 * Profile page component that displays user information and settings
 * Shows authentication data, user profile, and payment history
 * 
 * @returns The profile page with user information sections
 */
export function ProfilePage(): ReactElement {
  return (
    <div className="flex flex-col h-full w-full overflow-y-auto bg-linear-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">User Profile</h1>
        <p className="text-gray-600 mb-6">Manage your account settings and view your activity</p>
        
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <AuthDataDisplay />
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <ProfileComponent />
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <PaymentsSection />
        </div>
      </div>
    </div>
  );
}
