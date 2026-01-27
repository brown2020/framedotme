/**
 * Recording and media constants
 */

// Recording configuration
export const RECORDING_CHUNK_INTERVAL_MS = 60 * 1000; // 1 minute
export const MAX_RECORDING_FILE_SIZE = 500 * 1024 * 1024; // 500 MB
export const RECORDING_FRAME_RATE = 30;
export const RECORDING_MIME_TYPE = "video/webm;codecs=vp8,opus";

// Video dimensions
export const VIDEO_DIMENSION_UPDATE_INTERVAL_MS = 500;
export const DEFAULT_VIDEO_WIDTH = 512;
export const DEFAULT_VIDEO_HEIGHT = 512;

// Video Controls Window
export const VIDEO_CONTROLS_WINDOW_WIDTH = 400;
export const VIDEO_CONTROLS_WINDOW_HEIGHT = 660;
export const VIDEO_CONTROLS_WINDOW_CHECK_INTERVAL_MS = 500;

// Download
export const DOWNLOAD_LINK_CLEANUP_TIMEOUT_MS = 100;
