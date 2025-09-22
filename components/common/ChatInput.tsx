import React, { useState, useRef, useEffect } from 'react';
import { SendIcon } from '../icons/SendIcon';
import { UploadIcon } from '../icons/UploadIcon';
import { LoaderIcon } from '../icons/LoaderIcon';
import { XIcon } from '../icons/XIcon';

interface ChatInputProps {
    onSendMessage: (message: string, file?: File) => void;
    isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
    const [text, setText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const isSendDisabled = isLoading || (!text.trim() && !file);

    const handleSend = () => {
        if (isSendDisabled) return;
        onSendMessage(text, file || undefined);
        setText('');
        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [text]);

    return (
        <div className="p-4 bg-gray-800 border-t border-gray-700">
            <div className="relative bg-gray-700 rounded-lg">
                {file && (
                    <div className="px-4 py-2 flex items-center justify-between text-sm text-gray-300 bg-gray-600/50 rounded-t-lg">
                        <span>Attached: {file.name}</span>
                        <button onClick={() => setFile(null)} className="p-1 rounded-full hover:bg-gray-500">
                           <XIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message or attach a file..."
                    className="w-full bg-transparent pl-12 pr-20 py-3 text-gray-200 placeholder-gray-400 focus:outline-none resize-none"
                    rows={1}
                    style={{maxHeight: '200px'}}
                    disabled={isLoading}
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                    />
                    <label htmlFor="file-upload">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-gray-400 hover:text-white disabled:opacity-50"
                            disabled={isLoading}
                            aria-label="Attach file"
                        >
                            <UploadIcon className="w-5 h-5" />
                        </button>
                    </label>
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <button
                        onClick={handleSend}
                        disabled={isSendDisabled}
                        className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed"
                        aria-label="Send message"
                    >
                        {isLoading ? <LoaderIcon className="w-5 h-5 animate-spin"/> : <SendIcon className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </div>
    );
};