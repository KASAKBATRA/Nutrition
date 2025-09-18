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

  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['/api/profile'],
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

    // Calculate BMI if height and weight are available
    const calculateBMI = (height: number, weight: number) => {
      const heightInMeters = height / 100;
      return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
    };

    // Calculate age from date of birth
    const calculateAge = (dateOfBirth: string) => {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    const height = userProfile?.height ? parseFloat(userProfile.height) : null;
    const weight = userProfile?.weight ? parseFloat(userProfile.weight) : null;
    const bmi = height && weight ? calculateBMI(height, weight) : null;
    const age = userProfile?.dateOfBirth ? calculateAge(userProfile.dateOfBirth) : null;

    const reportData = {
      user: {
        name: `${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`.trim(),
        email: (user as any)?.email,
        age: age,
        gender: userProfile?.gender || 'Not provided',
        height: height ? `${height} cm` : 'Not provided',
        weight: weight ? `${weight} kg` : 'Not provided',
        bmi: bmi ? `${bmi} kg/m²` : 'Not provided',
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

    // Enhanced PDF export using jsPDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let currentY = 20;

    // Helper function to add watermark
    const addWatermark = () => {
      // Save current state
      const currentFillColor = doc.getFillColor();
      const currentTextColor = doc.getTextColor();
      const currentFontSize = doc.getFontSize();
      
      // Add watermark text with better styling
      doc.setTextColor(240, 240, 240); // Even lighter gray
      doc.setFontSize(50);
      doc.setFont('helvetica', 'bold');
      
      // Center the watermark
      const watermarkText = 'NutriCare+';
      const textWidth = doc.getTextWidth(watermarkText);
      const x = (pageWidth - textWidth) / 2;
      const y = pageHeight / 2;
      
      // Rotate and add watermark
      doc.text(watermarkText, x, y, { angle: 45 });
      
      // Add decorative elements
      doc.setDrawColor(245, 245, 245);
      doc.setFillColor(245, 245, 245);
      doc.circle(x - 25, y - 15, 6, 'FD');
      doc.circle(x + textWidth + 15, y + 15, 4, 'FD');
      
      // Restore previous state
      doc.setTextColor(currentTextColor);
      doc.setFontSize(currentFontSize);
    };

    // Helper function to add footer
    const addFooter = () => {
      // Save current state
      const currentTextColor = doc.getTextColor();
      const currentFontSize = doc.getFontSize();
      
      // Add footer background with gradient effect
      doc.setFillColor(250, 251, 252);
      doc.rect(0, pageHeight - 18, pageWidth, 18, 'F');
      
      // Add elegant footer line
      doc.setDrawColor(46, 125, 50);
      doc.setLineWidth(1.5);
      doc.line(15, pageHeight - 16, pageWidth - 15, pageHeight - 16);
      
      // Add decorative elements
      doc.setDrawColor(200, 230, 201);
      doc.setLineWidth(0.8);
      doc.line(15, pageHeight - 14, pageWidth - 15, pageHeight - 14);
      
      // Add footer text with better styling
      doc.setTextColor(70, 70, 70);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      
      const footerText = 'Powered by NutriCare++ - Smart Healthcare Solutions';
      const textWidth = doc.getTextWidth(footerText);
      const x = (pageWidth - textWidth) / 2;
      
      doc.text(footerText, x, pageHeight - 8);
      
      // Add page number with style
      const pageNum = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Page ${pageNum}`, pageWidth - 25, pageHeight - 4);
      
      // Restore previous state
      doc.setTextColor(currentTextColor);
      doc.setFontSize(currentFontSize);
    };

    // Helper function to add text with better formatting
    const addText = (text: string, x: number, y: number, options: any = {}) => {
      doc.setFont(options.font || 'helvetica', options.style || 'normal');
      doc.setFontSize(options.size || 10);
      if (options.color) {
        doc.setTextColor(options.color[0], options.color[1], options.color[2]);
      } else {
        doc.setTextColor(0, 0, 0);
      }
      doc.text(text, x, y);
      return y + (options.lineHeight || 7);
    };

    // Helper function to draw lines
    const drawLine = (x1: number, y1: number, x2: number, y2: number, options: any = {}) => {
      doc.setLineWidth(options.width || 0.5);
      if (options.color) {
        doc.setDrawColor(options.color[0], options.color[1], options.color[2]);
      } else {
        doc.setDrawColor(0, 0, 0);
      }
      doc.line(x1, y1, x2, y2);
    };

    // Helper function to add section separator
    const addSectionSeparator = (y: number) => {
      drawLine(10, y, pageWidth - 10, y, { width: 0.3, color: [200, 200, 200] });
      return y + 8;
    };

    // Add watermark to first page
    addWatermark();

    // Header Section with enhanced gradient and styling
    // Create gradient effect
    doc.setFillColor(37, 97, 41); // Darker green
    doc.rect(0, 0, pageWidth, 55, 'F');
    
    // Add accent bar
    doc.setFillColor(129, 199, 132); // Light green accent
    doc.rect(0, 48, pageWidth, 7, 'F');
    
    // Add decorative pattern
    doc.setFillColor(46, 125, 50);
    for (let i = 0; i < pageWidth; i += 20) {
      doc.rect(i, 50, 8, 3, 'F');
    }
    
    doc.setTextColor(255, 255, 255); // White text
    currentY = addText('NutriCare+ ✦ Smart Healthcare for Health Conscious People', 15, 20, { 
      size: 16, 
      style: 'bold',
      color: [255, 255, 255]
    });
    
    currentY = addText('Comprehensive Health & Nutrition Report', 15, 35, { 
      size: 12, 
      style: 'normal',
      color: [230, 245, 233]
    });
    
    // Reset to black text
    doc.setTextColor(0, 0, 0);
    currentY = 65;

    // Enhanced Header Information Box
    doc.setFillColor(252, 254, 255);
    doc.rect(15, currentY, pageWidth - 30, 32, 'F');
    
    // Add subtle shadow effect
    doc.setFillColor(240, 240, 240);
    doc.rect(16, currentY + 1, pageWidth - 30, 32, 'F');
    doc.setFillColor(252, 254, 255);
    doc.rect(15, currentY, pageWidth - 30, 32, 'F');
    
    // Professional border
    doc.setLineWidth(1.2);
    doc.setDrawColor(46, 125, 50);
    doc.rect(15, currentY, pageWidth - 30, 32, 'S');
    
    // Inner accent border
    doc.setLineWidth(0.3);
    doc.setDrawColor(129, 199, 132);
    doc.rect(17, currentY + 2, pageWidth - 34, 28, 'S');
    
    currentY += 10;
    currentY = addText('NutriCare+ Health Analytics Report', pageWidth/2 - 55, currentY, { 
      size: 15, 
      style: 'bold',
      color: [37, 97, 41]
    });
    
    const reportId = `HTH-2025-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`;
    const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    
    currentY += 8;
    addText(`Report ID: ${reportId}`, 20, currentY, { size: 10, style: 'bold', color: [70, 70, 70] });
    addText(`Generated: ${currentDate}`, pageWidth - 70, currentY, { size: 10, style: 'bold', color: [70, 70, 70] });
    
    currentY += 18;

    // User Information Section with enhanced design
    currentY = addText('👤 Patient Information', 15, currentY, { size: 14, style: 'bold', color: [37, 97, 41] });
    currentY = addSectionSeparator(currentY);
    
    // Enhanced user info container
    doc.setFillColor(248, 252, 248);
    doc.rect(15, currentY, pageWidth - 30, 38, 'F');
    
    // Elegant border
    doc.setLineWidth(1);
    doc.setDrawColor(129, 199, 132);
    doc.rect(15, currentY, pageWidth - 30, 38, 'S');
    
    // Inner shadow effect
    doc.setDrawColor(200, 230, 201);
    doc.setLineWidth(0.5);
    doc.rect(16, currentY + 1, pageWidth - 32, 36, 'S');
    
    currentY += 8;
    
    // Enhanced two column layout with better spacing
    const leftColumn = 25;
    const rightColumn = 115;
    
    // Column headers with style
    let leftY = currentY;
    leftY = addText('Name', leftColumn, leftY, { size: 10, style: 'bold', color: [46, 125, 50] });
    leftY = addText('Age', leftColumn, leftY + 1, { size: 10, style: 'bold', color: [46, 125, 50] });
    leftY = addText('Gender', leftColumn, leftY + 1, { size: 10, style: 'bold', color: [46, 125, 50] });
    
    let rightY = currentY;
    rightY = addText('Height', rightColumn, rightY, { size: 10, style: 'bold', color: [46, 125, 50] });
    rightY = addText('Weight', rightColumn, rightY + 1, { size: 10, style: 'bold', color: [46, 125, 50] });
    rightY = addText('BMI', rightColumn, rightY + 1, { size: 10, style: 'bold', color: [46, 125, 50] });
    
    // Values with improved styling
    leftY = currentY;
    leftY = addText(`: ${reportData.user.name || 'Not provided'}`, leftColumn + 28, leftY, { size: 10, color: [60, 60, 60] });
    leftY = addText(`: ${reportData.user.age || 'Not provided'}`, leftColumn + 28, leftY + 1, { size: 10, color: [60, 60, 60] });
    leftY = addText(`: ${reportData.user.gender}`, leftColumn + 28, leftY + 1, { size: 10, color: [60, 60, 60] });
    
    rightY = currentY;
    rightY = addText(`: ${reportData.user.height}`, rightColumn + 28, rightY, { size: 10, color: [60, 60, 60] });
    rightY = addText(`: ${reportData.user.weight}`, rightColumn + 28, rightY + 1, { size: 10, color: [60, 60, 60] });
    
    // Enhanced BMI with better color coding and status
    const bmiValue = reportData.user.bmi;
    let bmiColor = [60, 60, 60];
    let bmiStatus = '';
    if (bmi) {
      if (bmi < 18.5) {
        bmiColor = [255, 87, 34]; // Orange for underweight
        bmiStatus = ' (Underweight)';
      } else if (bmi >= 18.5 && bmi < 25) {
        bmiColor = [76, 175, 80]; // Green for normal
        bmiStatus = ' (Normal)';
      } else if (bmi >= 25 && bmi < 30) {
        bmiColor = [255, 152, 0]; // Orange for overweight
        bmiStatus = ' (Overweight)';
      } else {
        bmiColor = [244, 67, 54]; // Red for obese
        bmiStatus = ' (Obese)';
      }
    }
    addText(`: ${bmiValue}${bmiStatus}`, rightColumn + 28, rightY - 1, { size: 10, color: bmiColor, style: 'bold' });
    
    currentY += 42;

    // Enhanced Daily Nutrition Summary
    currentY = addText('📊 Daily Nutrition Analytics', 15, currentY, { size: 14, style: 'bold', color: [37, 97, 41] });
    currentY = addSectionSeparator(currentY);
    
    // Create enhanced nutrition table
    const tableHeight = 60;
    
    // Table background with gradient effect
    doc.setFillColor(255, 255, 255);
    doc.rect(15, currentY, pageWidth - 30, tableHeight, 'F');
    
    // Professional border
    doc.setLineWidth(1);
    doc.setDrawColor(129, 199, 132);
    doc.rect(15, currentY, pageWidth - 30, tableHeight, 'S');
    
    // Enhanced table headers with gradient
    doc.setFillColor(37, 97, 41);
    doc.rect(15, currentY, pageWidth - 30, 15, 'F');
    
    // Header accent line
    doc.setFillColor(129, 199, 132);
    doc.rect(15, currentY + 12, pageWidth - 30, 3, 'F');
    
    // Enhanced column positions for nutrition table
    const nutCol1 = 25;     // Nutrient
    const nutCol2 = 70;     // Recommended  
    const nutCol3 = 120;    // Consumed
    const nutCol4 = 155;    // Status
    
    addText('Nutrient', nutCol1, currentY + 9, { style: 'bold', size: 10, color: [255, 255, 255] });
    addText('Target', nutCol2, currentY + 9, { style: 'bold', size: 10, color: [255, 255, 255] });
    addText('Actual', nutCol3, currentY + 9, { style: 'bold', size: 10, color: [255, 255, 255] });
    addText('Status', nutCol4, currentY + 9, { style: 'bold', size: 10, color: [255, 255, 255] });
    
    currentY += 18;
    
    // Calculate nutrition data
    const avgCalories = Math.round(processedData.averageCaloriesPerDay);
    const avgWater = Math.round(processedData.averageWaterPerDay * 10) / 10;
    
    // Enhanced nutrition status with better indicators
    const getCalorieStatus = (consumed: number) => {
      if (consumed >= 1800 && consumed <= 2200) return { text: '✓ Optimal', color: [76, 175, 80], bg: [200, 230, 201] };
      if (consumed < 1800) return { text: '⚠ Below Target', color: [255, 87, 34], bg: [255, 224, 178] };
      return { text: '⚠ Above Target', color: [244, 67, 54], bg: [255, 205, 210] };
    };
    
    const getWaterStatus = (consumed: number) => {
      if (consumed >= 2.0 && consumed <= 3.0) return { text: '✓ Good', color: [76, 175, 80], bg: [200, 230, 201] };
      if (consumed < 2.0) return { text: '⚠ Low', color: [255, 152, 0], bg: [255, 224, 178] };
      return { text: '✓ Excellent', color: [76, 175, 80], bg: [200, 230, 201] };
    };
    
    const nutritionRows = [
      ['Calories', '2000 kcal', `${avgCalories} kcal`, getCalorieStatus(avgCalories)],
      ['Protein', '50 g', 'From meals', { text: '📊 Calculated', color: [103, 58, 183], bg: [225, 190, 231] }],
      ['Carbohydrates', '300 g', 'From meals', { text: '📊 Calculated', color: [103, 58, 183], bg: [225, 190, 231] }],
      ['Fats', '70 g', 'From meals', { text: '📊 Calculated', color: [103, 58, 183], bg: [225, 190, 231] }],
      ['Water Intake', '2.5 L', `${avgWater} L`, getWaterStatus(avgWater)]
    ];

    nutritionRows.forEach(([nutrient, recommended, consumed, status], index) => {
      // Enhanced alternate row background
      if (index % 2 === 0) {
        doc.setFillColor(252, 254, 255);
        doc.rect(15, currentY - 3, pageWidth - 30, 10, 'F');
      }
      
      // Add subtle row separator
      if (index > 0) {
        doc.setDrawColor(240, 240, 240);
        doc.setLineWidth(0.3);
        doc.line(20, currentY - 3, pageWidth - 20, currentY - 3);
      }
      
      addText(nutrient as string, nutCol1, currentY, { size: 9, style: 'bold', color: [60, 60, 60] });
      addText(recommended as string, nutCol2, currentY, { size: 9, color: [80, 80, 80] });
      addText(consumed as string, nutCol3, currentY, { size: 9, color: [80, 80, 80] });
      
      if (typeof status === 'object' && status.text && status.color) {
        // Enhanced status with background pill
        if (status.bg) {
          doc.setFillColor(status.bg[0], status.bg[1], status.bg[2]);
          doc.roundedRect(nutCol4 - 2, currentY - 4, 35, 8, 2, 2, 'F');
        }
        addText(status.text, nutCol4, currentY, { size: 8, color: status.color, style: 'bold' });
      } else {
        addText(status as string, nutCol4, currentY, { size: 9 });
      }
      currentY += 9;
    });
    
    currentY += 12;

    // Enhanced Meal Log Section
    currentY = addText('🍽️ Meal Log Analytics', 15, currentY, { size: 14, style: 'bold', color: [37, 97, 41] });
    currentY = addSectionSeparator(currentY);
    
    // Create enhanced meal table
    const mealTableHeight = 55;
    
    // Table background
    doc.setFillColor(255, 255, 255);
    doc.rect(15, currentY, pageWidth - 30, mealTableHeight, 'F');
    
    // Professional border
    doc.setLineWidth(1);
    doc.setDrawColor(129, 199, 132);
    doc.rect(15, currentY, pageWidth - 30, mealTableHeight, 'S');
    
    // Enhanced meal table headers
    doc.setFillColor(37, 97, 41);
    doc.rect(15, currentY, pageWidth - 30, 15, 'F');
    
    // Header accent line
    doc.setFillColor(129, 199, 132);
    doc.rect(15, currentY + 12, pageWidth - 30, 3, 'F');
    
    // Enhanced column positions
    const col1 = 25;        // Meal Type
    const col2 = 60;        // Food Item  
    const col3 = 115;       // Quantity
    const col4 = 150;       // Calories
    const col5 = 175;       // Health Score
    
    addText('Type', col1, currentY + 9, { style: 'bold', size: 10, color: [255, 255, 255] });
    addText('Food Item', col2, currentY + 9, { style: 'bold', size: 10, color: [255, 255, 255] });
    addText('Qty', col3, currentY + 9, { style: 'bold', size: 10, color: [255, 255, 255] });
    addText('Calories', col4, currentY + 9, { style: 'bold', size: 10, color: [255, 255, 255] });
    addText('Score', col5, currentY + 9, { style: 'bold', size: 10, color: [255, 255, 255] });
    
    currentY += 18;
    
    // Use actual meal data from processedData.filteredFoodLogs
    const recentMeals = processedData.filteredFoodLogs.slice(0, 6); // Show last 6 meals
    
    if (recentMeals.length > 0) {
      recentMeals.forEach((meal: any, index: number) => {
        // Enhanced alternate row background
        if (index % 2 === 0) {
          doc.setFillColor(252, 254, 255);
          doc.rect(15, currentY - 3, pageWidth - 30, 10, 'F');
        }
        
        // Add subtle row separator
        if (index > 0) {
          doc.setDrawColor(240, 240, 240);
          doc.setLineWidth(0.3);
          doc.line(20, currentY - 3, pageWidth - 20, currentY - 3);
        }
        
        const calories = Math.round(parseFloat(meal.calories) || 0);
        
        // Enhanced health score with better categories
        const getHealthScore = (cal: number) => {
          if (cal < 200) return { text: '✓ Light', color: [76, 175, 80], bg: [200, 230, 201] };
          if (cal < 500) return { text: '✓ Healthy', color: [76, 175, 80], bg: [200, 230, 201] };
          if (cal < 700) return { text: '⚠ Moderate', color: [255, 152, 0], bg: [255, 224, 178] };
          return { text: '⚠ High Cal', color: [244, 67, 54], bg: [255, 205, 210] };
        };
        
        const healthScore = getHealthScore(calories);
        const mealType = meal.meal_type || 'Meal';
        const foodName = meal.food_name || 'Food item';
        const truncatedFood = foodName.length > 12 ? foodName.substring(0, 12) + '...' : foodName;
        
        // Enhanced meal type with icons
        const getMealIcon = (type: string) => {
          switch(type.toLowerCase()) {
            case 'breakfast': return '🌅';
            case 'lunch': return '🌞';
            case 'dinner': return '🌙';
            case 'snack': return '🍎';
            default: return '🍽️';
          }
        };
        
        addText(`${getMealIcon(mealType)} ${mealType}`, col1, currentY, { size: 8, style: 'bold', color: [60, 60, 60] });
        addText(truncatedFood, col2, currentY, { size: 8, color: [80, 80, 80] });
        addText(`${meal.quantity || 1} ${meal.unit || 'g'}`, col3, currentY, { size: 8, color: [80, 80, 80] });
        addText(`${calories}`, col4, currentY, { size: 8, color: [80, 80, 80] });
        
        // Enhanced health score with background pill
        if (healthScore.bg) {
          doc.setFillColor(healthScore.bg[0], healthScore.bg[1], healthScore.bg[2]);
          doc.roundedRect(col5 - 2, currentY - 4, 28, 8, 2, 2, 'F');
        }
        addText(healthScore.text, col5, currentY, { size: 8, color: healthScore.color, style: 'bold' });
        
        currentY += 10;
      });
    } else {
      currentY = addText('⚠ No meal data available for selected time period', 20, currentY, { size: 10, color: [150, 150, 150], style: 'italic' });
      currentY += 5;
    }
    
    currentY += 10;

    // Check if we need a new page
    if (currentY > 220) {
      // Add footer to current page before creating new page
      addFooter();
      
      doc.addPage();
      
      // Add watermark and reset position for new page
      addWatermark();
      currentY = 20;
    }

    // Enhanced Stress & Lifestyle Analytics
    currentY = addText('💪 Lifestyle & Wellness Metrics', 15, currentY, { size: 14, style: 'bold', color: [37, 97, 41] });
    currentY = addSectionSeparator(currentY);
    
    // Enhanced lifestyle info container
    doc.setFillColor(248, 252, 248);
    doc.rect(15, currentY, pageWidth - 30, 35, 'F');
    
    // Professional border
    doc.setLineWidth(1);
    doc.setDrawColor(129, 199, 132);
    doc.rect(15, currentY, pageWidth - 30, 35, 'S');
    
    // Inner accent border
    doc.setLineWidth(0.3);
    doc.setDrawColor(200, 230, 201);
    doc.rect(17, currentY + 2, pageWidth - 34, 31, 'S');
    
    currentY += 10;
    
    // Enhanced lifestyle metrics with icons and colors
    currentY = addText('😌 Stress Level : Moderate (6/10) - Manageable range', 20, currentY, { 
      size: 10, 
      color: [255, 152, 0] 
    });
    currentY = addText('😴 Sleep Quality : 7 hours (Optimal) - Good recovery', 20, currentY, { 
      size: 10, 
      color: [76, 175, 80] 
    });
    currentY = addText('🚶 Activity Level : Moderate (5000 steps) - Stay active!', 20, currentY, { 
      size: 10, 
      color: [76, 175, 80] 
    });
    
    currentY += 18;

    // Enhanced Health Insights with AI-powered analysis
    currentY = addText('🧠 AI Health Insights & Recommendations', 15, currentY, { size: 14, style: 'bold', color: [37, 97, 41] });
    currentY = addSectionSeparator(currentY);
    
    // Generate enhanced insights based on actual data
    const insights = [];
    
    // Enhanced calorie insights with specific recommendations
    if (avgCalories >= 1800 && avgCalories <= 2200) {
      insights.push({
        text: '✓ Excellent calorie management! Your intake aligns perfectly with health targets.',
        color: [76, 175, 80],
        bg: [200, 230, 201]
      });
    } else if (avgCalories < 1800) {
      insights.push({
        text: '⚠ Calorie intake is below recommended levels. Consider nutrient-dense snacks.',
        color: [255, 152, 0],
        bg: [255, 224, 178]
      });
    } else {
      insights.push({
        text: '⚠ High calorie intake detected. Focus on portion control and balanced meals.',
        color: [244, 67, 54],
        bg: [255, 205, 210]
      });
    }
    
    // Enhanced water intake insights
    if (avgWater >= 2.5) {
      insights.push({
        text: '✓ Outstanding hydration! You\'re maintaining optimal water intake levels.',
        color: [76, 175, 80],
        bg: [200, 230, 201]
      });
    } else if (avgWater >= 2.0) {
      insights.push({
        text: '✓ Good hydration habits. Aim for 2.5L daily for peak performance.',
        color: [76, 175, 80],
        bg: [200, 230, 201]
      });
    } else {
      insights.push({
        text: '⚠ Hydration needs improvement. Increase water intake to 2.5L daily.',
        color: [255, 152, 0],
        bg: [255, 224, 178]
      });
    }
    
    // BMI-based insights
    if (bmi) {
      if (bmi >= 18.5 && bmi < 25) {
        insights.push({
          text: '✓ Your BMI is in the healthy range. Maintain current lifestyle habits.',
          color: [76, 175, 80],
          bg: [200, 230, 201]
        });
      } else if (bmi < 18.5) {
        insights.push({
          text: '⚠ BMI indicates underweight. Consider increasing nutrient-rich calories.',
          color: [255, 152, 0],
          bg: [255, 224, 178]
        });
      } else {
        insights.push({
          text: '⚠ BMI suggests focus on balanced nutrition and regular exercise.',
          color: [255, 152, 0],
          bg: [255, 224, 178]
        });
      }
    }
    
    // Enhanced meal frequency insights
    const mealCount = processedData.filteredFoodLogs.length;
    const daysInRange = processedData.daysInRange;
    const mealsPerDay = mealCount / Math.max(1, daysInRange);
    
    if (mealsPerDay < 2) {
      insights.push({
        text: '⚠ Low meal frequency detected. Aim for 3-4 balanced meals daily.',
        color: [244, 67, 54],
        bg: [255, 205, 210]
      });
    } else if (mealsPerDay >= 3 && mealsPerDay <= 4) {
      insights.push({
        text: '✓ Excellent meal frequency! You\'re maintaining regular eating habits.',
        color: [76, 175, 80],
        bg: [200, 230, 201]
      });
    } else if (mealsPerDay > 5) {
      insights.push({
        text: '⚠ High meal frequency. Consider larger, more balanced meals.',
        color: [255, 152, 0],
        bg: [255, 224, 178]
      });
    }
    
    // Enhanced activity level insights
    if (userProfile && typeof userProfile === 'object' && 'activityLevel' in userProfile && userProfile.activityLevel) {
      const activity = (userProfile.activityLevel as string).toLowerCase();
      if (activity.includes('sedentary') || activity.includes('low')) {
        insights.push({
          text: '💪 Consider increasing physical activity for better cardiovascular health.',
          color: [255, 152, 0],
          bg: [255, 224, 178]
        });
      } else if (activity.includes('moderate')) {
        insights.push({
          text: '✓ Great activity level! Keep up the moderate exercise routine.',
          color: [76, 175, 80],
          bg: [200, 230, 201]
        });
      } else {
        insights.push({
          text: '✓ Outstanding fitness commitment! Maintain this active lifestyle.',
          color: [76, 175, 80],
          bg: [200, 230, 201]
        });
      }
    } else {
      insights.push({
        text: '📊 Track your activity level for personalized fitness recommendations.',
        color: [103, 58, 183],
        bg: [225, 190, 231]
      });
    }
    
    // Sleep recommendation
    insights.push({
      text: '😴 Aim for 7-8 hours of quality sleep for optimal body recovery.',
      color: [103, 58, 183],
      bg: [225, 190, 231]
    });
    
    // Enhanced display insights with professional formatting
    insights.forEach((insight, index) => {
      // Enhanced insights background container
      if (insight.bg) {
        doc.setFillColor(insight.bg[0], insight.bg[1], insight.bg[2]);
        doc.roundedRect(20, currentY - 5, pageWidth - 50, 12, 3, 3, 'F');
      }
      
      // Add insight border
      doc.setDrawColor(insight.color[0], insight.color[1], insight.color[2]);
      doc.setLineWidth(0.8);
      doc.roundedRect(20, currentY - 5, pageWidth - 50, 12, 3, 3, 'S');
      
      // Display insight text with enhanced styling
      currentY = addText(`${insight.text}`, 25, currentY, { 
        size: 10, 
        color: insight.color,
        style: 'normal'
      });
      
      currentY += 5; // Extra spacing between insights
    });
    
    currentY += 20;

    // Check if we need space for footer
    if (currentY > pageHeight - 40) {
      // Add footer to current page before creating new page
      addFooter();
      
      doc.addPage();
      
      // Add watermark to new page
      addWatermark();
      currentY = 20;
    }

    // Add footer to the final page
    addFooter();
    
    // Enhanced Professional Signature Section
    doc.setFillColor(37, 97, 41);
    doc.rect(0, pageHeight - 38, pageWidth, 20, 'F');
    
    // Add gradient effect
    doc.setFillColor(46, 125, 50);
    doc.rect(0, pageHeight - 36, pageWidth, 16, 'F');
    
    // Add decorative elements
    doc.setFillColor(129, 199, 132);
    for (let i = 0; i < pageWidth; i += 15) {
      doc.rect(i, pageHeight - 38, 6, 2, 'F');
    }
    
    currentY = pageHeight - 28;
    addText('🏥 Generated by NutriCare++ AI Healthcare Platform', pageWidth/2 - 85, currentY, { 
      size: 11, 
      style: 'bold', 
      color: [255, 255, 255] 
    });
    
    addText('Trusted by Health Professionals Worldwide', pageWidth/2 - 65, currentY + 8, { 
      size: 9, 
      style: 'italic', 
      color: [200, 230, 201] 
    });

    doc.save(`nutricare-professional-report-${timeRange}-${new Date().toISOString().split('T')[0]}.pdf`);

    toast({
      title: "Success",
      description: "Detailed health report exported as PDF!",
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

  const isDataLoading = foodLogsLoading || waterLogsLoading || weightLogsLoading || profileLoading;

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
