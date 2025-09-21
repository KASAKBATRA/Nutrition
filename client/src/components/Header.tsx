import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const languageOptions = [
  { code: 'en', label: '🇺🇸 English', name: 'English' },
  { code: 'hi', label: '🇮🇳 Hindi', name: 'हिंदी' },
  { code: 'ur', label: '🇵🇰 Urdu', name: 'اردو' },
  { code: 'pa', label: '🇮🇳 Punjabi', name: 'ਪੰਜਾਬੀ' },
  { code: 'mr', label: '🇮🇳 Marathi', name: 'मराठी' },
  { code: 'gu', label: '🇮🇳 Gujarati', name: 'ગુજરાતી' },
];

export function Header() {
  const [showHelpModal, setShowHelpModal] = useState(false);

  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { toast } = useToast();

  const handleLogin = () => {
    setLocation('/login');
  };

  const handleLogout = () => {
    fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).then(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setLocation('/');
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    }).catch(() => {
      toast({
        title: "Logout Error",
        description: "There was an error logging out.",
        variant: "destructive",
      });
    });
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

            {/* Help Button */}
            <button
              onClick={() => {
                console.log('Help button clicked!');
                setShowHelpModal(true);
              }}
              className="p-2 rounded-lg bg-nutricare-green/10 hover:bg-nutricare-green/20 text-nutricare-green border border-nutricare-green/30 hover:border-nutricare-green/50 transition-all duration-200 shadow-sm"
              title="App Help & Information"
            >
              <i className="fas fa-question-circle text-lg"></i>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
            >
              <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
            </button>

            {/* Auth Buttons */}
            {!isAuthenticated ? (
              <div className="flex items-center space-x-4">
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

      {/* Help Modal with Glassmorphism */}
      {showHelpModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          style={{ animation: 'fadeIn 0.3s ease-out' }}
          onClick={() => setShowHelpModal(false)}
        >
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideIn {
              from { 
                opacity: 0; 
                transform: scale(0.9) translateY(-20px); 
              }
              to { 
                opacity: 1; 
                transform: scale(1) translateY(0); 
              }
            }
          `}</style>
          <div
            className="relative w-full max-w-lg mx-4 p-6 rounded-2xl shadow-2xl"
            style={{
              background: 'rgba(255,255,255,0.95)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255,255,255,0.3)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.2)',
              animation: 'slideIn 0.3s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-gray-700 bg-white/60 hover:bg-white/90 rounded-full p-2 shadow transition-all duration-200"
              onClick={() => setShowHelpModal(false)}
              aria-label="Close Help"
            >
              <i className="fas fa-times text-sm"></i>
            </button>

            <div className="text-center">
              <div className="mb-4">
                <div className="bg-gradient-to-r from-nutricare-green to-nutricare-light p-3 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-3">
                  <i className="fas fa-leaf text-white text-2xl"></i>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">NutriCare++</h2>
                <p className="text-sm text-gray-600 mb-4">Your Smart Health & Nutrition Companion</p>
              </div>

              <div className="space-y-4 text-left">
                <div className="bg-white/40 rounded-lg p-4 border border-white/30">
                  <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <i className="fas fa-utensils text-nutricare-green mr-2"></i>
                    Smart Food Tracking
                  </h3>
                  <p className="text-sm text-gray-700">
                    Log meals, scan food labels with OCR, get nutrition insights, and track your daily intake with detailed analytics.
                  </p>
                </div>

                <div className="bg-white/40 rounded-lg p-4 border border-white/30">
                  <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <i className="fas fa-heart text-red-500 mr-2"></i>
                    Stress Management
                  </h3>
                  <p className="text-sm text-gray-700">
                    Monitor stress levels, get AI-powered recommendations, and discover stress-busting activities with our comprehensive wellness tools.
                  </p>
                </div>

                <div className="bg-white/40 rounded-lg p-4 border border-white/30">
                  <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <i className="fas fa-users text-blue-500 mr-2"></i>
                    Community & Friends
                  </h3>
                  <p className="text-sm text-gray-700">
                    Connect with friends, share your journey, join community challenges, and get motivated by others on similar health paths.
                  </p>
                </div>

                <div className="bg-white/40 rounded-lg p-4 border border-white/30">
                  <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <i className="fas fa-user-md text-purple-500 mr-2"></i>
                    Expert Consultations
                  </h3>
                  <p className="text-sm text-gray-700">
                    Book appointments with certified nutritionists, get personalized meal plans, and receive professional health guidance.
                  </p>
                </div>

                <div className="bg-white/40 rounded-lg p-4 border border-white/30">
                  <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <i className="fas fa-camera text-orange-500 mr-2"></i>
                    AI-Powered Features
                  </h3>
                  <p className="text-sm text-gray-700">
                    Use photo portion estimation, OCR food label scanning, AI chatbot assistance, and smart health recommendations.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/30">
                <p className="text-xs text-gray-600 text-center">
                  NutriCare++ v2.0 | Made with ❤️ for your health journey
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
