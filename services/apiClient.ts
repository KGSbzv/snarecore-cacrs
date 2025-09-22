import { AIError } from "../types";

const API_BASE_URL = process.env.VITE_API_BASE_URL || '';
const TOKEN_KEY = 'authToken';

/**
 * A generic, centralized request handler for all API calls.
 * - Automatically adds the JWT authorization header.
 * - Handles JSON and FormData content types.
 * - Provides consistent error handling using the custom AIError class.
 * @param endpoint The API endpoint to call.
 * @param options Standard fetch options.
 * @returns A promise that resolves to the parsed JSON response.
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    const token = localStorage.getItem(TOKEN_KEY);

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    if (!(options.body instanceof FormData) && options.body) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: response.statusText }));
        const errorMessage = errorBody.message || 'An unknown network error occurred.';
        switch (response.status) {
            case 401:
            case 403:
                throw new AIError(errorMessage, 'api_key');
            default:
                throw new AIError(errorMessage, 'network');
        }
    }

    if (response.status === 204) { // No Content
        return null as T;
    }

    return response.json() as Promise<T>;
}

const buildFormData = (body: Record<string, any>): FormData => {
    const formData = new FormData();
    Object.keys(body).forEach(key => {
        const value = body[key];
        if (value !== undefined && value !== null) {
            if (typeof value === 'object' && !(value instanceof File)) {
                formData.append(key, JSON.stringify(value));
            } else {
                formData.append(key, value);
            }
        }
    });
    return formData;
};

/**
 * A streaming API client for chat responses, refactored for efficiency.
 * It now uses `pipeThrough` with `TextDecoderStream` for optimal decoding.
 */
async function* stream(endpoint: string, body: Record<string, any>): AsyncGenerator<string> {
    const headers = new Headers();
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        body: buildFormData(body),
        headers,
    });

    if (!response.ok || !response.body) {
        const errorBody = await response.json().catch(() => ({ message: response.statusText }));
        throw new AIError(errorBody.message || 'Streaming failed.', 'network');
    }
    
    // Use the modern and efficient Streams API for decoding
    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            yield value;
        }
    } finally {
        reader.releaseLock();
    }
}

/**
 * Posts FormData with progress tracking and cancellation support using XMLHttpRequest.
 */
function postWithProgress(
    endpoint: string,
    body: Record<string, any>,
    onProgress: (progress: number) => void,
    signal: AbortSignal
): Promise<string> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const url = `${API_BASE_URL}${endpoint}`;

        xhr.open('POST', url, true);

        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr.responseText);
            } else {
                let errorBody;
                try {
                    errorBody = JSON.parse(xhr.responseText);
                } catch (e) {
                    errorBody = { message: xhr.statusText };
                }
                const errorMessage = errorBody.message || 'An unknown network error occurred.';
                reject(new AIError(errorMessage, 'network'));
            }
        };

        xhr.onerror = () => {
            reject(new AIError('Network request failed.', 'network'));
        };

        xhr.onabort = () => {
            reject(new DOMException('Request aborted by user', 'AbortError'));
        };

        signal.addEventListener('abort', () => {
            xhr.abort();
        });

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = (event.loaded / event.total) * 100;
                onProgress(percentComplete);
            }
        };

        const formData = buildFormData(body);
        xhr.send(formData);
    });
}

export const apiClient = {
    get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
    post: <T>(endpoint: string, data: any) => request<T>(endpoint, { method: 'POST', body: JSON.stringify(data) }),
    put: <T>(endpoint: string, data: any) => request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
    delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
    
    postFormData: async (endpoint: string, body: Record<string, any>): Promise<string> => {
        const headers = new Headers();
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            body: buildFormData(body),
            headers,
        });
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ message: response.statusText }));
            throw new AIError(errorBody.message || 'Request failed', 'network');
        }
        return response.text();
    },
    postWithProgress,
    stream
};