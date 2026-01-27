import { logger } from "./logger";
import { DOWNLOAD_LINK_CLEANUP_TIMEOUT_MS } from "@/constants/recording";

export const downloadBlob = (blob: Blob, filename: string): void => {
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
};

export const downloadFromUrl = async (url: string, filename: string): Promise<void> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    downloadBlob(blob, filename);
  } catch (error) {
    logger.error("Error downloading file", error);
    throw error;
  }
};




