import React, { useState, useEffect } from 'react';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { VideoAnalyzer } from './components/VideoAnalyzer';
import { AdminDashboard } from './components/AdminDashboard';
import { Toast } from './components/common/Toast';
import { LoginPage } from './components/LoginPage';
import ErrorBoundary from './components/ErrorBoundary';
import type { View } from './types';
import { Header } from './components/layout/Header';
import { SplashScreen } from './components/common/SplashScreen';
import { ProfilePage } from './components/ProfilePage';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('chat');
  const { currentUser, isLoadingUser } = useAppContext();
  
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [showInstallToast, setShowInstallToast] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      if (window.matchMedia('(display-mode: standalone)').matches) return;
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);
  
  useEffect(() => {
    if (!currentUser) setCurrentView('chat');
    // If user logs out from admin view, switch to chat
    if (currentUser?.role !== 'ADMIN' && currentView === 'admin') {
      setCurrentView('chat');
    }
  }, [currentUser, currentView]);

  const handleInstallClick = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        setShowInstallToast(true);
      }
      setInstallPrompt(null);
      setShowInstallButton(false);
    });
  };

  if (isLoadingUser) {
    return <SplashScreen />;
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'chat': return <ChatInterface />;
      case 'video': return <VideoAnalyzer />;
      case 'admin': return <AdminDashboard />;
      case 'profile': return <ProfilePage />;
      default: return <ChatInterface />;
    }
  };

  return (
    <div className="flex h-screen bg-background font-sans text-text">
      <Sidebar 
        currentView={currentView}
        setCurrentView={setCurrentView}
        showInstallButton={showInstallButton}
        onInstallClick={handleInstallClick}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header currentView={currentView} setCurrentView={setCurrentView} />
        <main className="flex-1 overflow-y-auto bg-black/30">
          {renderView()}
        </main>
      </div>
      {showInstallToast && (
        <Toast 
          message="App installed successfully!"
          onClose={() => setShowInstallToast(false)}
        />
      )}
    </div>
  );
};

const App: React.FC = () => (
  <AppProvider>
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  </AppProvider>
);

export default App;