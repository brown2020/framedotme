import { RECORDING_CHUNK_INTERVAL_MS, RECORDING_MIME_TYPE } from "@/constants/recording";
import { logger } from "@/utils/logger";

type RecordingSink = {
  append(chunk: Blob): Promise<void>;
  finish(): Promise<Blob>;
  discard(): Promise<void>;
};

function memorySink(): RecordingSink {
  const chunks: Blob[] = [];
  return {
    async append(chunk) {
      chunks.push(chunk);
    },
    async finish() {
      const blob = new Blob(chunks, { type: "video/webm" });
      chunks.length = 0;
      return blob;
    },
    async discard() {
      chunks.length = 0;
    },
  };
}

/**
 * Prefer Origin Private File System so chunk bytes stay on disk instead of the JS heap.
 * Falls back to memory when OPFS is unavailable.
 */
async function createRecordingSink(): Promise<RecordingSink> {
  const storage = globalThis.navigator?.storage;
  if (!storage?.getDirectory) return memorySink();

  try {
    const root = await storage.getDirectory();
    const name = `frame-recording-${crypto.randomUUID()}.webm`;
    const handle = await root.getFileHandle(name, { create: true });
    const writable = await handle.createWritable();
    return {
      async append(chunk) {
        await writable.write(chunk);
      },
      async finish() {
        await writable.close();
        const file = await handle.getFile();
        const bytes = await file.arrayBuffer();
        await root.removeEntry(name).catch(() => undefined);
        return new Blob([bytes], { type: "video/webm" });
      },
      async discard() {
        await writable.close().catch(() => undefined);
        await root.removeEntry(name).catch(() => undefined);
      },
    };
  } catch (error) {
    logger.warn("OPFS recording sink unavailable; using memory", error);
    return memorySink();
  }
}

/**
 * Manages media recording. Chunks are flushed every second and written to disk
 * when the browser supports the Origin Private File System.
 */
export class RecordingManager {
  private mediaRecorder: MediaRecorder | null = null;
  private sink: RecordingSink | null = null;
  private writeChain: Promise<void> = Promise.resolve();
  private onDataAvailableCallback: ((data: Blob) => void) | null = null;

  async startRecording(stream: MediaStream, onDataAvailable: (data: Blob) => void) {
    try {
      await this.sink?.discard();
      this.sink = await createRecordingSink();
      this.onDataAvailableCallback = onDataAvailable;

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: RECORDING_MIME_TYPE,
      });

      this.writeChain = Promise.resolve();
      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          const sink = this.sink;
          this.writeChain = this.writeChain.then(() => sink?.append(event.data));
          this.onDataAvailableCallback?.(event.data);
        }
      };

      this.mediaRecorder.start(RECORDING_CHUNK_INTERVAL_MS);
      return this.mediaRecorder;
    } catch (error) {
      logger.error("Failed to start recording", error);
      throw error;
    }
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error("Failed to stop recording: no recording in progress"));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const sink = this.sink;
        const writes = this.writeChain;
        this.sink = null;
        this.mediaRecorder = null;
        this.writeChain = Promise.resolve();
        if (!sink) {
          reject(new Error("Failed to stop recording: missing recording data"));
          return;
        }
        writes
          .then(() => sink.finish())
          .then(resolve)
          .catch(reject);
      };

      if (this.mediaRecorder.state === "inactive") {
        this.mediaRecorder.onstop?.(new Event("stop"));
        return;
      }
      this.mediaRecorder.stop();
    });
  }

  cleanup(): Promise<void> {
    return new Promise((resolve) => {
      const finish = () => {
        const sink = this.sink;
        this.mediaRecorder = null;
        this.sink = null;
        this.onDataAvailableCallback = null;
        void sink?.discard().finally(() => resolve());
      };

      if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
        this.mediaRecorder.onstop = () => finish();
        this.mediaRecorder.stop();
      } else {
        finish();
      }
    });
  }

  get isRecording(): boolean {
    return this.mediaRecorder?.state === "recording" || false;
  }
}
