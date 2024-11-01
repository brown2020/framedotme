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

export interface RecorderSettings {
  recorderStatus: RecorderStatusType;
  lastUpdated?: Date;
}

export interface UploadProgress {
  progress: number;
  status: "starting" | "uploading" | "completed" | "error";
  error?: Error;
}

export interface RecordingMetadata {
  id: string;
  downloadUrl: string;
  createdAt: Date;
  filename: string;
  duration?: number;
  fileSize?: number;
}
