"use client";

import type { FormEvent, ReactElement } from "react";
import { useId, useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";

import { auth } from "@/firebase/firebaseClient";
import { mapFirebaseAuthError } from "@/lib/firebaseAuthErrors";

export function ForgotPasswordForm(): ReactElement {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const errorId = useId();

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (err) {
      // Avoid email enumeration: still show confirmation for user-not-found
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: unknown }).code)
          : "";
      if (code === "auth/user-not-found") {
        setSent(true);
      } else {
        setError(mapFirebaseAuthError(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-gray-700" role="status">
          If an account exists for{" "}
          <span className="font-medium">{email.trim() || "that address"}</span>,
          we sent a password reset link. Check your inbox and spam folder.
        </p>
        <Link
          href="/login"
          className="block w-full bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-bold text-center"
        >
          Back to sign in
        </Link>
        <button
          type="button"
          className="text-sm font-medium text-blue-600 hover:underline"
          onClick={() => {
            setError(null);
            setSent(false);
          }}
        >
          Try a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <p className="text-sm text-gray-600">
        Enter your email and we&apos;ll send a link to choose a new password.
      </p>

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
          htmlFor="forgot-email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email
        </label>
        <input
          id="forgot-email"
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

      <button
        type="submit"
        disabled={submitting || !email}
        className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Sending…" : "Send reset link"}
      </button>

      <p className="text-center text-sm text-gray-600">
        Remember your password?{" "}
        <Link href="/login" className="font-medium text-blue-600 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
