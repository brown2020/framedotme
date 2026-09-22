"use client";

import type { FormEvent, ReactElement } from "react";
import { useId, useState } from "react";
import Link from "next/link";
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
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

type LoginFormProps = {
  redirectTo?: string | null;
};

export function LoginForm({ redirectTo = null }: LoginFormProps): ReactElement {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const errorId = useId();

  const signupHref =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? `/signup?redirect=${encodeURIComponent(redirectTo)}`
      : "/signup";

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
    setSubmitting(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      await finishAuth();
    } catch (err) {
      setError(mapFirebaseAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogle = async () => {
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
            htmlFor="login-email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>
          <input
            id="login-email"
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

        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <label
              htmlFor="login-password"
              className="text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordField
            id="login-password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            aria-describedby={error ? errorId : undefined}
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !email || !password}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-bold text-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <AuthSocialSection disabled={submitting} onGoogle={onGoogle} />

      <p className="text-center text-sm text-gray-600">
        New here?{" "}
        <Link
          href={signupHref}
          className="font-medium text-blue-600 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
