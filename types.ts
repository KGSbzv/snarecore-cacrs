export type View = 'chat' | 'video' | 'admin' | 'profile';

export type AiModel = 'gemini' | 'openai' | 'anthropic';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  avatarUrl?: string;
}

export interface MessageFile {
  name: string;
  type: string;
}

export interface Message {
  id:string;
  text: string;
  sender: 'user' | 'model';
  file?: MessageFile;
}

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
}

export interface SentimentResult {
  overall: 'Positive' | 'Negative' | 'Neutral';
  score: number;
}

export interface VideoAnalysisResult {
  summary: string;
  keywords: string[];
  transcription: TranscriptionSegment[];
  sentiment: SentimentResult;
  note?: string; // Optional field for extra info
}

export interface VideoAnalysisHistoryItem {
  id: string;
  sourceType: 'upload' | 'url';
  sourceName: string; // file name or URL
  timestamp: number;
  result: VideoAnalysisResult;
  metadata?: VideoMetadata | null;
  manualTranscript?: string;
}

export interface VideoMetadata {
  name: string;
  size: number; // in bytes
  type: string;
  duration: number; // in seconds
  width: number;
  height: number;
}

/**
 * Configuration for a specific AI model.
 */
export interface AIModelConfig {
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
}

/**
 * A record of configurations for all available AI models.
 */
export type AIConfiguration = Record<AiModel, AIModelConfig>;

/**
 * Configuration for the Whisper transcription pipeline.
 */
export interface TranscriptionConfig {
  modelSize: 'tiny' | 'base' | 'small' | 'medium' | 'large';
  language: string; // 'auto' or language code
  computeType: 'int8' | 'float16' | 'float32';
  vadFilter: boolean;
  wordTimestamps: boolean;
  minConfidence: number;
}


/**
 * Custom error class for more specific feedback from AI services.
 */
export class AIError extends Error {
  constructor(message: string, public type: 'api_key' | 'network' | 'generic' = 'generic') {
    super(message);
    this.name = 'AIError';
  }
}