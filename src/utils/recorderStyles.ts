import type { RecorderStatusType } from "@/types/recorder";

/**
 * Gets button styling class based on recorder status
 * Centralized to ensure consistent styling across VideoControlsLauncher and VideoControlsPage
 * 
 * @param status - The current recorder status
 * @param variant - The button variant (launcher or controls)
 * @returns Tailwind CSS classes for button styling
 */
export function getRecorderButtonClass(
  status: RecorderStatusType,
  variant: "launcher" | "controls" = "controls"
): string {
  if (variant === "launcher") {
    switch (status) {
      case "recording":
        return "bg-red-500 hover:bg-red-600";
      case "ready":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "error":
        return "bg-destructive hover:bg-destructive/90";
      default:
        return "bg-transparent hover:bg-white/30";
    }
  }

  // Controls variant
  switch (status) {
    case "recording":
      return "bg-red-500 hover:bg-red-600";
    case "ready":
      return "bg-green-500 hover:bg-green-600";
    case "saving":
      return "bg-yellow-500 hover:bg-yellow-600";
    default:
      return "";
  }
}

/**
 * Gets button text based on recorder status
 * 
 * @param status - The current recorder status
 * @returns The button text to display
 */
export function getRecorderButtonText(status: RecorderStatusType): string {
  switch (status) {
    case "idle":
      return "Initialize Recording";
    case "ready":
      return "Start Recording";
    case "recording":
      return "Stop Recording";
    case "saving":
      return "Saving...";
    default:
      return "Initialize Recording";
  }
}
