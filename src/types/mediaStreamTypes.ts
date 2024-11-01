// types/mediaStreamTypes.ts
export type MediaStreamErrorType =
  | "permission"
  | "device"
  | "stream"
  | "unknown";

export class MediaStreamError extends Error {
  constructor(
    message: string,
    public readonly type: MediaStreamErrorType,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = "MediaStreamError";
  }
}

export interface MediaStreamControls {
  isActive: boolean;
  currentScreenStream: MediaStream | null;
}
