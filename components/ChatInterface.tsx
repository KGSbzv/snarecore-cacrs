import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { ChatInput } from './common/ChatInput';
import { ChatBubble } from './common/ChatBubble';
import { sendAIMessageStream } from '../services/aiService';
import { exportChatToTxt, exportChatToCsv } from '../utils/exportUtils';
import type { Message, MessageFile } from '../types';
import { FileDownIcon } from './icons/FileDownIcon';
import { AIError } from '../types';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

export const ChatInterface: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const { aiConfig } = useAppContext();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setIsExportMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSendMessage = async (text: string, file?: File) => {
        if (!text.trim() && !file) return;

        setError(null);
        setIsLoading(true);
        
        const userMessageId = Date.now().toString();
        const messageFile: MessageFile | undefined = file ? { name: file.name, type: file.type } : undefined;

        const userMessage: Message = { id: userMessageId, text, sender: 'user', file: messageFile };
        
        const modelMessageId = (Date.now() + 1).toString();
        const modelMessage: Message = { id: modelMessageId, text: '', sender: 'model' };
        
        setMessages(prev => [...prev, userMessage, modelMessage]);

        try {
            const stream = sendAIMessageStream('gemini', text, file, aiConfig.gemini);
            let responseText = '';
            for await (const chunk of stream) {
                responseText += chunk;
                // More efficient state update: avoids mapping the entire array on every chunk.
                setMessages(prev => {
                    const messageIndex = prev.findIndex(msg => msg.id === modelMessageId);
                    if (messageIndex === -1) return prev;
                    
                    const newMessages = [...prev];
                    newMessages[messageIndex] = { ...prev[messageIndex], text: responseText };
                    return newMessages;
                });
            }
        } catch (err) {
            const errorMessage = err instanceof AIError ? err.message : 'An unexpected error occurred.';
            setError(errorMessage);
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === modelMessageId ? { ...msg, text: `Error: ${errorMessage}` } : msg
                )
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-transparent">
             <div className="flex-shrink-0 p-4 border-b border-border flex justify-between items-center">
                <h2 className="text-lg font-semibold">Conversation</h2>
                <div className="relative" ref={exportMenuRef}>
                    <button
                        onClick={() => setIsExportMenuOpen(prev => !prev)}
                        disabled={messages.length === 0}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-border rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <FileDownIcon className="w-4 h-4" />
                        Export Chat
                        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isExportMenuOpen && (
                        <div className="absolute right-0 mt-2 w-40 bg-card rounded-md shadow-lg border border-border py-1 z-20">
                            <button
                                onClick={() => {
                                    exportChatToTxt(messages);
                                    setIsExportMenuOpen(false);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-background hover:text-white"
                            >
                                Export as TXT
                            </button>
                            <button
                                onClick={() => {
                                    exportChatToCsv(messages);
                                    setIsExportMenuOpen(false);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-background hover:text-white"
                            >
                                Export as CSV
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.length === 0 && !isLoading && (
                    <div className="text-center text-gray-500 pt-10">
                        <p>Start a conversation by sending a message.</p>
                    </div>
                )}
                {messages.map((msg, index) => (
                    <ChatBubble
                        key={msg.id}
                        message={msg}
                        isLoading={isLoading && index === messages.length - 1 && msg.sender === 'model'}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>
            {error && (
                <div className="p-4 text-center text-red-400 bg-red-900/30 border-t border-gray-700">
                    {error}
                </div>
            )}
            <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
    );
};