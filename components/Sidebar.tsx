import React from 'react';
import type { View } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { MessageSquareIcon } from './icons/MessageSquareIcon';
import { VideoIcon } from './icons/VideoIcon';
import { ShieldIcon } from './icons/ShieldIcon';
import { DownloadCloudIcon } from './icons/DownloadCloudIcon';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  showInstallButton: boolean;
  onInstallClick: () => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <li>
    <button
      onClick={onClick}
      className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 group relative ${
        isActive
          ? 'bg-primary/10 text-white'
          : 'text-text-secondary hover:bg-white/5 hover:text-white'
      }`}
    >
      {isActive && <div className="absolute left-0 top-0 h-full w-1 bg-primary rounded-r-full"></div>}
      <div className={`w-5 h-5 mr-4 transition-transform duration-200 ${isActive ? 'scale-110 text-primary' : 'group-hover:scale-105'}`}>{icon}</div>
      <span className="font-medium">{label}</span>
    </button>
  </li>
);

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  showInstallButton,
  onInstallClick,
}) => {
  const { currentUser } = useAppContext();

  return (
    <aside className="w-64 bg-card text-white flex flex-col p-4 border-r border-border">
      <div className="mb-8 flex items-center justify-center gap-2">
        <ShieldIcon className="w-8 h-8 text-primary" />
        <h1 className="text-2xl font-bold font-mono text-center text-text">SNARECORE</h1>
      </div>
      
      <nav className="flex-1">
        <ul className="space-y-2">
          <NavItem
            icon={<MessageSquareIcon />}
            label="Chat"
            isActive={currentView === 'chat'}
            onClick={() => setCurrentView('chat')}
          />
          <NavItem
            icon={<VideoIcon />}
            label="Video Analysis"
            isActive={currentView === 'video'}
            onClick={() => setCurrentView('video')}
          />
          {currentUser?.role === 'ADMIN' && (
            <NavItem
              icon={<ShieldIcon />}
              label="Admin"
              isActive={currentView === 'admin'}
              onClick={() => setCurrentView('admin')}
            />
          )}
        </ul>
      </nav>

      <div>
        {showInstallButton && (
          <button
            onClick={onInstallClick}
            className="flex items-center justify-center w-full px-4 py-3 mb-4 rounded-lg bg-success hover:bg-success/90 transition-colors"
          >
            <DownloadCloudIcon className="w-5 h-5 mr-3" />
            <span className="font-medium">Install App</span>
          </button>
        )}
      </div>
    </aside>
  );
};