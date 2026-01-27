import { createRef } from "react";

/**
 * Video ref for global video element
 * Used to access the video element across components
 */
export const globalVideoRef = createRef<HTMLVideoElement>();
