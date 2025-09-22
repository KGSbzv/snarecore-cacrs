import type { User, AIConfiguration, TranscriptionConfig } from '../types';
import { apiClient } from './apiClient';

const TOKEN_KEY = 'authToken';

interface LoginResponse {
    token: string;
    user: User;
}

export const authService = {
    async login(email: string, password: string): Promise<User> {
        const { token, user } = await apiClient.post<LoginResponse>('/api/auth/login', { email, password });
        if (token && user) {
            localStorage.setItem(TOKEN_KEY, token);
            return user;
        }
        throw new Error('Login failed: Invalid response from server.');
    },

    logout(): void {
        localStorage.removeItem(TOKEN_KEY);
    },

    async getCurrentUser(): Promise<User | null> {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
            return null;
        }
        try {
            return await apiClient.get<User>('/api/auth/profile');
        } catch (error) {
            console.error('Session validation failed:', error);
            localStorage.removeItem(TOKEN_KEY); // Token is invalid, remove it
            return null;
        }
    },

    // Admin user functions
    getUsers(): Promise<User[]> {
        return apiClient.get<User[]>('/api/admin/users');
    },

    updateUser(updatedUser: User): Promise<User> {
        return apiClient.put<User>(`/api/admin/users/${updatedUser.id}`, updatedUser);
    },

    addUser(newUser: Omit<User, 'id'>): Promise<User> {
        return apiClient.post<User>('/api/admin/users', newUser);
    },

    deleteUser(userId: string): Promise<void> {
        return apiClient.delete<void>(`/api/admin/users/${userId}`);
    },
    
    // Admin config functions
    getAIConfig(): Promise<AIConfiguration> {
        return apiClient.get<AIConfiguration>('/api/admin/ai/config');
    },

    updateAIConfig(config: AIConfiguration): Promise<AIConfiguration> {
        return apiClient.put<AIConfiguration>('/api/admin/ai/config', config);
    },

    getTranscriptionConfig(): Promise<TranscriptionConfig> {
        return apiClient.get<TranscriptionConfig>('/api/admin/transcription/config');
    },

    updateTranscriptionConfig(config: TranscriptionConfig): Promise<TranscriptionConfig> {
        return apiClient.put<TranscriptionConfig>('/api/admin/transcription/config', config);
    }
};