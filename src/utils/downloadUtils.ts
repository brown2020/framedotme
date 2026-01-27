import { logger } from "./logger";
import { DOWNLOAD_LINK_CLEANUP_TIMEOUT_MS } from "@/constants/recording";

/**
 * Downloads a blob as a file to the user's device
 * Creates a temporary anchor element to trigger download
 * 
 * @param blob - The blob data to download
 * @param filename - The filename to save as
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, DOWNLOAD_LINK_CLEANUP_TIMEOUT_MS);
}

/**
 * Downloads a file from a URL to the user's device
 * Fetches the URL content and triggers download
 * 
 * @param url - The URL to download from
 * @param filename - The filename to save as
 * @throws {Error} If fetch fails
 */
export async function downloadFromUrl(url: string, filename: string): Promise<void> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    downloadBlob(blob, filename);
  } catch (error) {
    logger.error("Error downloading file", error);
    throw error;
  }
}




