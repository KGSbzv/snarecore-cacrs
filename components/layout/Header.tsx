import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { View } from '../../types';
import { MessageSquareIcon } from '../icons/MessageSquareIcon';
import { VideoIcon } from '../icons/VideoIcon';
import { ShieldIcon } from '../icons/ShieldIcon';
import { LogOutIcon } from '../icons/LogOutIcon';
import { BellIcon } from '../icons/BellIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { UserIcon } from '../icons/UserIcon';

interface HeaderProps {
    currentView: View;
    setCurrentView: (view: View) => void;
}

const viewConfig = {
    chat: { title: 'AI Chat', icon: <MessageSquareIcon className="w-6 h-6" /> },
    video: { title: 'Video Analysis', icon: <VideoIcon className="w-6 h-6" /> },
    admin: { title: 'Admin Dashboard', icon: <ShieldIcon className="w-6 h-6" /> },
    profile: { title: 'User Profile', icon: <UserIcon className="w-6 h-6" /> },
};

export const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView }) => {
    const { currentUser, logout } = useAppContext();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { title, icon } = viewConfig[currentView];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="flex items-center justify-between p-4 border-b border-border bg-card flex-shrink-0">
            <h1 className="text-xl font-bold flex items-center gap-3">
                {icon}
                <span>{title}</span>
            </h1>

            <div className="flex items-center gap-4">
                <button className="text-text-secondary hover:text-text relative">
                    <BellIcon className="w-6 h-6" />
                    {/* Notification dot */}
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-warning ring-2 ring-card"></span>
                </button>

                <div className="relative" ref={dropdownRef}>
                    <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2"
                    >
                        {currentUser?.avatarUrl ? (
                            <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-9 h-9 rounded-full object-cover border-2 border-border" />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-background flex items-center justify-center font-bold text-lg text-primary border-2 border-primary/50">
                                {currentUser?.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <span className="hidden md:block font-semibold">{currentUser?.name}</span>
                        <ChevronDownIcon className={`w-5 h-5 text-text-secondary transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-card rounded-lg shadow-lg border border-border py-1 z-10 animate-fade-in-up origin-top-right">
                            <div className="px-4 py-2 border-b border-border">
                                <p className="font-semibold text-text truncate">{currentUser?.name}</p>
                                <p className="text-xs text-text-secondary truncate">{currentUser?.email}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setCurrentView('profile');
                                    setIsDropdownOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:bg-background hover:text-white"
                            >
                                <UserIcon className="w-5 h-5"/>
                                Profile
                            </button>
                            <button
                                onClick={() => {
                                    logout();
                                    setIsDropdownOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:bg-error/20 hover:text-error"
                            >
                                <LogOutIcon className="w-5 h-5"/>
                                Log Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};