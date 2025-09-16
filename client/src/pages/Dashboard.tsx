import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { isUnauthorizedError } from '@/lib/authUtils';

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [, setLocation] = useLocation();
  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
      return;
    }
  }, [isAuthenticated, isLoading, setLocation]);

  

  const { data: foodLogs } = useQuery({
    queryKey: ['/api/food-logs'],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: waterLogs } = useQuery({
    queryKey: ['/api/water-logs'],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: weightLogs } = useQuery({
    queryKey: ['/api/weight-logs'],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: communityPosts } = useQuery({
    queryKey: ['/api/community/posts'],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: appointments } = useQuery({
    queryKey: ['/api/appointments'],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: friends } = useQuery({
    queryKey: ['/api/friends'],
    enabled: isAuthenticated,
    retry: false,
  });

  // Calculate daily totals
  const todayFoodLogs = foodLogs?.filter((log: any) => {
    const logDate = new Date(log.date);
    const today = new Date();
    return logDate.toDateString() === today.toDateString();
  }) || [];

  const todayWaterLogs = waterLogs?.filter((log: any) => {
    const logDate = new Date(log.date);
    const today = new Date();
    return logDate.toDateString() === today.toDateString();
  }) || [];

  const totalCalories = todayFoodLogs.reduce((sum: number, log: any) => sum + (parseFloat(log.calories) || 0), 0);
  const totalWater = todayWaterLogs.reduce((sum: number, log: any) => sum + (parseFloat(log.amount) || 0), 0);
  const latestWeight = weightLogs?.[0]?.weight || 0;
  const latestBMI = weightLogs?.[0]?.bmi || 0;

  const calorieGoal = 2000;
  const waterGoal = 8;
  const calorieProgress = Math.min((totalCalories / calorieGoal) * 100, 100);
  const waterProgress = Math.min((totalWater / waterGoal) * 100, 100);

  const getBMIStatus = (bmi: number) => {
    if (bmi < 18.5) return { status: 'Underweight', color: 'text-blue-500' };
    if (bmi < 25) return { status: t('dashboard.normal'), color: 'text-green-500' };
    if (bmi < 30) return { status: 'Overweight', color: 'text-yellow-500' };
    return { status: 'Obese', color: 'text-red-500' };
  };

  const bmiStatus = getBMIStatus(parseFloat(latestBMI?.toString() || '0'));

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout showSidebar={true}>
      <div className="p-6 lg:p-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('dashboard.welcome')}, {user?.firstName || 'User'}!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{t('dashboard.journey')}</p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Calorie Intake Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                <i className="fas fa-fire text-red-500 text-xl"></i>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.today')}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('dashboard.calories')}</h3>
            <div className="flex items-end space-x-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(totalCalories)}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">/ {calorieGoal}</span>
            </div>
            <div className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-red-500 h-2 rounded-full" style={{ width: `${calorieProgress}%` }}></div>
            </div>
          </div>

          {/* Hydration Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <i className="fas fa-tint text-blue-500 text-xl"></i>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.today')}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('dashboard.water')}</h3>
            <div className="flex items-end space-x-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{totalWater}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">/ {waterGoal} {t('dashboard.glasses')}</span>
            </div>
            <div className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${waterProgress}%` }}></div>
            </div>
          </div>

          {/* Weight Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-nutricare-green/20 rounded-full">
                <i className="fas fa-weight text-nutricare-green text-xl"></i>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.thisweek')}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('dashboard.weight')}</h3>
            <div className="flex items-end space-x-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {latestWeight ? parseFloat(latestWeight.toString()).toFixed(1) : '0.0'}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">kg</span>
            </div>
            {weightLogs && weightLogs.length >= 2 && (
              <div className="flex items-center mt-2">
                <i className="fas fa-arrow-down text-green-500 text-sm mr-1"></i>
                <span className="text-sm text-green-500">
                  {(parseFloat(weightLogs[1]?.weight || '0') - parseFloat(latestWeight?.toString() || '0')).toFixed(1)}kg from last week
                </span>
              </div>
            )}
          </div>

          {/* BMI Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                <i className="fas fa-calculator text-purple-500 text-xl"></i>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.current')}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('dashboard.bmi')}</h3>
            <div className="flex items-end space-x-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {latestBMI ? parseFloat(latestBMI.toString()).toFixed(1) : '0.0'}
              </span>
              <span className={`text-sm ${bmiStatus.color}`}>{bmiStatus.status}</span>
            </div>
            <div className="mt-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.healthy_range')}</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Daily Food Log */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  <i className="fas fa-utensils text-nutricare-green mr-2"></i>
                  {t('meals.title')}
                </h3>
                <button className="px-4 py-2 bg-nutricare-green text-white rounded-lg hover:bg-nutricare-dark transition-colors text-sm">
                  <i className="fas fa-plus mr-1"></i>
                  {t('meals.add')}
                </button>
              </div>

              <div className="space-y-4">
                {/* Show recent meals or empty state */}
                {todayFoodLogs.length > 0 ? (
                  todayFoodLogs.slice(0, 4).map((log: any, index: number) => (
                    <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 ${index === 0 ? 'bg-orange-500' : index === 1 ? 'bg-yellow-500' : index === 2 ? 'bg-green-500' : 'bg-purple-500'} rounded-full`}>
                          <i className={`fas ${index === 0 ? 'fa-sun' : index === 1 ? 'fa-sun' : index === 2 ? 'fa-apple-alt' : 'fa-moon'} text-white text-sm`}></i>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{log.mealType}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Food logged</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">{Math.round(parseFloat(log.calories || '0'))} cal</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(log.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <i className="fas fa-utensils text-gray-400 text-xl"></i>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">No meals logged today</p>
                    <button className="px-4 py-2 bg-nutricare-green text-white rounded-lg hover:bg-nutricare-dark transition-colors">
                      {t('meals.add')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Community Feed Preview */}
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  <i className="fab fa-instagram text-pink-500 mr-2"></i>
                  {t('community.title')}
                </h3>
                <button className="text-nutricare-green hover:text-nutricare-dark transition-colors">
                  {t('community.view_all')} <i className="fas fa-arrow-right ml-1"></i>
                </button>
              </div>

              {communityPosts && communityPosts.length > 0 ? (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center text-white font-semibold">
                      {communityPosts[0].user?.firstName?.[0] || 'U'}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {communityPosts[0].user?.firstName || 'User'} {communityPosts[0].user?.lastName || ''}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(communityPosts[0].createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {communityPosts[0].imageUrl && (
                    <img 
                      src={communityPosts[0].imageUrl} 
                      alt="Community post" 
                      className="w-full h-48 object-cover rounded-lg mb-3"
                    />
                  )}
                  <p className="text-gray-700 dark:text-gray-300 mb-3">{communityPosts[0].content}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <button className="flex items-center space-x-1 hover:text-red-500 transition-colors">
                      <i className="far fa-heart"></i>
                      <span>{communityPosts[0].likesCount || 0}</span>
                    </button>
                    <button className="flex items-center space-x-1 hover:text-blue-500 transition-colors">
                      <i className="far fa-comment"></i>
                      <span>{communityPosts[0].commentsCount || 0}</span>
                    </button>
                    <button className="flex items-center space-x-1 hover:text-green-500 transition-colors">
                      <i className="far fa-share"></i>
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <i className="fab fa-instagram text-gray-400 text-xl"></i>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">No community posts yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('actions.title')}</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center space-x-3 p-3 bg-nutricare-green/10 hover:bg-nutricare-green/20 rounded-lg transition-colors">
                  <i className="fas fa-camera-retro text-nutricare-green"></i>
                  <span className="text-gray-700 dark:text-gray-300">{t('actions.scan')}</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                  <i className="fas fa-calendar-plus text-blue-500"></i>
                  <span className="text-gray-700 dark:text-gray-300">{t('actions.appointment')}</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors">
                  <i className="fas fa-chart-bar text-purple-500"></i>
                  <span className="text-gray-700 dark:text-gray-300">{t('actions.reports')}</span>
                </button>
              </div>
            </div>

            {/* Upcoming Appointments */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('appointments.title')}</h3>
              {appointments && appointments.length > 0 ? (
                <div className="space-y-3">
                  {appointments.slice(0, 2).map((appointment: any) => (
                    <div key={appointment.id} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Dr. Nutritionist</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{t('appointments.consultation')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {new Date(appointment.scheduledAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(appointment.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 dark:text-gray-400">No upcoming appointments</p>
                </div>
              )}
            </div>

            {/* Friends Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('friends.title')}</h3>
              {friends && friends.length > 0 ? (
                <div className="space-y-3">
                  {friends.slice(0, 3).map((friend: any, index: number) => (
                    <div key={friend.id} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {friend.firstName?.[0] || 'F'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-medium">{friend.firstName}</span> {index % 2 === 0 ? t('friends.completed_goal') : t('friends.shared_recipe')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{Math.floor(Math.random() * 60)} mins ago</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 dark:text-gray-400">No friend activity yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
