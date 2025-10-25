import React, { useState } from 'react';
import { Header } from './Header';
import { FloatingElements } from './FloatingElements';
import { Chatbot } from './Chatbot';
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
      <Header onChatbotOpen={() => setIsChatbotOpen(true)} />
      
      <div className="flex min-h-screen relative z-10">
        {/* Main Content */}
        <div className="flex-1">
          {children}
        </div>
      </div>

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
