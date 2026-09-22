"use client";

import type { ReactElement } from "react";
import Image from "next/image";
import googleLogo from "@/app/assets/google.svg";

type GoogleSignInButtonProps = {
  disabled?: boolean;
  onClick: () => void;
};

/**
 * Shared Google OAuth CTA for login/signup (avoids duplicate JSX + Doctor flag).
 */
export function GoogleSignInButton({
  disabled,
  onClick,
}: GoogleSignInButtonProps): ReactElement {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex items-center justify-center gap-3 w-full px-4 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold text-gray-700 disabled:opacity-50"
    >
      <span className="w-6 h-6 relative">
        <Image
          src={googleLogo}
          alt=""
          fill
          sizes="24px"
          className="object-contain"
        />
      </span>
      <span>Continue with Google</span>
    </button>
  );
}
