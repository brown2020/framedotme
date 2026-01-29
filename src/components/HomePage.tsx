"use client";

import type { ReactElement } from "react";
import { useRouter } from "next/navigation";
import { AuthContainer } from "@/components/auth/AuthContainer";
import { Footer } from "@/components/Footer";
import { useAuthStore } from "@/zustand/useAuthStore";
import { 
  FileVideoIcon, 
  ScanIcon, 
  CircleUserIcon,
  PlayCircleIcon,
  CloudIcon,
  ShieldCheckIcon,
  ZapIcon,
  CheckCircleIcon
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
                <h3 className="text-2xl font-bold text-gray-900">Start Recording</h3>
                <p className="text-gray-600">Capture your screen in one click</p>
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
                <h3 className="text-2xl font-bold text-gray-900">My Recordings</h3>
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
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Getting Started</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircleIcon size={24} className="text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1 text-gray-900">1. Start Recording</h4>
                  <p className="text-sm text-gray-600">Click "Start Recording" to capture your screen</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CloudIcon size={24} className="text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1 text-gray-900">2. Auto-Save</h4>
                  <p className="text-sm text-gray-600">Your recordings are automatically saved</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <PlayCircleIcon size={24} className="text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1 text-gray-900">3. View & Share</h4>
                  <p className="text-sm text-gray-600">Access your recordings anytime, anywhere</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Marketing Landing Page (Light Mode)
  return (
    <div className="relative flex flex-col h-full w-full overflow-y-auto bg-linear-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="flex-1 w-full">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="mb-12">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Screen Recording
              <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600">
                Made Simple
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Capture, save, and share your screen recordings effortlessly. 
              Perfect for tutorials, demos, and presentations.
            </p>
            <AuthContainer />
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
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Lightning Fast</h3>
              <p className="text-gray-600">
                Start recording in seconds. No complex setup or configuration needed.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="p-3 bg-green-100 rounded-xl w-fit mb-4">
                <CloudIcon size={32} className="text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Cloud Storage</h3>
              <p className="text-gray-600">
                All your recordings are automatically saved and accessible from anywhere.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="p-3 bg-purple-100 rounded-xl w-fit mb-4">
                <ShieldCheckIcon size={32} className="text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Secure & Private</h3>
              <p className="text-gray-600">
                Your data is encrypted and secure. Only you have access to your recordings.
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
              <p className="text-gray-600">Create your free account in seconds</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full text-2xl font-bold mb-4">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Record</h3>
              <p className="text-gray-600">Click record and capture your screen</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full text-2xl font-bold mb-4">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Share</h3>
              <p className="text-gray-600">Access and share your recordings anywhere</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="bg-linear-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white shadow-xl">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of users who trust Frame.me for their screen recordings
            </p>
            <div className="bg-white rounded-2xl p-6 inline-block">
              <AuthContainer />
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
