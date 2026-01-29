"use client";

import { VideoControlsLauncher } from "@/components/VideoControlsLauncher";
import { useRecorderStatus } from "@/hooks/useRecorderStatus";
import {
  MonitorIcon,
  CircleDotIcon,
  CheckCircleIcon,
  InfoIcon,
  Layers,
  MousePointerClick,
  Zap,
} from "lucide-react";

/**
 * Capture page component that provides a modern interface for screen recording
 * Shows recording status, instructions, and tips
 *
 * @returns The capture page with enhanced UX
 */
export function CapturePage() {
  const { recorderStatus } = useRecorderStatus();

  const getStatusInfo = () => {
    switch (recorderStatus) {
      case "recording":
        return {
          title: "Recording in Progress",
          subtitle: "Your screen is being captured",
          color: "red",
          icon: CircleDotIcon,
        };
      case "ready":
        return {
          title: "Ready to Record",
          subtitle: "Click the button below to start",
          color: "green",
          icon: CheckCircleIcon,
        };
      case "saving":
        return {
          title: "Saving Recording",
          subtitle: "Please wait while we save your video",
          color: "blue",
          icon: Layers,
        };
      default:
        return {
          title: "Screen Recorder",
          subtitle: "Capture your screen with one click",
          color: "gray",
          icon: MonitorIcon,
        };
    }
  };

  const status = getStatusInfo();
  const StatusIcon = status.icon;

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto bg-linear-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="flex-1 w-full max-w-6xl mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-blue-100 rounded-full mb-6">
            <StatusIcon
              size={48}
              className={`${
                status.color === "red"
                  ? "text-red-600 animate-pulse"
                  : status.color === "green"
                    ? "text-green-600"
                    : status.color === "blue"
                      ? "text-blue-600"
                      : "text-gray-600"
              }`}
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {status.title}
          </h1>
          <p className="text-xl text-gray-600">{status.subtitle}</p>
        </div>

        {/* Recording Controls */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-gray-200 hover:border-blue-300 transition-all">
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-gray-600 font-medium">
                {recorderStatus === "recording"
                  ? "Click to stop recording"
                  : recorderStatus === "ready"
                    ? "Click to start recording"
                    : "Click to open recording controls"}
              </p>
              <div className="transform hover:scale-110 transition-transform">
                <VideoControlsLauncher />
              </div>
            </div>
          </div>
        </div>

        {/* How to Record Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MousePointerClick className="text-blue-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                1. Click Record
              </h3>
            </div>
            <p className="text-gray-600">
              Click the record button to open the recording controls in a new
              window
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <MonitorIcon className="text-green-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                2. Choose Screen
              </h3>
            </div>
            <p className="text-gray-600">
              Select which screen, window, or tab you want to record from the
              browser prompt
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="text-purple-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">3. Auto-Save</h3>
            </div>
            <p className="text-gray-600">
              Your recording is automatically saved to the cloud when you stop
            </p>
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <div className="flex items-start gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <InfoIcon className="text-blue-600" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Pro Tips
              </h2>
              <p className="text-gray-600">
                Get the most out of your screen recordings
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💡</div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  Clear Your Desktop
                </h4>
                <p className="text-sm text-gray-600">
                  Close unnecessary windows and notifications for a cleaner
                  recording
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="text-2xl">🎯</div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Test First</h4>
                <p className="text-sm text-gray-600">
                  Do a quick test recording to make sure everything works as
                  expected
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="text-2xl">🔊</div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  Check Audio
                </h4>
                <p className="text-sm text-gray-600">
                  Select "Share system audio" in the browser prompt to include
                  sound
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="text-2xl">⏱️</div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  Plan Your Recording
                </h4>
                <p className="text-sm text-gray-600">
                  Outline what you want to show before you start recording
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Browser Compatibility Note */}
        <div className="mt-8 text-center">
          <div className="inline-block bg-yellow-50 border border-yellow-200 rounded-xl px-6 py-4">
            <p className="text-sm text-gray-700">
              <strong>Note:</strong> Screen recording works best in Chrome,
              Edge, and other Chromium-based browsers. Safari and Firefox have
              limited support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
