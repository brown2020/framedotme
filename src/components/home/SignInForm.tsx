"use client";

import type { ReactElement, RefObject } from "react";
import Image from "next/image";
import Link from "next/link";
import { MailIcon, LockIcon } from "lucide-react";
import googleLogo from "@/app/assets/google.svg";

interface SignInFormProps {
  formRef: RefObject<HTMLFormElement | null>;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  acceptTerms: boolean;
  setAcceptTerms: (accept: boolean) => void;
  isEmailLinkLogin: boolean;
  setIsEmailLinkLogin: (isEmailLink: boolean) => void;
  showGoogleSignIn: boolean;
  onGoogleSignIn: () => Promise<void>;
  onFormSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onPasswordReset: () => Promise<void>;
}

/**
 * Sign-in form component with Google OAuth and email/password options
 */
export function SignInForm({
  formRef,
  email,
  setEmail,
  password,
  setPassword,
  acceptTerms,
  setAcceptTerms,
  isEmailLinkLogin,
  setIsEmailLinkLogin,
  showGoogleSignIn,
  onGoogleSignIn,
  onFormSubmit,
  onPasswordReset,
}: SignInFormProps): ReactElement {
  return (
    <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
      <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">
          Get Started Free
        </h2>

        <form onSubmit={onFormSubmit} ref={formRef} className="flex flex-col gap-4">
          {showGoogleSignIn && (
            <>
              <button
                type="button"
                className="flex items-center justify-center gap-3 w-full px-4 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold text-gray-700 shadow-sm hover:shadow-md"
                onClick={onGoogleSignIn}
              >
                <div className="w-6 h-6 relative">
                  <Image
                    src={googleLogo}
                    alt="Google logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <span>Continue with Google</span>
              </button>
              <div className="flex items-center justify-center w-full">
                <hr className="grow h-px bg-gray-300 border-0" />
                <span className="px-4 text-gray-500 text-sm">or</span>
                <hr className="grow h-px bg-gray-300 border-0" />
              </div>
            </>
          )}

          <div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
              required
            />
          </div>

          {!isEmailLinkLogin && (
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                required
              />
              <div className="text-right mt-2">
                <button
                  type="button"
                  onClick={onPasswordReset}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all font-bold text-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!email || (!isEmailLinkLogin && !password) || !acceptTerms}
          >
            {isEmailLinkLogin ? (
              <div className="flex items-center justify-center gap-2">
                <MailIcon size={20} />
                <span>Send Magic Link</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <LockIcon size={20} />
                <span>Sign In / Sign Up</span>
              </div>
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsEmailLinkLogin(!isEmailLinkLogin)}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              {isEmailLinkLogin
                ? "Use Email & Password instead"
                : "Use Magic Link instead"}
            </button>
          </div>

          <label className="flex items-start gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-gray-300"
              required
            />
            <span>
              I accept the{" "}
              <Link href="/terms" className="text-blue-600 hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
            </span>
          </label>
        </form>
      </div>
    </div>
  );
}
