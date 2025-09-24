import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { analyzeVideoWithAI } from '../services/aiService';
import type { VideoAnalysisResult, VideoAnalysisHistoryItem, VideoMetadata, TranscriptionSegment } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { LoaderIcon } from './icons/LoaderIcon';
import { TranscriptionViewer } from './TranscriptionViewer';
import { SentimentAnalysis } from './SentimentAnalysis';
import { Card } from './common/Card';
import { exportAnalysisToCsv, exportAnalysisToPdf, formatBytes, formatDuration } from '../utils/exportUtils';
import { HistoryIcon } from './icons/HistoryIcon';
import { TrashIcon } from './icons/TrashIcon';
import { FileDownIcon } from './icons/FileDownIcon';
import useLocalStorageState from '../hooks/useLocalStorageState';
import { AIError } from '../types';
import { YouTubeIcon } from './icons/YouTubeIcon';
import { LinkIcon } from './icons/LinkIcon';
import { DatabaseIcon } from './icons/DatabaseIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { validateVideoUrl } from '../utils/validation';
import { PencilLineIcon } from './icons/PencilLineIcon';

export const VideoAnalyzer: React.FC = () => {
    const [inputType, setInputType] = useState<'upload' | 'url'>('upload');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState('');
    const [urlError, setUrlError] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('Summarize the video, identify key topics, and provide a full transcription with timestamps.');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<VideoAnalysisResult | null>(null);
    const [activeSegmentIndex, setActiveSegmentIndex] = useState(-1);
    const [history, setHistory] = useLocalStorageState<VideoAnalysisHistoryItem[]>('videoAnalysisHistory', []);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const [showManualTranscriptInput, setShowManualTranscriptInput] = useState(false);
    const [manualTranscript, setManualTranscript] = useState('');
    
    const { aiConfig } = useAppContext();
    const videoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setVideoFile(file);
            setVideoUrl(''); // Clear URL if a file is selected
            setUrlError(null);
            setAnalysisResult(null);
            setError(null);
            setVideoMetadata(null); // Reset metadata on new file selection

            const video = document.createElement('video');
            video.preload = 'metadata';

            video.onloadedmetadata = () => {
                window.URL.revokeObjectURL(video.src);
                setVideoMetadata({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    duration: video.duration,
                    width: video.videoWidth,
                    height: video.videoHeight,
                });
            };
            
            video.onerror = () => {
                window.URL.revokeObjectURL(video.src);
                setError("Could not read video metadata. The file may be corrupt or in an unsupported format.");
            };

            video.src = URL.createObjectURL(file);
        }
    };
    
    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newUrl = e.target.value;
        setVideoUrl(newUrl);
        setVideoFile(null); // Clear file when URL is changed
        
        // Perform validation
        setUrlError(validateVideoUrl(newUrl));
    };

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const updateActiveSegment = () => {
            if (!analysisResult) return;
            const currentTime = video.currentTime;
            const newIndex = analysisResult.transcription.findIndex(
                seg => currentTime >= seg.start && currentTime < seg.end
            );
            if (newIndex !== -1) {
                setActiveSegmentIndex(newIndex);
            }
        };

        video.addEventListener('timeupdate', updateActiveSegment);
        return () => video.removeEventListener('timeupdate', updateActiveSegment);
    }, [analysisResult]);

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


    const handleAnalysis = async () => {
        // Reset state for a new analysis
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);
        setUploadProgress(0);

        abortControllerRef.current = new AbortController();

        try {
            let source: { type: 'file', value: File } | { type: 'url', value: string };
            let sourceName: string;
            let sourceType: 'upload' | 'url';

            // Validate input based on the selected tab
            if (inputType === 'upload') {
                if (!videoFile) {
                    setError('Please select a video file to upload.');
                    setIsLoading(false);
                    return;
                }
                source = { type: 'file', value: videoFile };
                sourceName = videoFile.name;
                sourceType = 'upload';
            } else { // inputType === 'url'
                if (!videoUrl.trim() || urlError) {
                    setError('Please enter a valid video URL.');
                    setIsLoading(false);
                    return;
                }
                source = { type: 'url', value: videoUrl };
                sourceName = videoUrl;
                sourceType = 'url';
            }
            
            const isManualTranscriptProvided = showManualTranscriptInput && manualTranscript.trim();
            let finalPrompt = prompt;

            if (isManualTranscriptProvided) {
                const instruction = `The user has provided a manual transcription for this video. Use this transcription as the ground truth for your analysis. DO NOT generate a new transcription from the audio. Based on the provided text, perform the analysis requested by the user.`;
                finalPrompt = `${instruction}\n\nUser Request: "${prompt}"\n\nProvided Transcription:\n${manualTranscript}`;
            }

            // Common logic for making the API call and processing the result
            const resultString = await analyzeVideoWithAI(
                'gemini', 
                source, 
                finalPrompt, 
                aiConfig.gemini,
                inputType === 'upload' ? {
                    onProgress: setUploadProgress,
                    signal: abortControllerRef.current.signal,
                } : undefined
            );

            const result: VideoAnalysisResult = JSON.parse(resultString);
            
            if (isManualTranscriptProvided) {
                result.transcription = manualTranscript
                    .split('\n')
                    .filter(line => line.trim() !== '')
                    .map(line => ({ text: line, start: 0, end: 0 }));
            }

            setAnalysisResult(result);

            const newHistoryItem: VideoAnalysisHistoryItem = {
                id: new Date().toISOString(),
                sourceType: sourceType,
                sourceName: sourceName,
                timestamp: Date.now(),
                result,
                metadata: sourceType === 'upload' ? videoMetadata : null,
                manualTranscript: isManualTranscriptProvided ? manualTranscript : undefined,
            };
            setHistory(prev => [newHistoryItem, ...prev]);

        } catch (err) {
             if (err instanceof DOMException && err.name === 'AbortError') {
                setError('Video analysis has been cancelled.');
            } else {
                setError(err instanceof Error ? err.message : 'Failed to analyze video.');
            }
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    };
    
    const handleCancelAnalysis = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    };

    const handleSegmentClick = (time: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            videoRef.current.play();
        }
    };

    const loadFromHistory = (item: VideoAnalysisHistoryItem) => {
        setAnalysisResult(item.result);
        setVideoFile(null); // No way to restore file object
        const url = item.sourceType === 'url' ? item.sourceName : '';
        setVideoUrl(url);
        setUrlError(validateVideoUrl(url)); // Re-validate historical URL
        setInputType(item.sourceType);
        setVideoMetadata(item.metadata || null);
        
        if (item.manualTranscript) {
            setShowManualTranscriptInput(true);
            setManualTranscript(item.manualTranscript);
        } else {
            setShowManualTranscriptInput(false);
            setManualTranscript('');
        }
    }
    
    const clearHistory = () => {
        setHistory([]);
    }

    const renderLoadingState = () => {
        if (inputType === 'upload') {
            return (
                 <div className="mt-6 flex flex-col items-center justify-center text-center p-8 bg-card rounded-lg border border-border flex-1">
                    {uploadProgress < 100 ? (
                        <>
                            <h3 className="text-xl font-semibold mb-4">Uploading Video...</h3>
                             <div className="w-full max-w-md bg-background rounded-full h-2.5 mb-2 border border-border">
                                <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                            </div>
                            <p className="text-text-secondary mb-6 font-mono">{Math.round(uploadProgress)}%</p>
                            <button
                                onClick={handleCancelAnalysis}
                                className="px-6 py-2 bg-error text-white rounded-lg hover:bg-red-600 font-semibold flex items-center gap-2"
                            >
                                Cancel Upload
                            </button>
                        </>
                    ) : (
                        <>
                            <LoaderIcon className="w-12 h-12 animate-spin text-primary mb-4" />
                            <h3 className="text-xl font-semibold">Analysis in Progress</h3>
                            <p className="text-text-secondary mt-2 max-w-md">
                                Upload complete. Your file is now being processed by the AI.
                                <br />
                                This may take a few moments. Please don't close this tab.
                            </p>
                        </>
                    )}
                </div>
            );
        }
        
        // Loading state for URL
        return (
            <div className="mt-6 flex flex-col items-center justify-center text-center p-8 bg-card rounded-lg border border-border flex-1">
                <LoaderIcon className="w-12 h-12 animate-spin text-primary mb-4" />
                <h3 className="text-xl font-semibold">Analysis in Progress</h3>
                <p className="text-text-secondary mt-2 max-w-md">
                    We're fetching the video from the provided URL.
                    <br />
                    This may take a few moments. Please don't close this tab.
                </p>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col bg-transparent">
            <div className="flex-1 flex overflow-hidden">
                {/* Main content */}
                <div className="flex-1 flex flex-col p-6 overflow-y-auto">
                    {/* Upload and controls */}
                    <Card title="Input Source & Configuration">
                        <div className="flex border-b border-border mb-4">
                            <button onClick={() => setInputType('upload')} className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${inputType === 'upload' ? 'border-b-2 border-primary text-primary' : 'text-text-secondary hover:text-white'}`}>
                                <UploadIcon className="w-5 h-5" /> Upload File
                            </button>
                            <button onClick={() => setInputType('url')} className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${inputType === 'url' ? 'border-b-2 border-primary text-primary' : 'text-text-secondary hover:text-white'}`}>
                                <YouTubeIcon className="w-5 h-5 text-red-500" /> Video URL
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {inputType === 'upload' ? (
                                <div>
                                    <label htmlFor="video-upload-area" className="block text-sm font-medium text-text-secondary mb-2">Video File</label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex flex-col items-center justify-center w-full h-32 px-4 transition bg-background/50 border-2 border-border border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-500 focus:outline-none"
                                    >
                                        <UploadIcon className="w-8 h-8 text-text-secondary" />
                                        <span className="mt-2 text-sm text-center text-text-secondary">{videoFile ? videoFile.name : 'Click to select a video'}</span>
                                    </div>
                                    <input id="video-upload-area" ref={fileInputRef} type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
                                </div>
                            ) : (
                                <div>
                                    <label htmlFor="video-url" className="block text-sm font-medium text-text-secondary mb-2">Video URL</label>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                        <input 
                                            id="video-url"
                                            type="url"
                                            value={videoUrl}
                                            onChange={handleUrlChange}
                                            placeholder="https://www.youtube.com/watch?v=..."
                                            className={`w-full bg-background border rounded-lg text-white p-2 pl-10 focus:outline-none focus:ring-2 ${urlError ? 'border-error ring-error' : 'border-border focus:ring-primary'}`}
                                        />
                                    </div>
                                    {urlError && <p className="mt-1 text-xs text-error">{urlError}</p>}
                                </div>
                            )}

                            <div>
                                <label htmlFor="prompt" className="block text-sm font-medium text-text-secondary mb-2">Analysis Prompt</label>
                                <textarea
                                    id="prompt"
                                    rows={inputType === 'upload' ? 4 : 1}
                                    className="w-full bg-background border border-border rounded-lg text-white p-2 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                />
                            </div>
                        </div>
                        
                        <div className="mt-4 border-t border-border pt-4">
                            <button type="button" onClick={() => setShowManualTranscriptInput(prev => !prev)} className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-white">
                                <PencilLineIcon className="w-5 h-5" />
                                <span>{showManualTranscriptInput ? 'Hide' : 'Provide'} Manual Transcription</span>
                                <ChevronDownIcon className={`w-4 h-4 transition-transform ${showManualTranscriptInput ? 'rotate-180' : ''}`} />
                            </button>
                            {showManualTranscriptInput && (
                                <div className="mt-3 animate-fade-in-up">
                                    <label htmlFor="manual-transcript" className="block text-sm font-medium text-text-secondary mb-2">
                                        Transcription Text
                                    </label>
                                    <textarea
                                        id="manual-transcript"
                                        rows={6}
                                        className="w-full bg-background border border-border rounded-lg text-white p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                        value={manualTranscript}
                                        onChange={(e) => setManualTranscript(e.target.value)}
                                        placeholder="Paste or type the full video transcription here. Each line will be treated as a separate segment."
                                    />
                                </div>
                            )}
                        </div>

                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleAnalysis}
                                disabled={isLoading || (inputType === 'upload' && !videoFile) || (inputType === 'url' && (!videoUrl.trim() || !!urlError))}
                                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-transform transform hover:scale-105"
                            >
                                {isLoading ? (
                                    <>
                                        <LoaderIcon className="w-5 h-5 animate-spin" />
                                        {inputType === 'url' ? 'Processing URL...' : 'Analyzing File...'}
                                    </>
                                ) : 'Start Analysis'}
                            </button>
                        </div>
                    </Card>

                    {isLoading ? renderLoadingState() : (
                        <>
                            {error && <div className="mt-4 p-4 text-center text-error bg-error/10 rounded-lg">{error}</div>}

                            {/* Analysis results */}
                            {analysisResult && (
                                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-6">
                                        {videoFile && (
                                            <video ref={videoRef} controls src={URL.createObjectURL(videoFile)} className="w-full rounded-lg" />
                                        )}
                                        <Card title="Summary">
                                            <p className="text-text-secondary leading-relaxed">{analysisResult.summary}</p>
                                        </Card>
                                        {videoMetadata && (
                                            <Card title="Video Metadata" icon={<DatabaseIcon className="w-5 h-5 text-text-secondary" />}>
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                                    <p className="font-semibold text-text-secondary">File Name:</p>
                                                    <p className="truncate font-mono text-text">{videoMetadata.name}</p>

                                                    <p className="font-semibold text-text-secondary">File Size:</p>
                                                    <p className="font-mono text-text">{formatBytes(videoMetadata.size)}</p>
                                                    
                                                    <p className="font-semibold text-text-secondary">Dimensions:</p>
                                                    <p className="font-mono text-text">{videoMetadata.width} x {videoMetadata.height}</p>
                                                    
                                                    <p className="font-semibold text-text-secondary">Duration:</p>
                                                    <p className="font-mono text-text">{formatDuration(videoMetadata.duration)}</p>

                                                    <p className="font-semibold text-text-secondary">MIME Type:</p>
                                                    <p className="truncate font-mono text-text">{videoMetadata.type}</p>
                                                </div>
                                            </Card>
                                        )}
                                        <Card title="Keywords">
                                            <div className="flex flex-wrap gap-2">
                                                {analysisResult.keywords.map(kw => <span key={kw} className="bg-border text-primary/80 text-xs font-mono px-2 py-1 rounded-full">{kw}</span>)}
                                            </div>
                                        </Card>
                                        <SentimentAnalysis sentiment={analysisResult.sentiment} />
                                        <Card title="Export Results">
                                            <div className="relative inline-block text-left" ref={exportMenuRef}>
                                                <button
                                                    onClick={() => setIsExportMenuOpen(prev => !prev)}
                                                    className="flex items-center gap-2 px-4 py-2 text-sm bg-border hover:bg-gray-600 rounded-lg transition-colors"
                                                >
                                                    <FileDownIcon className="w-4 h-4" />
                                                    <span>Export</span>
                                                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
                                                </button>
                                                {isExportMenuOpen && (
                                                    <div className="absolute left-0 mt-2 w-56 bg-card rounded-md shadow-lg border border-border py-1 z-20">
                                                        <button
                                                            onClick={() => {
                                                                exportAnalysisToPdf(analysisResult, videoFile?.name || videoUrl, inputType === 'upload' ? videoMetadata : null);
                                                                setIsExportMenuOpen(false);
                                                            }}
                                                            className="block w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-background hover:text-white"
                                                        >
                                                            PDF Report
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                exportAnalysisToCsv(analysisResult);
                                                                setIsExportMenuOpen(false);
                                                            }}
                                                            className="block w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-background hover:text-white"
                                                        >
                                                            Transcription (CSV)
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </Card>
                                    </div>
                                    <TranscriptionViewer
                                        transcription={analysisResult.transcription}
                                        onSegmentClick={handleSegmentClick}
                                        activeSegmentIndex={activeSegmentIndex}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* History sidebar */}
                <aside className="w-80 border-l border-border bg-card flex flex-col">
                    <div className="p-4 border-b border-border flex justify-between items-center">
                        <h2 className="text-lg font-semibold flex items-center gap-2"><HistoryIcon className="w-5 h-5" /> History</h2>
                        <button onClick={clearHistory} disabled={history.length === 0} className="text-text-secondary hover:text-white disabled:opacity-50"><TrashIcon className="w-5 h-5" /></button>
                    </div>
                    <div className="overflow-y-auto flex-1">
                        {history.length === 0 ? (
                            <p className="p-4 text-center text-text-secondary text-sm">No analysis history yet.</p>
                        ) : (
                            <ul className="divide-y divide-border">
                                {history.map(item => (
                                    <li key={item.id}>
                                        <button onClick={() => loadFromHistory(item)} className="w-full text-left p-4 hover:bg-background/50">
                                            <p className="font-semibold truncate">{item.sourceName}</p>
                                            <p className="text-xs text-text-secondary">{new Date(item.timestamp).toLocaleString()}</p>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
};