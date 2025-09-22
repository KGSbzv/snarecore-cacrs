import { apiClient } from './apiClient';
import type { AiModel, AIModelConfig } from '../types';

/**
 * A layer of abstraction for sending chat messages to the backend proxy.
 * This function returns an async generator to stream the response.
 */
export async function* sendAIMessageStream(
    model: AiModel,
    message: string,
    file?: File,
    config?: AIModelConfig
): AsyncGenerator<string> {
    const body = { model, message, file, config };
    // The `yield*` keyword delegates the generation to the apiClient's stream method.
    yield* apiClient.stream('/api/chat', body);
}


/**
 * A layer of abstraction for analyzing videos via the backend proxy.
 * The backend is responsible for securely calling the appropriate AI model,
 * whether from an uploaded file or a URL.
 */
export async function analyzeVideoWithAI(
    model: AiModel,
    source: { type: 'file', value: File } | { type: 'url', value: string },
    prompt: string,
    config?: AIModelConfig,
    options?: {
        onProgress?: (progress: number) => void;
        signal?: AbortSignal;
    }
): Promise<string> {
    let body: Record<string, any>;
    let endpoint: string;

    if (source.type === 'file') {
        body = { model, videoFile: source.value, prompt, config };
        endpoint = '/api/video/analyze';
        
        if (options?.onProgress && options?.signal) {
            return apiClient.postWithProgress(endpoint, body, options.onProgress, options.signal);
        } else {
             return apiClient.postFormData(endpoint, body);
        }

    } else {
        body = { model, videoUrl: source.value, prompt, config };
        // New endpoint for submitting a URL processing job, as per spec
        endpoint = '/api/video/submit';
        return apiClient.postFormData(endpoint, body);
    }
}