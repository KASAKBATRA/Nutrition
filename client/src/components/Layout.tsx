import React, { useState } from 'react';
import { Header } from './Header';
import { FloatingElements } from './FloatingElements';
import { CircularMenu } from './CircularMenu';
import { Chatbot } from './Chatbot';
import { MotivationalQuotes } from './MotivationalQuotes';
import { useAuth } from '@/hooks/useAuth';

interface LayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

export function Layout({ children, showSidebar = false }: LayoutProps) {
  const { isAuthenticated } = useAuth();
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
      <FloatingElements />
      <Header />
      
      <div className="flex min-h-screen relative z-10">
        {/* Left Sidebar - Motivational Quotes */}
        {showSidebar && isAuthenticated && (
          <div className="hidden lg:block w-80 bg-gradient-to-br from-nutricare-light/20 to-nutricare-green/20 dark:from-nutricare-forest/20 dark:to-nutricare-dark/20 p-6 border-r border-gray-200 dark:border-gray-700">
            <MotivationalQuotes />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1">
          {children}
        </div>
      </div>

      {/* Circular Menu - Only show when authenticated */}
      {isAuthenticated && (
        <CircularMenu onChatbotOpen={() => setIsChatbotOpen(true)} />
      )}

      {/* Chatbot */}
      <Chatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />

      {/* Chatbot Toggle Button (when closed and authenticated) */}
      {!isChatbotOpen && isAuthenticated && (
        <button
          onClick={() => setIsChatbotOpen(true)}
          className="fixed bottom-4 left-4 w-12 h-12 bg-gradient-to-r from-nutricare-green to-nutricare-light text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 flex items-center justify-center z-40"
        >
          <i className="fas fa-comments"></i>
        </button>
      )}
    </div>
  );
}
