import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Message, VideoAnalysisResult, VideoMetadata } from '../types';

/**
 * A generic utility to trigger a file download in the browser.
 * @param content The content of the file.
 * @param fileName The desired name of the file.
 * @param mimeType The MIME type of the file.
 */
export const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * Exports chat history to a plain text file.
 * @param messages The array of chat messages.
 */
export const exportChatToTxt = (messages: Message[]) => {
    const content = messages.map(msg => 
        `[${new Date().toISOString()}] ${msg.sender.toUpperCase()}: ${msg.text}${msg.file ? ` (File: ${msg.file.name})` : ''}`
    ).join('\n\n');
    downloadFile(content, 'chat-history.txt', 'text/plain;charset=utf-8');
};

/**
 * Exports chat history to a CSV file.
 * @param messages The array of chat messages.
 */
export const exportChatToCsv = (messages: Message[]) => {
    const header = 'Sender,Message,Attachment\n';
    const rows = messages.map(msg => 
        `"${msg.sender}","${msg.text.replace(/"/g, '""')}","${msg.file ? msg.file.name.replace(/"/g, '""') : ''}"`
    ).join('\n');
    downloadFile(header + rows, 'chat-history.csv', 'text/csv;charset=utf-8');
};

/**
 * Exports video transcription to a CSV file.
 * @param result The video analysis result object.
 */
export const exportAnalysisToCsv = (result: VideoAnalysisResult) => {
    const header = 'Start Time (s),End Time (s),Text\n';
    const rows = result.transcription.map(seg => 
        `${seg.start.toFixed(3)},${seg.end.toFixed(3)},"${seg.text.replace(/"/g, '""')}"`
    ).join('\n');
    downloadFile(header + rows, 'transcription.csv', 'text/csv;charset=utf-8');
};

/**
 * Helper function to format bytes into a human-readable string (KB, MB, GB).
 * @param bytes The number of bytes.
 * @param decimals The number of decimal places to use.
 * @returns A formatted string.
 */
export const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Helper function to format duration in seconds to HH:MM:SS format.
 * @param totalSeconds The total duration in seconds.
 * @returns A formatted string in HH:MM:SS.
 */
export const formatDuration = (totalSeconds: number) => {
    if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00:00';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
    ].join(':');
};

/**
 * Exports a full video analysis report to a PDF file.
 * @param result The video analysis result object.
 * @param sourceName The name of the original video file or URL.
 * @param metadata Optional extracted metadata of the video file.
 */
export const exportAnalysisToPdf = (result: VideoAnalysisResult, sourceName: string, metadata?: VideoMetadata | null) => {
    const doc = new jsPDF();
    let yPos = 20;

    // Title
    doc.setFontSize(18);
    doc.text('Video Analysis Report', 14, yPos);
    yPos += 8;
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Original Source: ${sourceName}`, 14, yPos);
    
    // Metadata Section
    if (metadata) {
        yPos += 12;
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('Video Properties', 14, yPos);
        yPos += 1;

        autoTable(doc, {
            startY: yPos,
            body: [
                ['File Size', formatBytes(metadata.size)],
                ['Dimensions', `${metadata.width} x ${metadata.height}`],
                ['Duration', formatDuration(metadata.duration)],
                ['MIME Type', metadata.type],
            ],
            theme: 'grid',
            styles: {
                fontSize: 10,
                cellPadding: 2,
            },
            headStyles: {
                fillColor: [55, 65, 81], // gray-600
                textColor: 240,
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 40 },
                1: { cellWidth: 'auto' },
            },
        });
        // @ts-ignore
        yPos = doc.lastAutoTable.finalY + 12;

    } else {
        yPos += 12;
    }
    
    // Summary
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Summary', 14, yPos);
    yPos += 6;
    doc.setFontSize(11);
    doc.setTextColor(80);
    const summaryLines = doc.splitTextToSize(result.summary, 180);
    doc.text(summaryLines, 14, yPos);
    yPos += summaryLines.length * 5 + 10;
    
    // Keywords
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Keywords', 14, yPos);
    yPos += 6;
    doc.setFontSize(11);
    doc.setTextColor(80);
    const keywordsLines = doc.splitTextToSize(result.keywords.join(', '), 180);
    doc.text(keywordsLines, 14, yPos);
    yPos += keywordsLines.length * 5 + 10;

    // Sentiment
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Sentiment Analysis', 14, yPos);
    yPos += 6;
    doc.setFontSize(11);
    doc.setTextColor(80);
    doc.text(`- Overall: ${result.sentiment.overall}`, 16, yPos);
    yPos += 6;
    doc.text(`- Score: ${result.sentiment.score.toFixed(2)}`, 16, yPos);
    yPos += 12;
    
    // Transcription Table
    autoTable(doc, {
        startY: yPos,
        head: [['Start (s)', 'End (s)', 'Text']],
        body: result.transcription.map(s => [s.start.toFixed(2), s.end.toFixed(2), s.text]),
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
        didDrawPage: (data: any) => {
            doc.setFontSize(10);
            doc.text(`Page ${data.pageNumber}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
        }
    });

    doc.save(`analysis-report-${sourceName}.pdf`);
};