import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAboutModal } from '@/context/AboutModalContext';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { HelpDialog } from './HelpDialog';

interface HeaderProps {
  onChatbotOpen?: () => void;
}

const languageOptions = [
  { code: 'en', label: '🇺🇸 English', name: 'English' },
  { code: 'hi', label: '🇮🇳 Hindi', name: 'हिंदी' },
  { code: 'ur', label: '🇵🇰 Urdu', name: 'اردو' },
  { code: 'pa', label: '🇮🇳 Punjabi', name: 'ਪੰਜਾਬੀ' },
  { code: 'mr', label: '🇮🇳 Marathi', name: 'मराठी' },
  { code: 'gu', label: '🇮🇳 Gujarati', name: 'ગુજરાતી' },
];

export function Header({ onChatbotOpen }: HeaderProps = {}) {

  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { toast } = useToast();
  const { openAboutModal } = useAboutModal();

  const handleLogin = () => {
    setLocation('/login');
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        // Clear all local data
        queryClient.clear();
        queryClient.removeQueries();
        
        // Clear any cached user data
        localStorage.clear();
        sessionStorage.clear();
        
        // Wait a moment for React Query to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        setLocation('/login');
        toast({
          title: "Logged Out",
          description: "You have been successfully logged out. Please login again to see your data.",
        });
      }
    } catch (error) {
      toast({
        title: "Logout Error",
        description: "There was an error logging out.",
        variant: "destructive",
      });
    }
  };

  const handleNavigationClick = (action: string) => {
    switch (action) {
      case 'food':
        setLocation('/food-log');
        break;
      case 'reports':
        setLocation('/reports');
        break;
      case 'appointments':
        setLocation('/appointments');
        break;
      case 'community':
        setLocation('/community');
        break;
      case 'friends':
        setLocation('/friends');
        break;
      case 'chatbot':
        if (onChatbotOpen) {
          onChatbotOpen();
        }
        break;
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-lg relative z-10 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo and App Name */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-nutricare-green to-nutricare-light p-2 rounded-full">
              <i className="fas fa-leaf text-white text-xl"></i>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-nutricare-green to-nutricare-forest bg-clip-text text-transparent">
              NutriCare++
            </h1>
          </div>

          {/* Header Controls */}
          <div className="flex items-center space-x-6">
            {/* Language Toggle */}
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nutricare-green"
              >
                {languageOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
            >
              <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
            </button>

            {/* Navigation Icons - only show when authenticated */}
            {isAuthenticated && (
              <div className="flex items-center space-x-2">
                {/* Reports */}
                <button
                  onClick={() => handleNavigationClick('reports')}
                  className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all duration-200"
                  title="Reports"
                >
                  <i className="fas fa-chart-bar"></i>
                </button>

                {/* Appointments */}
                <button
                  onClick={() => handleNavigationClick('appointments')}
                  className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-all duration-200"
                  title="Appointments"
                >
                  <i className="fas fa-calendar-check"></i>
                </button>

                {/* Community */}
                <button
                  onClick={() => handleNavigationClick('community')}
                  className="p-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-all duration-200"
                  title="Community Feed"
                >
                  <i className="fab fa-instagram"></i>
                </button>

                {/* Friends */}
                <button
                  onClick={() => handleNavigationClick('friends')}
                  className="p-2 rounded-lg bg-pink-500 text-white hover:bg-pink-600 transition-all duration-200"
                  title="Friends"
                >
                  <i className="fas fa-user-friends"></i>
                </button>

                {/* AI Chatbot */}
                <button
                  onClick={() => handleNavigationClick('chatbot')}
                  className="p-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-all duration-200"
                  title="AI Chatbot"
                >
                  <i className="fas fa-robot"></i>
                </button>
              </div>
            )}

            {/* Help Button */}
            <HelpDialog>
              <button 
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                title="Help & App Guide"
              >
                <i className="fas fa-question-circle"></i>
              </button>
            </HelpDialog>

            {/* Auth Buttons */}
            {!isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => {
                    console.log('About button clicked, opening modal');
                    openAboutModal();
                  }}
                  className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-nutricare-green transition-colors text-sm font-medium"
                >
                  About
                </button>
                <button
                  onClick={handleLogin}
                  className="px-4 py-2 text-nutricare-green border border-nutricare-green rounded-lg hover:bg-nutricare-green hover:text-white transition-all duration-200"
                >
                  {t('header.signin')}
                </button>
                <button
                  onClick={() => setLocation('/register')}
                  className="px-4 py-2 bg-nutricare-green text-white rounded-lg hover:bg-nutricare-dark transition-all duration-200"
                >
                  {t('header.register')}
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => {
                    console.log('About button clicked (authenticated), opening modal');
                    openAboutModal();
                  }}
                  className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-nutricare-green transition-colors text-sm font-medium"
                >
                  About
                </button>
                <div className="flex items-center space-x-2">
                  {user?.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-nutricare-green rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user?.firstName || 'User'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-nutricare-green transition-colors"
                >
                  <i className="fas fa-sign-out-alt"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
