"use client";

import type { FormEvent, ReactElement } from "react";
import { useId, useState } from "react";
import Link from "next/link";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";

import { auth } from "@/firebase/firebaseClient";
import { mapFirebaseAuthError } from "@/lib/firebaseAuthErrors";
import { hardNavigateAfterAuth } from "@/lib/auth/waitForSessionReady";
import { resolvePostAuthPath } from "@/lib/auth/resolvePostAuthPath";
import { PasswordField } from "@/components/auth/PasswordField";
import { AuthSocialSection } from "@/components/auth/AuthSocialSection";
import { browserStorage } from "@/services/browserStorageService";
import { AUTH_STORAGE_KEYS } from "@/constants/auth";

type SignupFormProps = {
  redirectTo?: string | null;
};

export function SignupForm({
  redirectTo = null,
}: SignupFormProps): ReactElement {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const errorId = useId();

  const loginHref =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? `/login?redirect=${encodeURIComponent(redirectTo)}`
      : "/login";

  const finishAuth = async () => {
    browserStorage.setItem(AUTH_STORAGE_KEYS.EMAIL, email);
    const emailName = email.split("@")[0];
    if (emailName) {
      browserStorage.setItem(AUTH_STORAGE_KEYS.NAME, emailName);
    }
    const path =
      redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
        ? redirectTo
        : resolvePostAuthPath();
    await hardNavigateAfterAuth(path);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!acceptTerms) {
      setError("Please accept the Terms of Service and Privacy Policy.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      await finishAuth();
    } catch (err) {
      setError(mapFirebaseAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogle = async () => {
    if (!acceptTerms) {
      setError("Please accept the Terms of Service and Privacy Policy.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      const path =
        redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
          ? redirectTo
          : resolvePostAuthPath();
      await hardNavigateAfterAuth(path);
    } catch (err) {
      setError(mapFirebaseAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {error ? (
          <p
            id={errorId}
            role="alert"
            className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700"
          >
            {error}
          </p>
        ) : null}

        <div>
          <label
            htmlFor="signup-email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            name="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-describedby={error ? errorId : undefined}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>

        <PasswordField
          id="signup-password"
          label="Password"
          name="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          aria-describedby={error ? errorId : undefined}
        />

        <PasswordField
          id="signup-confirm"
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter password"
          aria-describedby={error ? errorId : undefined}
        />

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

        <button
          type="submit"
          disabled={submitting || !email || !password}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-bold text-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <AuthSocialSection disabled={submitting} onGoogle={onGoogle} />

      <p className="text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link
          href={loginHref}
          className="font-medium text-blue-600 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
