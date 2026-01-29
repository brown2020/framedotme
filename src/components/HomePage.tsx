"use client";

import type { ReactElement } from "react";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { useAuthStore } from "@/zustand/useAuthStore";
import { useAuthHandlers } from "@/hooks/useAuthHandlers";
import { isReactNativeWebView } from "@/utils/platform";
import googleLogo from "@/app/assets/google.svg";
import {
  FileVideoIcon,
  ScanIcon,
  CircleUserIcon,
  PlayCircleIcon,
  CloudIcon,
  ShieldCheckIcon,
  ZapIcon,
  CheckCircleIcon,
  MailIcon,
  LockIcon,
} from "lucide-react";

/**
 * Home page component that displays the landing page with authentication
 * Shows marketing content for unauthenticated users or dashboard for authenticated users
 *
 * @returns The home page component with responsive layout
 */
export function HomePage(): ReactElement {
  const router = useRouter();
  const uid = useAuthStore((state) => state.uid);
  const authReady = useAuthStore((state) => state.authReady);
  const displayName = useAuthStore((state) => state.authDisplayName);
  const isAuthenticated = authReady && !!uid;

  const formRef = useRef<HTMLFormElement>(null);
  const showGoogleSignIn = !isReactNativeWebView();

  const {
    email,
    setEmail,
    password,
    setPassword,
    acceptTerms,
    setAcceptTerms,
    isEmailLinkLogin,
    setIsEmailLinkLogin,
    signInWithGoogle,
    handlePasswordAuth,
    handlePasswordReset,
  } = useAuthHandlers(() => {});

  const handleGoogleSignIn = async () => {
    if (!acceptTerms) {
      formRef.current?.reportValidity();
      return;
    }
    await signInWithGoogle();
  };

  const handleFormSubmit = handlePasswordAuth;

  // Authenticated Dashboard (Light Mode)
  if (isAuthenticated) {
    return (
      <div className="relative flex flex-col h-full w-full overflow-y-auto bg-linear-to-br from-gray-50 via-blue-50 to-purple-50">
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-12">
          {/* Welcome Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
              Welcome back{displayName ? `, ${displayName}` : ""}!
            </h1>
            <p className="text-xl text-gray-600">
              Ready to capture and share your screen
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <button
              onClick={() => router.push("/capture")}
              className="group relative overflow-hidden bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-200"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="p-4 bg-blue-600 rounded-full text-white group-hover:bg-blue-700 transition-colors">
                  <ScanIcon size={40} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Start Recording
                </h3>
                <p className="text-gray-600">
                  Capture your screen in one click
                </p>
              </div>
            </button>

            <button
              onClick={() => router.push("/recordings")}
              className="group relative overflow-hidden bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-200"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="p-4 bg-indigo-600 rounded-full text-white group-hover:bg-indigo-700 transition-colors">
                  <FileVideoIcon size={40} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  My Recordings
                </h3>
                <p className="text-gray-600">View and manage your videos</p>
              </div>
            </button>

            <button
              onClick={() => router.push("/profile")}
              className="group relative overflow-hidden bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-200"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="p-4 bg-purple-600 rounded-full text-white group-hover:bg-purple-700 transition-colors">
                  <CircleUserIcon size={40} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Profile</h3>
                <p className="text-gray-600">Manage your account settings</p>
              </div>
            </button>
          </div>

          {/* Getting Started Guide */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              Getting Started
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircleIcon size={24} className="text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1 text-gray-900">
                    1. Start Recording
                  </h4>
                  <p className="text-sm text-gray-600">
                    Click "Start Recording" to capture your screen
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CloudIcon size={24} className="text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1 text-gray-900">
                    2. Auto-Save
                  </h4>
                  <p className="text-sm text-gray-600">
                    Your recordings are automatically saved
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <PlayCircleIcon size={24} className="text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1 text-gray-900">
                    3. View & Share
                  </h4>
                  <p className="text-sm text-gray-600">
                    Access your recordings anytime, anywhere
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Marketing Landing Page with Integrated Sign-In
  return (
    <div className="relative flex flex-col h-full w-full overflow-y-auto bg-linear-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="flex-1 w-full">
        {/* Hero Section with Integrated Sign-In */}
        <section className="max-w-7xl mx-auto px-4 py-12 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Marketing Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Screen Recording
                <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600">
                  Made Simple
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8">
                Capture, save, and share your screen recordings effortlessly.
                Perfect for tutorials, demos, and presentations.
              </p>

              {/* Feature Highlights */}
              <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ZapIcon size={24} className="text-blue-600" />
                  </div>
                  <span className="text-lg text-gray-700">
                    Start recording in seconds
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CloudIcon size={24} className="text-green-600" />
                  </div>
                  <span className="text-lg text-gray-700">
                    Automatic cloud storage
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <ShieldCheckIcon size={24} className="text-purple-600" />
                  </div>
                  <span className="text-lg text-gray-700">
                    Secure and private
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Sign-In Form */}
            <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
                <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">
                  Get Started Free
                </h2>

                <form
                  onSubmit={handleFormSubmit}
                  ref={formRef}
                  className="flex flex-col gap-4"
                >
                  {showGoogleSignIn && (
                    <>
                      <button
                        type="button"
                        className="flex items-center justify-center gap-3 w-full px-4 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold text-gray-700 shadow-sm hover:shadow-md"
                        onClick={handleGoogleSignIn}
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
                          onClick={handlePasswordReset}
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
                    disabled={
                      !email || (!isEmailLinkLogin && !password) || !acceptTerms
                    }
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
                      <Link
                        href="/terms"
                        className="text-blue-600 hover:underline"
                      >
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy"
                        className="text-blue-600 hover:underline"
                      >
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
            Why Choose Frame.me?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="p-3 bg-blue-100 rounded-xl w-fit mb-4">
                <ZapIcon size={32} className="text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">
                Lightning Fast
              </h3>
              <p className="text-gray-600">
                Start recording in seconds. No complex setup or configuration
                needed.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="p-3 bg-green-100 rounded-xl w-fit mb-4">
                <CloudIcon size={32} className="text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">
                Cloud Storage
              </h3>
              <p className="text-gray-600">
                All your recordings are automatically saved and accessible from
                anywhere.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="p-3 bg-purple-100 rounded-xl w-fit mb-4">
                <ShieldCheckIcon size={32} className="text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">
                Secure & Private
              </h3>
              <p className="text-gray-600">
                Your data is encrypted and secure. Only you have access to your
                recordings.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full text-2xl font-bold mb-4">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Sign Up</h3>
              <p className="text-gray-600">
                Create your free account in seconds
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full text-2xl font-bold mb-4">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Record</h3>
              <p className="text-gray-600">
                Click record and capture your screen
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full text-2xl font-bold mb-4">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Share</h3>
              <p className="text-gray-600">
                Access and share your recordings anywhere
              </p>
            </div>
          </div>
        </section>

        {/* Social Proof / Trust Section */}
        <section className="max-w-5xl mx-auto px-4 py-16">
          <div className="bg-linear-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white text-center shadow-xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Join Thousands of Happy Users
            </h2>
            <p className="text-xl opacity-90 mb-6">
              Trusted by professionals, educators, and creators worldwide
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">100%</div>
                <div className="text-blue-100">Cloud-Based</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">Instant</div>
                <div className="text-blue-100">Setup Time</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">Secure</div>
                <div className="text-blue-100">Your Privacy</div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
