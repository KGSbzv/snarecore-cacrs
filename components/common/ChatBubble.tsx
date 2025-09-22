import React from 'react';
import type { Message } from '../../types';
import { FileTextIcon } from '../icons/FileTextIcon';

const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const renderFormattedText = (text: string, highlight?: string) => {
  const highlightTerm = highlight?.trim();

  // This function will process a chunk of text for markdown.
  const processMarkdown = (part: string, keyPrefix: string) => {
    // Return early if part is empty
    if (!part) return null;

    const markdownParts = part.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return markdownParts.map((mdPart, mdIndex) => {
      if (mdPart.startsWith('**') && mdPart.endsWith('**')) {
        return <strong key={`${keyPrefix}-${mdIndex}`}>{mdPart.slice(2, -2)}</strong>;
      }
      if (mdPart.startsWith('*') && mdPart.endsWith('*')) {
        return <em key={`${keyPrefix}-${mdIndex}`}>{mdPart.slice(1, -1)}</em>;
      }
      return mdPart;
    });
  };

  if (!highlightTerm) {
    return processMarkdown(text, 'md');
  }

  const regex = new RegExp(`(${escapeRegExp(highlightTerm)})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.toLowerCase() === highlightTerm.toLowerCase()) {
      return <mark key={`highlight-${index}`} className="bg-yellow-500/70 text-white rounded px-0.5">{part}</mark>;
    }
    // For non-highlighted parts, process them for markdown
    return processMarkdown(part, `part-${index}`);
  });
};

const TypingIndicator: React.FC = () => (
    <div className="flex items-center space-x-1.5">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
    </div>
);


export const ChatBubble: React.FC<{ message: Message; isLoading?: boolean; highlight?: string }> = ({ message, isLoading, highlight }) => {
  const isUser = message.sender === 'user';
  return (
    <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex-shrink-0"></div>
      )}
      <div
        className={`max-w-xl p-4 rounded-2xl whitespace-pre-wrap ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-gray-700 text-gray-200 rounded-bl-none'
        }`}
      >
        {/* If this bubble is for the model, it's currently loading, and has no text yet, show the typing indicator. */}
        {isLoading && message.sender === 'model' && !message.text ? (
            <TypingIndicator />
        ) : (
            <div className="text-sm">{renderFormattedText(message.text, highlight)}</div>
        )}
        
        {message.file && (
             <div className="mt-3 p-2 bg-gray-600/50 rounded-lg flex items-center gap-2">
                <FileTextIcon className="w-5 h-5 text-gray-400"/>
                <span className="text-xs text-gray-300 font-mono truncate">{message.file.name}</span>
             </div>
        )}
      </div>
    </div>
  );
};