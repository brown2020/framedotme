"use client";

import type { ReactElement } from "react";
import { useRouter } from "next/navigation";
import {
  FileVideoIcon,
  ScanIcon,
  CircleUserIcon,
  PlayCircleIcon,
  CloudIcon,
  CheckCircleIcon,
} from "lucide-react";

interface AuthenticatedDashboardProps {
  displayName?: string | null;
}

/**
 * Dashboard view shown to authenticated users
 * Displays quick actions and getting started guide
 */
export function AuthenticatedDashboard({
  displayName,
}: AuthenticatedDashboardProps): ReactElement {
  const router = useRouter();

  return (
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
              <h4 className="font-semibold mb-1 text-gray-900">2. Auto-Save</h4>
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
              <h4 className="font-semibold mb-1 text-gray-900">3. View & Share</h4>
              <p className="text-sm text-gray-600">
                Access your recordings anytime, anywhere
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
