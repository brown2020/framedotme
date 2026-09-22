"use client";

import type { ReactElement } from "react";
import Link from "next/link";

/**
 * First-class auth entry points on the landing hero (Auth UX gate).
 */
export function HomeAuthCta(): ReactElement {
  return (
    <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
      <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">
          Get Started Free
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Sign in or create an account to capture and share screen recordings.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/signup"
            className="w-full text-center bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-bold text-lg shadow-md"
          >
            Create account
          </Link>
          <Link
            href="/login"
            className="w-full text-center border-2 border-gray-300 text-gray-800 px-6 py-3 rounded-xl hover:bg-gray-50 font-semibold"
          >
            Sign in
          </Link>
          <Link
            href="/forgot-password"
            className="text-center text-sm text-blue-600 hover:underline mt-1"
          >
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
}
