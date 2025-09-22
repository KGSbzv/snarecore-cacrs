import React from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  return (
    <div className="relative flex items-center group">
      {children}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-xs
                      bg-gray-900 text-white text-xs rounded-md py-1.5 px-3
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300
                      pointer-events-none z-10 border border-border shadow-lg">
        {content}
        <svg className="absolute text-gray-900 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255">
          <polygon className="fill-current" points="0,0 127.5,127.5 255,0"/>
        </svg>
      </div>
    </div>
  );
};
