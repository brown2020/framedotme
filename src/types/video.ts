import { Timestamp } from "firebase/firestore";

export interface VideoMetadata {
  id: string;
  downloadUrl: string;
  createdAt: Timestamp;
  filename: string;
  showOnProfile?: boolean;
  botId?: string;
  botName?: string;
  modelId?: string;
  modelName?: string;
  language?: string;
  languageCode?: string;
}



