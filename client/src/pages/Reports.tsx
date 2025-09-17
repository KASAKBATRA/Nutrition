import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { isUnauthorizedError } from '@/lib/authUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type TimeRange = 'daily' | 'weekly' | 'monthly';

export default function Reports() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState<TimeRange>('weekly');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch data for reports
  const { data: foodLogs, isLoading: foodLogsLoading } = useQuery({
    queryKey: ['/api/food-logs'],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: waterLogs, isLoading: waterLogsLoading } = useQuery({
    queryKey: ['/api/water-logs'],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: weightLogs, isLoading: weightLogsLoading } = useQuery({
    queryKey: ['/api/weight-logs'],
    enabled: isAuthenticated,
    retry: false,
  });

  // Process data based on time range
  const processedData = useMemo(() => {
    if (!foodLogs || !waterLogs || !weightLogs) return null;
    
    // Ensure we have arrays to work with
    const foodLogsArray = Array.isArray(foodLogs) ? foodLogs : [];
    const waterLogsArray = Array.isArray(waterLogs) ? waterLogs : [];
    const weightLogsArray = Array.isArray(weightLogs) ? weightLogs : [];

    const now = new Date();
    const getDateRange = (range: TimeRange) => {
      const end = new Date();
      const start = new Date();
      
      switch (range) {
        case 'daily':
          start.setDate(end.getDate() - 7); // Last 7 days
          break;
        case 'weekly':
          start.setDate(end.getDate() - 30); // Last 30 days
          break;
        case 'monthly':
          start.setMonth(end.getMonth() - 6); // Last 6 months
          break;
      }
      return { start, end };
    };

    const { start, end } = getDateRange(timeRange);

    // Filter data by date range
    const filteredFoodLogs = foodLogsArray.filter((log: any) => {
      const logDate = new Date(log.date);
      return logDate >= start && logDate <= end;
    });

    const filteredWaterLogs = waterLogsArray.filter((log: any) => {
      const logDate = new Date(log.date);
      return logDate >= start && logDate <= end;
    });

    const filteredWeightLogs = weightLogsArray.filter((log: any) => {
      const logDate = new Date(log.loggedAt);
      return logDate >= start && logDate <= end;
    });

    // Calculate metrics
    const totalCalories = filteredFoodLogs.reduce((sum: number, log: any) => 
      sum + (parseFloat(log.calories) || 0), 0);
    
    const totalWater = filteredWaterLogs.reduce((sum: number, log: any) => 
      sum + (parseFloat(log.amount) || 0), 0);

    const averageCaloriesPerDay = filteredFoodLogs.length > 0 ? 
      totalCalories / Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))) : 0;

    const averageWaterPerDay = filteredWaterLogs.length > 0 ?
      totalWater / Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))) : 0;

    // Weight progress
    const weightChange = filteredWeightLogs.length >= 2 ? 
      parseFloat(filteredWeightLogs[0]?.weight || '0') - parseFloat(filteredWeightLogs[filteredWeightLogs.length - 1]?.weight || '0') : 0;

    // Meal distribution
    const mealDistribution = filteredFoodLogs.reduce((acc: any, log: any) => {
      acc[log.mealType] = (acc[log.mealType] || 0) + (parseFloat(log.calories) || 0);
      return acc;
    }, {});

    return {
      totalCalories,
      totalWater,
      averageCaloriesPerDay,
      averageWaterPerDay,
      weightChange,
      mealDistribution,
      filteredFoodLogs,
      filteredWaterLogs,
      filteredWeightLogs,
      daysInRange: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    };
  }, [foodLogs, waterLogs, weightLogs, timeRange]);

  const handleExportReport = () => {
    if (!processedData) return;

    const reportData = {
      user: {
        name: `${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`.trim(),
        email: (user as any)?.email,
      },
      period: timeRange,
      dateRange: `${new Date().toLocaleDateString()} (${timeRange})`,
      metrics: {
        totalCalories: processedData.totalCalories,
        averageCaloriesPerDay: Math.round(processedData.averageCaloriesPerDay),
        totalWater: processedData.totalWater,
        averageWaterPerDay: Math.round(processedData.averageWaterPerDay * 10) / 10,
        weightChange: Math.round(processedData.weightChange * 10) / 10,
        mealDistribution: processedData.mealDistribution,
      },
      logsCount: {
        foodLogs: processedData.filteredFoodLogs.length,
        waterLogs: processedData.filteredWaterLogs.length,
        weightLogs: processedData.filteredWeightLogs.length,
      }
    };

    // PDF export using jsPDF
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('NutriCare++ Health Report', 10, 15);
    doc.setFontSize(12);
    doc.text(`Name: ${reportData.user.name}`, 10, 30);
    doc.text(`Email: ${reportData.user.email}`, 10, 38);
    doc.text(`Period: ${reportData.period}`, 10, 46);
    doc.text(`Date Range: ${reportData.dateRange}`, 10, 54);
    doc.text('---', 10, 60);
    doc.text('Metrics:', 10, 68);
    doc.text(`Total Calories: ${reportData.metrics.totalCalories}`, 10, 76);
    doc.text(`Avg Calories/Day: ${reportData.metrics.averageCaloriesPerDay}`, 10, 84);
    doc.text(`Total Water: ${reportData.metrics.totalWater} glasses`, 10, 92);
    doc.text(`Avg Water/Day: ${reportData.metrics.averageWaterPerDay} glasses`, 10, 100);
    doc.text(`Weight Change: ${reportData.metrics.weightChange} kg`, 10, 108);
    doc.text('Meal Distribution:', 10, 116);
    let y = 124;
    Object.entries(reportData.metrics.mealDistribution).forEach(([meal, cal]: any) => {
      doc.text(`${meal}: ${cal} cal`, 14, y);
      y += 8;
    });
    y += 4;
    doc.text('Logs Count:', 10, y);
    y += 8;
    doc.text(`Food Logs: ${reportData.logsCount.foodLogs}`, 14, y);
    y += 8;
    doc.text(`Water Logs: ${reportData.logsCount.waterLogs}`, 14, y);
    y += 8;
    doc.text(`Weight Logs: ${reportData.logsCount.weightLogs}`, 14, y);

    doc.save(`nutricare-report-${timeRange}-${new Date().toISOString().split('T')[0]}.pdf`);

    toast({
      title: "Success",
      description: "Report exported as PDF!",
    });
  };

  const getMealTypeColor = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return 'bg-orange-500';
      case 'lunch': return 'bg-yellow-500';
      case 'dinner': return 'bg-purple-500';
      case 'snack': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getMealTypeIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return 'fa-sun';
      case 'lunch': return 'fa-sun';
      case 'dinner': return 'fa-moon';
      case 'snack': return 'fa-apple-alt';
      default: return 'fa-utensils';
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const isDataLoading = foodLogsLoading || waterLogsLoading || weightLogsLoading;

  return (
    <Layout showSidebar={true}>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Health Reports</h1>
            <p className="text-gray-600 dark:text-gray-400">Track your nutrition and health progress over time</p>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Last 7 Days</SelectItem>
                <SelectItem value="weekly">Last 30 Days</SelectItem>
                <SelectItem value="monthly">Last 6 Months</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={handleExportReport}
              disabled={!processedData}
              className="bg-nutricare-green hover:bg-nutricare-dark"
            >
              <i className="fas fa-download mr-2"></i>
              Export Report
            </Button>
          </div>
        </div>

        {isDataLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nutricare-green"></div>
          </div>
        ) : !processedData ? (
          <div className="text-center py-12">
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <i className="fas fa-chart-bar text-gray-400 text-2xl"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Data Available</h3>
            <p className="text-gray-500 dark:text-gray-400">Start logging your meals and activities to see your reports.</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                    <i className="fas fa-fire text-red-500 mr-2"></i>
                    Total Calories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.round(processedData.totalCalories).toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {Math.round(processedData.averageCaloriesPerDay)}/day average
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                    <i className="fas fa-tint text-blue-500 mr-2"></i>
                    Total Water
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.round(processedData.totalWater)} glasses
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(processedData.averageWaterPerDay).toFixed(1)}/day average
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                    <i className="fas fa-weight text-nutricare-green mr-2"></i>
                    Weight Change
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${processedData.weightChange < 0 ? 'text-green-600' : processedData.weightChange > 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                    {processedData.weightChange > 0 ? '+' : ''}{processedData.weightChange.toFixed(1)} kg
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Over {processedData.daysInRange} days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                    <i className="fas fa-utensils text-purple-500 mr-2"></i>
                    Meals Logged
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {processedData.filteredFoodLogs.length}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {Math.round(processedData.filteredFoodLogs.length / processedData.daysInRange * 10) / 10}/day average
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
                <TabsTrigger value="detailed">Detailed</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Meal Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {Object.keys(processedData.mealDistribution).length > 0 ? (
                        <div className="space-y-4">
                          {Object.entries(processedData.mealDistribution).map(([mealType, calories]) => (
                            <div key={mealType}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center">
                                  <div className={`p-2 ${getMealTypeColor(mealType)} rounded-full mr-3`}>
                                    <i className={`fas ${getMealTypeIcon(mealType)} text-white text-sm`}></i>
                                  </div>
                                  <span className="font-medium capitalize">{mealType}</span>
                                </div>
                                <span className="text-sm font-semibold">{Math.round(calories as number)} cal</span>
                              </div>
                              <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${getMealTypeColor(mealType)}`}
                                  style={{ width: `${Math.min(100, ((calories as number) / Math.max(processedData.totalCalories, 1)) * 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-8">No meal data available</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Health Metrics Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full mr-3">
                            <i className="fas fa-check text-green-500"></i>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Consistency Score</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Based on daily logging</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            {Math.round((processedData.filteredFoodLogs.length / processedData.daysInRange) * 100)}%
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full mr-3">
                            <i className="fas fa-tint text-blue-500"></i>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Hydration Goal</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Daily target: 8 glasses</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${processedData.averageWaterPerDay >= 8 ? 'text-green-600' : 'text-yellow-600'}`}>
                            {Math.round((processedData.averageWaterPerDay / 8) * 100)}%
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-full mr-3">
                            <i className="fas fa-bullseye text-purple-500"></i>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Calorie Goal</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Daily target: 2000 cal</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${Math.abs(processedData.averageCaloriesPerDay - 2000) <= 200 ? 'text-green-600' : 'text-yellow-600'}`}>
                            {Math.round((processedData.averageCaloriesPerDay / 2000) * 100)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Nutrition Tab */}
              <TabsContent value="nutrition">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Calorie Intake Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Total Calories</span>
                          <span className="text-lg font-bold">{Math.round(processedData.totalCalories).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Daily Average</span>
                          <span className="text-lg font-bold">{Math.round(processedData.averageCaloriesPerDay)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">vs. Recommended (2000)</span>
                          <span className={`text-lg font-bold ${processedData.averageCaloriesPerDay > 2000 ? 'text-red-600' : processedData.averageCaloriesPerDay < 1500 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {processedData.averageCaloriesPerDay > 2000 ? '+' : ''}{Math.round(processedData.averageCaloriesPerDay - 2000)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Hydration Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Total Water</span>
                          <span className="text-lg font-bold">{Math.round(processedData.totalWater)} glasses</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Daily Average</span>
                          <span className="text-lg font-bold">{processedData.averageWaterPerDay.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">vs. Recommended (8)</span>
                          <span className={`text-lg font-bold ${processedData.averageWaterPerDay >= 8 ? 'text-green-600' : 'text-yellow-600'}`}>
                            {processedData.averageWaterPerDay >= 8 ? '+' : ''}{(processedData.averageWaterPerDay - 8).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Progress Tab */}
              <TabsContent value="progress">
                <div className="grid grid-cols-1 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Weight Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {processedData.filteredWeightLogs.length > 0 ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Starting Weight</p>
                              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {parseFloat(processedData.filteredWeightLogs[processedData.filteredWeightLogs.length - 1]?.weight || '0').toFixed(1)} kg
                              </p>
                            </div>
                            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Weight</p>
                              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {parseFloat(processedData.filteredWeightLogs[0]?.weight || '0').toFixed(1)} kg
                              </p>
                            </div>
                            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Change</p>
                              <p className={`text-2xl font-bold ${processedData.weightChange < 0 ? 'text-green-600' : processedData.weightChange > 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                                {processedData.weightChange > 0 ? '+' : ''}{processedData.weightChange.toFixed(1)} kg
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-6">
                            <h4 className="text-lg font-semibold mb-4">Recent Weight Entries</h4>
                            <div className="space-y-3">
                              {processedData.filteredWeightLogs.slice(0, 5).map((log: any) => (
                                <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{parseFloat(log.weight).toFixed(1)} kg</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {new Date(log.loggedAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                  {log.bmi && (
                                    <div className="text-right">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">BMI: {parseFloat(log.bmi).toFixed(1)}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-8">No weight data available for this period</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Detailed Tab */}
              <TabsContent value="detailed">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Detailed Food Log</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {processedData.filteredFoodLogs.length > 0 ? (
                        <div className="space-y-3">
                          {processedData.filteredFoodLogs.slice(0, 20).map((log: any) => (
                            <div key={log.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className={`p-2 ${getMealTypeColor(log.mealType)} rounded-full`}>
                                  <i className={`fas ${getMealTypeIcon(log.mealType)} text-white text-sm`}></i>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white capitalize">{log.mealType}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {parseFloat(log.quantity).toFixed(0)}g
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {Math.round(parseFloat(log.calories))} cal
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(log.loggedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))}
                          {processedData.filteredFoodLogs.length > 20 && (
                            <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
                              ... and {processedData.filteredFoodLogs.length - 20} more entries
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-8">No food logs available for this period</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Water Intake Log</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {processedData.filteredWaterLogs.length > 0 ? (
                        <div className="space-y-3">
                          {processedData.filteredWaterLogs.slice(0, 15).map((log: any) => (
                            <div key={log.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-500 rounded-full">
                                  <i className="fas fa-tint text-white text-sm"></i>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">Water Intake</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {parseFloat(log.amount)} glasses
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(log.loggedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))}
                          {processedData.filteredWaterLogs.length > 15 && (
                            <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
                              ... and {processedData.filteredWaterLogs.length - 15} more entries
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-8">No water logs available for this period</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </Layout>
  );
}
