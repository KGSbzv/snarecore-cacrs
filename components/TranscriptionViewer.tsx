

import React, { useState, useEffect, useRef } from 'react';
import type { TranscriptionSegment } from '../types';
import { Card } from './common/Card';
import { Toast } from './common/Toast';
import { CopyIcon } from './icons/CopyIcon';

interface TranscriptionViewerProps {
    transcription: TranscriptionSegment[];
    onSegmentClick: (time: number) => void;
    activeSegmentIndex: number;
}

export const TranscriptionViewer: React.FC<TranscriptionViewerProps> = ({ transcription, onSegmentClick, activeSegmentIndex }) => {
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        // Ensure the refs array is the same size as the transcription array.
        itemRefs.current = itemRefs.current.slice(0, transcription.length);
    }, [transcription]);

    useEffect(() => {
        const activeItem = itemRefs.current[activeSegmentIndex];
        if (activeItem) {
            activeItem.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [activeSegmentIndex]);

    const handleCopy = async (textToCopy: string) => {
        try {
            await navigator.clipboard.writeText(textToCopy);
            setToastMessage('Segment copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy text: ', err);
            setToastMessage('Failed to copy segment.');
        }
    };

    const handleCopyAll = async () => {
        const fullTranscript = transcription.map(segment => segment.text).join('\n');
        try {
            await navigator.clipboard.writeText(fullTranscript);
            setToastMessage('Full transcript copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy full transcript: ', err);
            setToastMessage('Failed to copy transcript.');
        }
    };
    
    const formatTime = (seconds: number) => {
        const date = new Date(0);
        date.setSeconds(seconds);
        return date.toISOString().substr(14, 5);
    };

    const copyAllButton = (
        <button
            onClick={handleCopyAll}
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors"
            aria-label="Copy full transcript to clipboard"
        >
            <CopyIcon className="w-4 h-4" />
            <span>Copy All</span>
        </button>
    );

    return (
        <>
            <Card title="Interactive Transcription">
                <div className="max-h-[22rem] overflow-y-auto space-y-2 pr-2">
                    {transcription.map((segment, index) => {
                        const hasTimestamp = segment.start > 0 || segment.end > 0 || segment.start !== segment.end;
                        return (
                            <div
                                key={index}
                                ref={el => { itemRefs.current[index] = el; }}
                                className={`group w-full flex items-start justify-between gap-4 p-3 rounded-lg transition-colors duration-200 ${
                                    activeSegmentIndex === index ? 'bg-blue-900/70' : 'hover:bg-gray-700/50'
                                }`}
                            >
                                <button
                                    type="button" 
                                    className="flex-1 text-left"
                                    onClick={() => onSegmentClick(segment.start)}
                                    aria-label={hasTimestamp ? `Play from ${formatTime(segment.start)}` : segment.text}
                                >
                                    {hasTimestamp && (
                                        <p className="text-xs font-mono text-blue-400 mb-1">
                                            {formatTime(segment.start)} - {formatTime(segment.end)}
                                        </p>
                                    )}
                                    <p className="text-sm text-gray-300 leading-relaxed">
                                        {segment.text}
                                    </p>
                                </button>
                                <button
                                    onClick={() => handleCopy(segment.text)}
                                    className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-600 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 flex-shrink-0 self-center"
                                    aria-label="Copy segment to clipboard"
                                >
                                    <CopyIcon className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>
                <div className="flex justify-end mt-2 border-t border-border pt-2">
                    {copyAllButton}
                </div>
            </Card>
            {toastMessage && (
                <Toast
                    message={toastMessage}
                    onClose={() => setToastMessage(null)}
                />
            )}
        </>
    );
};