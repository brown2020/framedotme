"use client";

import type { ReactElement } from "react";
import AuthDataDisplay from "./AuthDataDisplay";
import PaymentsPage from "./PaymentsPage";
import ProfileComponent from "./ProfileComponent";

/**
 * Profile page component that displays user information and settings
 * Shows authentication data, user profile, and payment history
 * 
 * @returns The profile page with user information sections
 */
export default function Profile(): ReactElement {
  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto gap-4">
      <div className="text-3xl font-bold mt-5">User Profile</div>
      <AuthDataDisplay />
      <ProfileComponent />
      <PaymentsPage />
    </div>
  );
}
