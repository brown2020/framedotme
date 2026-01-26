// types/recorder.ts
export type RecorderStatusType =
  | "idle"
  | "ready"
  | "shouldStart"
  | "shouldStop"
  | "starting"
  | "recording"
  | "saving"
  | "error"
  | "unknown";

export interface UploadProgress {
  progress: number;
  status: "starting" | "uploading" | "completed" | "error";
  error?: Error;
}
