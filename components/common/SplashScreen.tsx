import React from 'react';
import { ShieldIcon } from '../icons/ShieldIcon';

export const SplashScreen: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-background text-text">
    <div className="relative flex flex-col items-center justify-center">
      <div className="absolute w-48 h-48 bg-primary/10 rounded-full blur-3xl animate-pulse-slow"></div>
      <ShieldIcon className="w-16 h-16 text-primary mb-4 z-10 animate-fade-in-up" />
      <h1 className="text-3xl font-bold font-mono text-text tracking-widest z-10 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        SNARECORE
      </h1>
      <p className="mt-2 text-text-secondary z-10 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        Securing session...
      </p>
    </div>
  </div>
);
