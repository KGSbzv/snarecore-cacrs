import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { authService } from '../services/authService';
import type { User, AIConfiguration, TranscriptionConfig } from '../types';

// Default AI configuration
const defaultAiConfig: AIConfiguration = {
    gemini: {
        systemPrompt: "You are a helpful AI assistant.",
        temperature: 0.7,
        maxTokens: 1024,
    },
    openai: {
        systemPrompt: "You are a helpful AI assistant.",
        temperature: 0.7,
        maxTokens: 1024,
    },
    anthropic: {
        systemPrompt: "You are a helpful AI assistant.",
        temperature: 0.7,
        maxTokens: 1024,
    }
};

// Default Transcription configuration
const defaultTranscriptionConfig: TranscriptionConfig = {
    modelSize: 'medium',
    language: 'auto',
    computeType: 'int8',
    vadFilter: true,
    wordTimestamps: true,
    minConfidence: 0.8,
};

interface AppContextType {
    currentUser: User | null;
    isLoadingUser: boolean;
    users: User[];
    aiConfig: AIConfiguration;
    transcriptionConfig: TranscriptionConfig;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    saveAIConfig: (config: AIConfiguration) => Promise<void>;
    saveTranscriptionConfig: (config: TranscriptionConfig) => Promise<void>;
    updateCurrentUserProfile: (data: { name: string; avatar?: File }) => Promise<void>;
    updateUser: (user: User) => Promise<void>;
    addUser: (user: Omit<User, 'id'>) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [aiConfig, setAiConfig] = useState<AIConfiguration>(defaultAiConfig);
    const [transcriptionConfig, setTranscriptionConfig] = useState<TranscriptionConfig>(defaultTranscriptionConfig);

    useEffect(() => {
        const validateSession = async () => {
            setIsLoadingUser(true);
            const user = await authService.getCurrentUser();
            setCurrentUser(user);
            setIsLoadingUser(false);
        };
        validateSession();
    }, []);

    const fetchAdminData = useCallback(async () => {
        try {
            const [userList, fetchedAiConfig, fetchedTranscriptionConfig] = await Promise.all([
                authService.getUsers(),
                authService.getAIConfig(),
                authService.getTranscriptionConfig()
            ]);
            setUsers(userList);
            setAiConfig(fetchedAiConfig);
            setTranscriptionConfig(fetchedTranscriptionConfig);
        } catch (error) {
            console.error("Failed to fetch admin data:", error);
            // Fallback to defaults if fetch fails
        }
    }, []);

    useEffect(() => {
        if (currentUser?.role === 'ADMIN') {
            fetchAdminData();
        } else {
            setUsers([]);
        }
    }, [currentUser, fetchAdminData]);
    
    const login = useCallback(async (email: string, password: string) => {
        const user = await authService.login(email, password);
        setCurrentUser(user);
    }, []);

    const logout = useCallback(() => {
        authService.logout();
        setCurrentUser(null);
    }, []);
    
    const saveAIConfig = useCallback(async (config: AIConfiguration) => {
        const updatedConfig = await authService.updateAIConfig(config);
        setAiConfig(updatedConfig);
    }, []);

    const saveTranscriptionConfig = useCallback(async (config: TranscriptionConfig) => {
        const updatedConfig = await authService.updateTranscriptionConfig(config);
        setTranscriptionConfig(updatedConfig);
    }, []);

    const updateCurrentUserProfile = useCallback(async (data: { name: string; avatar?: File }) => {
        const updatedUser = await authService.updateProfile(data);
        setCurrentUser(updatedUser);
        // also update the user in the admin list if applicable
        setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
    }, []);

    const updateUser = useCallback(async (user: User) => {
        await authService.updateUser(user);
        if (user.id === currentUser?.id) {
            setCurrentUser(user); // update current user if they edit themselves
        }
        await fetchAdminData(); // Refresh all admin data
    }, [fetchAdminData, currentUser?.id]);

    const addUser = useCallback(async (user: Omit<User, 'id'>) => {
        await authService.addUser(user);
        await fetchAdminData();
    }, [fetchAdminData]);

    const deleteUser = useCallback(async (userId: string) => {
        await authService.deleteUser(userId);
        await fetchAdminData();
    }, [fetchAdminData]);

    const value = useMemo(() => ({
        currentUser,
        isLoadingUser,
        users,
        aiConfig,
        transcriptionConfig,
        login,
        logout,
        saveAIConfig,
        saveTranscriptionConfig,
        updateCurrentUserProfile,
        updateUser,
        addUser,
        deleteUser
    }), [currentUser, isLoadingUser, users, aiConfig, transcriptionConfig, login, logout, saveAIConfig, saveTranscriptionConfig, updateCurrentUserProfile, updateUser, addUser, deleteUser]);

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};