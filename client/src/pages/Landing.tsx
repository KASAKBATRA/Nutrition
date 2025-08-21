import React from 'react';
import { useLocation } from 'wouter';
import { Layout } from '@/components/Layout';
import { useLanguage } from '@/context/LanguageContext';

export default function Landing() {
  const { t } = useLanguage();

  const handleLogin = () => {
    setLocation('/login');
  };

  const [, setLocation] = useLocation();

  return (
    <Layout showSidebar={false}>
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-12">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-r from-nutricare-green to-nutricare-light rounded-full flex items-center justify-center">
                <i className="fas fa-leaf text-white text-4xl"></i>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-nutricare-green to-nutricare-forest bg-clip-text text-transparent">
                NutriCare++
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              Your AI-powered nutrition companion for a healthier lifestyle
            </p>
            
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
              Track your nutrition, connect with nutritionists, join a health-focused community, 
              and get personalized AI guidance in multiple languages.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                <i className="fas fa-utensils text-red-500 text-xl"></i>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Smart Food Logging</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Track your meals with AI-powered nutrition analysis and barcode scanning
              </p>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                <i className="fas fa-user-md text-blue-500 text-xl"></i>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Expert Consultations</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Book appointments with certified nutritionists for personalized guidance
              </p>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                <i className="fas fa-users text-green-500 text-xl"></i>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Health Community</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Connect with like-minded individuals and share your health journey
              </p>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                <i className="fas fa-robot text-purple-500 text-xl"></i>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">AI Assistant</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Get instant answers about nutrition, health, and wellness in your language
              </p>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                <i className="fas fa-chart-line text-orange-500 text-xl"></i>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Progress Tracking</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Monitor your health metrics with detailed reports and visualizations
              </p>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                <i className="fas fa-globe text-indigo-500 text-xl"></i>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Multi-Language Support</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Use the app in Hindi, Urdu, Punjabi, Marathi, Gujarati, and English
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-nutricare-green to-nutricare-light p-8 rounded-2xl text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to start your health journey?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of users who are already living healthier lives with NutriCare++
            </p>
            <button
              onClick={handleLogin}
              className="bg-white text-nutricare-green px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Get Started Free
            </button>
            
            <div className="mt-6">
              <p className="text-white/80 mb-4">Already have an account?</p>
              <button
                onClick={() => setLocation('/register')}
                className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-xl font-semibold hover:bg-white hover:text-nutricare-green transition-all duration-200"
              >
                Create Account
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-16 text-center text-gray-500 dark:text-gray-400">
            <p>&copy; 2024 NutriCare++. Empowering healthy lifestyles worldwide.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
