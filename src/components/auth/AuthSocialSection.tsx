"use client";

import type { ReactElement } from "react";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

type AuthSocialSectionProps = {
  disabled?: boolean;
  onGoogle: () => void;
};

/** Shared Google CTA + divider for login/signup. */
export function AuthSocialSection({
  disabled,
  onGoogle,
}: AuthSocialSectionProps): ReactElement {
  return (
    <>
      <div className="flex items-center justify-center w-full">
        <hr className="grow h-px bg-gray-300 border-0" />
        <span className="px-4 text-gray-500 text-sm">or</span>
        <hr className="grow h-px bg-gray-300 border-0" />
      </div>
      <GoogleSignInButton disabled={disabled} onClick={onGoogle} />
    </>
  );
}
