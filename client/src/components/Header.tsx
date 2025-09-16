import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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

  const { isAuthenticated, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [showProgressMenu, setShowProgressMenu] = useState(false);
  const { toast } = useToast();

  const { data: notifications } = useQuery({
    queryKey: ['/api/notifications'],
    enabled: isAuthenticated,
  });

  const unreadNotifications = notifications?.filter((n: any) => !n.isRead) || [];
  const foodNotifications = unreadNotifications.filter((n: any) => n.type === 'food_reminder');
  const friendNotifications = unreadNotifications.filter((n: any) => n.type === 'friend_activity');
  const communityNotifications = unreadNotifications.filter((n: any) => n.type === 'community_post');

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

  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

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

            {/* Notifications - Only show when authenticated */}
            {isAuthenticated && (
              <div className="flex items-center space-x-4">
                {/* Food Reminder Notifications */}
                <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-nutricare-green transition-colors">
                  <i className="fas fa-utensils text-lg"></i>
                  {foodNotifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {foodNotifications.length}
                    </span>
                  )}
                </button>

                {/* Friend Activity Notifications */}
                <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-nutricare-green transition-colors">
                  <i className="fas fa-user-friends text-lg"></i>
                  {friendNotifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {friendNotifications.length}
                    </span>
                  )}
                </button>

                {/* Community Post Notifications */}
                <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-nutricare-green transition-colors">
                  <i className="fas fa-comments text-lg"></i>
                  {communityNotifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {communityNotifications.length}
                    </span>
                  )}
                </button>

                {/* Progress Tracking */}
                <div className="relative">
                  <button
                    onMouseEnter={() => setShowProgressMenu(true)}
                    onMouseLeave={() => setShowProgressMenu(false)}
                    className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <i className="fas fa-chart-line text-nutricare-green"></i>
                    <span className="text-sm font-medium">{t('header.progress')}</span>
                  </button>
                  {showProgressMenu && (
                    <div
                      onMouseEnter={() => setShowProgressMenu(true)}
                      onMouseLeave={() => setShowProgressMenu(false)}
                      className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="py-2">
                        <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                          {t('header.daily')}
                        </button>
                        <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                          {t('header.weekly')}
                        </button>
                        <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                          {t('header.monthly')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

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
    </header>
  );
}
