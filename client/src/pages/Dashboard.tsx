
import React, { useEffect, useState, ChangeEvent, useRef } from 'react';
import Tesseract from 'tesseract.js';

// Simple nutrition facts parser (expand as needed)
function parseNutritionFacts(text: string) {
  const getVal = (label: string, regex: RegExp) => {
    const match = text.match(regex);
    return match ? parseFloat(match[1]) : undefined;
  };
  return {
    calories: getVal('calories', /calories[^\d]*(\d+)/i),
    sugar: getVal('sugar', /sugar[^\d]*(\d+)/i),
    fat: getVal('fat', /fat[^\d]*(\d+)/i),
    protein: getVal('protein', /protein[^\d]*(\d+)/i),
    sodium: getVal('sodium', /sodium[^\d]*(\d+)/i),
    fiber: getVal('fiber', /fiber[^\d]*(\d+)/i),
  };
}

// Simple health classification rules
function classifyHealth(facts: any) {
  if (!facts) return { status: 'Unknown', explanation: 'Could not extract nutrition facts.' };
  if (facts.sugar && facts.sugar > 10) return { status: 'Unhealthy', explanation: `High sugar (${facts.sugar}g per serving)` };
  if (facts.sodium && facts.sodium > 400) return { status: 'Unhealthy', explanation: `High sodium (${facts.sodium}mg per serving)` };
  if (facts.protein && facts.protein > 5 && facts.fat && facts.fat < 5 && facts.fiber && facts.fiber > 3)
    return { status: 'Healthy', explanation: 'High protein, low fat, fiber rich' };
  return { status: 'Moderate', explanation: 'No major red flags detected.' };
}

// Handle file upload
// (Removed duplicate handleLabelImageChange to avoid redeclaration error)

// --- API Response Types ---
interface Meal {
  id: string;
  mealName: string;
  mealType: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  loggedAt: string;
}

interface DailyNutrition {
  meals: Meal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalWater: number;
}

interface WeightLog {
  weight: number;
  bmi: number;
  createdAt: string;
}

interface CommunityPostUser {
  firstName: string;
  lastName: string;
}

interface CommunityPost {
  user: CommunityPostUser;
  createdAt: string;
  imageUrl?: string;
  content: string;
  likesCount: number;
  commentsCount: number;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  nutritionist: string;
}

interface Friend {
  id: string;
  name: string;
}
import { useLocation } from 'wouter';
import { Layout } from '@/components/Layout';
import { MealModal } from '@/components/MealModal';
import { WaterModal } from '@/components/WaterModal';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isUnauthorizedError } from '@/lib/authUtils';
import { apiRequest } from '@/lib/queryClient';
import { calculateNutritionRequirements, getGenderSpecificTips, getGenderSpecificFoods } from '@/lib/nutritionCalculator';
import { GenderSpecificMicronutrients } from '@/components/GenderSpecificMicronutrients';

export default function Dashboard() {
  // OCR and Health Classification State (must be inside component)
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [labelImage, setLabelImage] = useState<File | null>(null);
  const [ocrText, setOcrText] = useState<string>('');
  const [nutritionFacts, setNutritionFacts] = useState<any>(null);
  const [healthResult, setHealthResult] = useState<{ status: string; explanation: string } | null>(null);

  // Open file picker when Scan Food Label is clicked
  const handleScanFoodLabelClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  // Suggest alternatives based on food type or unhealthy result
  const [alternatives, setAlternatives] = useState<string[]>([]);

  // OCR and classification logic
  const handleLabelImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLabelImage(file);
      setOcrText('');
      setNutritionFacts(null);
      setHealthResult(null);
      setAlternatives([]);

      // OCR with Tesseract.js
      const { data: { text } } = await Tesseract.recognize(file, 'eng');
      setOcrText(text);

      // Parse nutrition facts from OCR text
      const facts = parseNutritionFacts(text);
      setNutritionFacts(facts);

      // Classify healthiness
      const result = classifyHealth(facts);
      setHealthResult(result);

      // Suggest alternatives (simple keyword-based)
      const lowerText = text.toLowerCase();
      let alt: string[] = [];
      if (lowerText.includes('chips') || lowerText.includes('lays')) {
        alt = ['Roasted chickpeas', 'Baked veggie chips', 'Air-popped popcorn', 'Roasted makhana', 'Homemade sweet potato chips'];
      } else if (lowerText.includes('cola') || lowerText.includes('soda')) {
        alt = ['Sparkling water with lemon', 'Coconut water', 'Fresh lime soda (unsweetened)', 'Infused water', 'Buttermilk (chaas)'];
      } else if (lowerText.includes('chocolate')) {
        alt = ['Dark chocolate (70%+)', 'Roasted nuts', 'Fruit & nut bars', 'Dates stuffed with nuts'];
      } else if (lowerText.includes('biscuit') || lowerText.includes('cookie')) {
        alt = ['Oats cookies', 'Whole wheat crackers', 'Homemade granola bars', 'Khakhra'];
      } else if (lowerText.includes('namkeen') || lowerText.includes('mixture')) {
        alt = ['Roasted chana', 'Bhel with sprouts', 'Murmura (puffed rice) snack', 'Roasted peanuts'];
      }
      if (result.status === 'Unhealthy' && alt.length === 0) {
        alt = ['Fresh fruits', 'Roasted nuts', 'Homemade snacks', 'Yogurt with seeds', 'Vegetable sticks with hummus'];
      }
      setAlternatives(alt);
    }
  };
  // Define a User type with at least firstName property
  interface User {
    firstName?: string;
    lastName?: string;
    // add other properties as needed
  }
  const { user, isAuthenticated, isLoading } = useAuth() as { user: User; isAuthenticated: boolean; isLoading: boolean };
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [isWaterModalOpen, setIsWaterModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<any>(null);
  const queryClient = useQueryClient();

  // Delete meal mutation
  const deleteMealMutation = useMutation({
    mutationFn: async (mealId: string) => {
      const response = await fetch(`/api/food-logs/${mealId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to delete meal');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/daily-log'] });
      queryClient.invalidateQueries({ queryKey: ['/api/food-logs'] });
      toast({
        title: "Success",
        description: "Meal deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete meal",
        variant: "destructive",
      });
    },
  });

  const handleDeleteMeal = (mealId: string, mealName: string) => {
    if (confirm(`Are you sure you want to delete "${mealName}"?`)) {
      deleteMealMutation.mutate(mealId);
    }
  };

  const handleEditMeal = (meal: any) => {
    console.log('Edit button clicked for meal:', meal);
    setEditingMeal(meal);
    setIsMealModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsMealModalOpen(false);
    setEditingMeal(null);
  };

  const [, setLocation] = useLocation();
  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
      return;
    }
  }, [isAuthenticated, isLoading, setLocation]);

  


  const { data: foodLogs } = useQuery<Meal[]>({
    queryKey: ['/api/food-logs'],
    enabled: isAuthenticated,
    retry: false,
  });

  // Get daily nutrition summary with enhanced data
  const { data: dailyNutrition } = useQuery<DailyNutrition>({
    queryKey: ['/api/daily-log'],
    enabled: isAuthenticated,
    retry: false,
  });

  // Example: Add similar types to other queries if needed
  // const { data: weightLogs } = useQuery<WeightLog[]>({ ... });
  // const { data: communityPosts } = useQuery<CommunityPost[]>({ ... });
  // const { data: appointments } = useQuery<Appointment[]>({ ... });
  // const { data: friends } = useQuery<Friend[]>({ ... });

  const { data: waterLogs } = useQuery({
    queryKey: ['/api/water-logs'],
    enabled: isAuthenticated,
    retry: false,
  });

  // Get user profile for nutrition calculations
  const { data: userProfile } = useQuery({
    queryKey: ['/api/user/profile'],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: weightLogs } = useQuery<WeightLog[]>({
    queryKey: ['/api/weight-logs'],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: communityPosts } = useQuery<CommunityPost[]>({
    queryKey: ['/api/community/posts'],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: appointments } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments'],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: friends } = useQuery<Friend[]>({
    queryKey: ['/api/friends'],
    enabled: isAuthenticated,
    retry: false,
  });

  // Calculate daily totals using enhanced nutrition data
  const todayFoodLogs = dailyNutrition?.meals || [];
  
  const todayWaterLogs = (Array.isArray(waterLogs) ? waterLogs : []).filter((log: any) => {
    const logDate = new Date(log.date);
    const today = new Date();
    return logDate.toDateString() === today.toDateString();
  });

  // Use enhanced nutrition data from daily-log endpoint
  const totalCalories = dailyNutrition?.totalCalories || 0;
  const totalProtein = dailyNutrition?.totalProtein || 0;
  const totalCarbs = dailyNutrition?.totalCarbs || 0;
  const totalFat = dailyNutrition?.totalFat || 0;
  const totalWater = todayWaterLogs.reduce((sum: number, log: any) => sum + (parseFloat(log.amount) || 0), 0);
  const latestWeight = weightLogs?.[0]?.weight || 0;
  const latestBMI = weightLogs?.[0]?.bmi || 0;

  // Calculate gender-specific nutrition requirements
  const getUserNutritionRequirements = () => {
    if (!user || !userProfile) {
      // Fallback to sensible default user data so we also get micronutrient targets
      const defaultUser = {
        gender: 'female',
        age: 30,
        weight: 70,
        height: 170,
        activityLevel: 'moderately_active',
        goal: 'maintenance'
      } as any;

      return calculateNutritionRequirements(defaultUser);
    }

    const userData = {
      gender: (user as any)?.gender || (userProfile as any)?.gender || 'female',
      age: (user as any)?.age || new Date().getFullYear() - new Date((userProfile as any)?.dateOfBirth || '1990-01-01').getFullYear() || 25,
      weight: parseFloat((userProfile as any)?.weight?.toString() || latestWeight?.toString() || '70'),
      height: parseFloat((userProfile as any)?.height?.toString() || '170'),
      activityLevel: (userProfile as any)?.activityLevel || 'moderately_active',
      goal: (userProfile as any)?.healthGoals || 'maintenance'
    };

    return calculateNutritionRequirements(userData);
  };

  const nutritionRequirements = getUserNutritionRequirements();
  
  // Nutrition goals based on gender and profile
  const calorieGoal = nutritionRequirements.calories;
  const proteinGoal = nutritionRequirements.protein;
  const carbsGoal = nutritionRequirements.carbs;
  const fatGoal = nutritionRequirements.fats;
  const waterGoal = nutritionRequirements.water;
  
  // Progress calculations
  const calorieProgress = Math.min((totalCalories / calorieGoal) * 100, 100);
  const proteinProgress = Math.min((totalProtein / proteinGoal) * 100, 100);
  const carbsProgress = Math.min((totalCarbs / carbsGoal) * 100, 100);
  const fatProgress = Math.min((totalFat / fatGoal) * 100, 100);
  const waterProgress = Math.min((totalWater / waterGoal) * 100, 100);

  // Calculate estimated micronutrients based on consumed food
  const calculateMicronutrients = () => {
    const meals = dailyNutrition?.meals || [];
    
    // Simple estimation based on common food types and portions
    // This is a basic approximation - in a real app, you'd have a comprehensive food database
    let estimatedIron = 0;
    let estimatedCalcium = 0;
    let estimatedZinc = 0;
    let estimatedMagnesium = 0;
    let estimatedPotassium = 0;
    let estimatedVitaminB12 = 0;
    
    meals.forEach((meal: any) => {
      const mealName = meal.mealName?.toLowerCase() || '';
      const quantity = parseFloat(meal.quantity) || 1;
      
      // Basic estimation based on meal names and types
      if (mealName.includes('spinach') || mealName.includes('meat') || mealName.includes('chicken')) {
        estimatedIron += quantity * 2.5; // mg per serving
      }
      if (mealName.includes('milk') || mealName.includes('cheese') || mealName.includes('yogurt')) {
        estimatedCalcium += quantity * 150; // mg per serving
        estimatedVitaminB12 += quantity * 0.5; // mcg per serving
      }
      if (mealName.includes('nuts') || mealName.includes('seeds') || mealName.includes('meat')) {
        estimatedZinc += quantity * 1.5; // mg per serving
        estimatedMagnesium += quantity * 50; // mg per serving
      }
      if (mealName.includes('banana') || mealName.includes('potato') || mealName.includes('vegetables')) {
        estimatedPotassium += quantity * 200; // mg per serving
      }
      
      // Base values for any meal (very conservative estimates)
      estimatedIron += quantity * 0.5;
      estimatedCalcium += quantity * 20;
      estimatedZinc += quantity * 0.3;
      estimatedMagnesium += quantity * 15;
      estimatedPotassium += quantity * 50;
      estimatedVitaminB12 += quantity * 0.1;
    });
    
    return {
      iron: Math.round(estimatedIron * 10) / 10,
      calcium: Math.round(estimatedCalcium),
      zinc: Math.round(estimatedZinc * 10) / 10,
      magnesium: Math.round(estimatedMagnesium),
      potassium: Math.round(estimatedPotassium),
      vitaminB12: Math.round(estimatedVitaminB12 * 10) / 10,
      vitaminD: Math.round((totalCalories / 2000) * 5 * 10) / 10, // Very rough estimate
      folate: Math.round((totalCalories / 2000) * 200) // Very rough estimate
    };
  };

  const currentMicronutrients = calculateMicronutrients();

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
        {/* Food Label Upload & OCR */}

        {/* Food Label OCR & Health Classification Modal (Glassmorphism) */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleLabelImageChange}
        />
        {labelImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            style={{ animation: 'fadeIn 0.2s' }}
          >
            <div
              className="relative w-full max-w-md mx-auto p-6 rounded-2xl shadow-2xl"
              style={{
                background: 'rgba(255,255,255,0.25)',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
            >
              <button
                className="absolute top-2 right-2 text-gray-700 bg-white/60 hover:bg-white/90 rounded-full p-1 shadow"
                onClick={() => {
                  setLabelImage(null);
                  setOcrText('');
                  setNutritionFacts(null);
                  setHealthResult(null);
                }}
                aria-label="Close"
              >
                <span className="text-lg">×</span>
              </button>
              <div className="flex flex-col items-center">
                <img src={URL.createObjectURL(labelImage)} alt="Label Preview" className="max-h-32 rounded-xl shadow mb-4 border border-white/40" />
                {healthResult && (
                  <div className="mb-2 px-4 py-2 rounded-xl font-semibold text-center text-lg"
                    style={{
                      background: healthResult.status === 'Healthy' ? 'rgba(16,185,129,0.15)' : healthResult.status === 'Unhealthy' ? 'rgba(239,68,68,0.15)' : 'rgba(253,224,71,0.15)',
                      color: healthResult.status === 'Healthy' ? '#059669' : healthResult.status === 'Unhealthy' ? '#dc2626' : '#b45309',
                    }}
                  >
                    {healthResult.status === 'Healthy' && '✅'}
                    {healthResult.status === 'Unhealthy' && '❌'}
                    {healthResult.status === 'Moderate' && '⚠️'}
                    {healthResult.status}: {healthResult.explanation}
                  </div>
                )}
                {alternatives.length > 0 && (
                  <div className="mb-2 px-4 py-2 rounded-xl bg-white/60 shadow text-sm text-gray-800">
                    <strong>Healthier Alternatives:</strong>
                    <ul className="list-disc ml-5 mt-1">
                      {alternatives.map((alt, i) => (
                        <li key={i}>{alt}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {nutritionFacts && (
                  <div className="w-full mb-2 p-2 rounded-xl bg-white/40 text-xs text-gray-800 shadow-inner">
                    <strong>Nutrition Facts:</strong>
                    <pre className="whitespace-pre-wrap">{JSON.stringify(nutritionFacts, null, 2)}</pre>
                  </div>
                )}
                {ocrText && (
                  <div className="w-full p-2 rounded-xl bg-white/30 text-xs text-gray-700 max-h-40 overflow-y-auto shadow-inner">
                    <strong>Extracted Text:</strong>
                    <pre className="whitespace-pre-wrap">{ocrText}</pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('dashboard.welcome')}, {user?.firstName || 'User'}!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{t('dashboard.journey')}</p>
        </div>

        {/* Dashboard Cards - All 5 in one row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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
            <button 
              onClick={() => setIsWaterModalOpen(true)}
              className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors duration-200 text-sm font-medium"
            >
              <i className="fas fa-plus mr-2"></i>
              Add Water
            </button>
          </div>

          {/* Protein Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <i className="fas fa-dumbbell text-blue-500 text-xl"></i>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.today')}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('dashboard.protein')}</h3>
            <div className="flex items-end space-x-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(totalProtein)}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">/ {proteinGoal}{t('units.g')}</span>
            </div>
            <div className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${proteinProgress}%` }}></div>
            </div>
          </div>

          {/* Carbs Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                <i className="fas fa-seedling text-orange-500 text-xl"></i>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.today')}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('dashboard.carbs')}</h3>
            <div className="flex items-end space-x-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(totalCarbs)}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">/ {carbsGoal}{t('units.g')}</span>
            </div>
            <div className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${carbsProgress}%` }}></div>
            </div>
          </div>

          {/* Fat Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                <i className="fas fa-tint text-purple-500 text-xl"></i>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.today')}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('dashboard.fat')}</h3>
            <div className="flex items-end space-x-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(totalFat)}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">/ {fatGoal}{t('units.g')}</span>
            </div>
            <div className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${fatProgress}%` }}></div>
            </div>
          </div>
        </div>

        {/* Gender-Specific Micronutrients - Smaller Cards */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="mr-2">{(user as any)?.gender === 'male' ? '♂️' : '♀️'}</span>
            {(user as any)?.gender === 'male' ? 'Male Key Nutrients' : 'Female Key Nutrients'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* Dynamic micronutrient cards based on gender */}
            {(() => {
              const gender = (user as any)?.gender || (userProfile as any)?.gender || 'female';
              const micronutrientRequirements = nutritionRequirements.micronutrients;
              
              if (gender === 'male') {
                return [
                  {
                    name: 'Zinc',
                    current: currentMicronutrients.zinc,
                    target: micronutrientRequirements.zinc,
                    unit: 'mg',
                    icon: '🔵',
                    color: 'blue',
                    description: 'Supports testosterone and immune function'
                  },
                  {
                    name: 'Magnesium', 
                    current: currentMicronutrients.magnesium,
                    target: micronutrientRequirements.magnesium,
                    unit: 'mg',
                    icon: '💜',
                    color: 'purple',
                    description: 'Essential for muscle and heart health'
                  },
                  {
                    name: 'Potassium',
                    current: currentMicronutrients.potassium,
                    target: micronutrientRequirements.potassium,
                    unit: 'mg',
                    icon: '⚡',
                    color: 'orange',
                    description: 'Supports muscle function and blood pressure'
                  },
                  {
                    name: 'Vitamin B12',
                    current: currentMicronutrients.vitaminB12,
                    target: micronutrientRequirements.vitaminB12,
                    unit: 'mcg',
                    icon: '💙',
                    color: 'indigo',
                    description: 'Boosts energy and metabolism'
                  }
                ];
              } else {
                return [
                  {
                    name: 'Iron',
                    current: currentMicronutrients.iron,
                    target: micronutrientRequirements.iron,
                    unit: 'mg',
                    icon: '🔴',
                    color: 'red',
                    description: 'Essential for oxygen transport'
                  },
                  {
                    name: 'Calcium',
                    current: currentMicronutrients.calcium,
                    target: micronutrientRequirements.calcium,
                    unit: 'mg',
                    icon: '🤍',
                    color: 'gray',
                    description: 'Builds strong bones and teeth'
                  },
                  {
                    name: 'Vitamin D',
                    current: currentMicronutrients.vitaminD,
                    target: micronutrientRequirements.vitaminD,
                    unit: 'IU',
                    icon: '☀️',
                    color: 'yellow',
                    description: 'Supports bone health and immunity'
                  },
                  {
                    name: 'Folate',
                    current: currentMicronutrients.folate,
                    target: micronutrientRequirements.folate,
                    unit: 'mcg',
                    icon: '💚',
                    color: 'green',
                    description: 'Important for cell division'
                  }
                ];
              }
            })().map((nutrient, index) => {
              const progress = Math.min((nutrient.current / nutrient.target) * 100, 100);
              const isLow = progress < 30;
              
              return (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg">{nutrient.icon}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${isLow ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'}`}>
                      {isLow ? 'Low' : 'Good'}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{nutrient.name}</h4>
                  <div className="flex items-end space-x-1 mb-2">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{nutrient.current}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">/ {nutrient.target}{nutrient.unit}</span>
                  </div>
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-2">
                    <div 
                      className={`bg-${nutrient.color}-500 h-1.5 rounded-full transition-all duration-300`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{nutrient.description}</p>
                </div>
              );
            })}
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
                <button 
                  onClick={() => setIsMealModalOpen(true)}
                  className="px-4 py-2 bg-nutricare-green text-white rounded-lg hover:bg-nutricare-dark transition-colors text-sm"
                >
                  <i className="fas fa-plus mr-1"></i>
                  {t('meals.add')}
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Show recent meals or empty state */}
                {todayFoodLogs.length > 0 ? (
                  todayFoodLogs.slice(0, 8).map((meal: any, index: number) => {
                    const mealTypeIcons = {
                      breakfast: { icon: 'fa-sun', color: 'bg-orange-500' },
                      lunch: { icon: 'fa-sun', color: 'bg-yellow-500' },
                      dinner: { icon: 'fa-moon', color: 'bg-purple-500' },
                      snack: { icon: 'fa-apple-alt', color: 'bg-green-500' },
                    };
                    const mealIcon = mealTypeIcons[meal.mealType as keyof typeof mealTypeIcons] || mealTypeIcons.snack;
                    
                    return (
                      <div key={meal.id} className="aspect-square p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 flex flex-col justify-between relative group">
                        {/* Action Buttons */}
                        <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => handleEditMeal(meal)}
                            className="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center"
                            disabled={deleteMealMutation.isPending}
                          >
                            <i className="fas fa-edit text-xs"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteMeal(meal.id, meal.mealName)}
                            className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center"
                            disabled={deleteMealMutation.isPending}
                          >
                            <i className="fas fa-trash text-xs"></i>
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between mb-2">
                          <div className={`p-1.5 ${mealIcon.color} rounded-full`}>
                            <i className={`fas ${mealIcon.icon} text-white text-xs`}></i>
                          </div>
                          <span className="text-xs font-bold text-gray-900 dark:text-white">{meal.calories} cal</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-gray-900 dark:text-white capitalize truncate">{meal.mealName}</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            {meal.quantity} {meal.unit}
                          </p>
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>P:{meal.protein}g</span>
                            <span>C:{meal.carbs}g</span>
                            <span>F:{meal.fat}g</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(meal.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full text-center py-8">
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <i className="fas fa-utensils text-gray-400 text-xl"></i>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">No meals logged today</p>
                    <button 
                      onClick={() => setIsMealModalOpen(true)}
                      className="px-4 py-2 bg-nutricare-green text-white rounded-lg hover:bg-nutricare-dark transition-colors"
                    >
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
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('actions.title')}</h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  className="aspect-square flex flex-col items-center justify-center p-2 bg-nutricare-green/10 hover:bg-nutricare-green/20 rounded-lg transition-colors"
                  onClick={handleScanFoodLabelClick}
                >
                  <i className="fas fa-camera-retro text-nutricare-green text-sm mb-1"></i>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">Scan</span>
                </button>
                <button
                  className="aspect-square flex flex-col items-center justify-center p-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                  onClick={() => setLocation('/appointments')}
                >
                  <i className="fas fa-calendar-plus text-blue-500 text-sm mb-1"></i>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">Book</span>
                </button>
                <button
                  className="aspect-square flex flex-col items-center justify-center p-2 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                  onClick={() => setLocation('/reports')}
                >
                  <i className="fas fa-chart-bar text-purple-500 text-sm mb-1"></i>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">Reports</span>
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

            {/* Gender-Specific Nutrition Tips */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <i className={`fas ${(user as any)?.gender === 'male' || (userProfile as any)?.gender === 'male' ? 'fa-mars text-blue-500' : 'fa-venus text-pink-500'} mr-2`}></i>
                {(user as any)?.gender === 'male' || (userProfile as any)?.gender === 'male' ? '🟢 Male Nutrition Tips' : '🟣 Female Nutrition Tips'}
              </h3>
              
              {/* Daily Goals Summary */}
              <div className="mb-4 p-3 bg-gradient-to-r from-nutricare-green/10 to-nutricare-light/10 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Your Daily Goals</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Calories:</span>
                    <span className="font-medium">{calorieGoal} kcal</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Protein:</span>
                    <span className="font-medium">{proteinGoal}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Water:</span>
                    <span className="font-medium">{waterGoal} glasses</span>
                  </div>
                </div>
              </div>

              {/* Gender-specific tips */}
              <div className="space-y-2">
                {getGenderSpecificTips((user as any)?.gender || (userProfile as any)?.gender || 'female').slice(0, 3).map((tip, index) => (
                  <div key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                    <span className="mr-2">{tip.split(' ')[0]}</span>
                    <span>{tip.split(' ').slice(1).join(' ')}</span>
                  </div>
                ))}
              </div>

              {/* Focus foods */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Focus Foods</h4>
                <div className="flex flex-wrap gap-1">
                  {getGenderSpecificFoods((user as any)?.gender || (userProfile as any)?.gender || 'female').focus.slice(0, 2).map((food, index) => (
                    <span key={index} className="text-xs px-2 py-1 bg-nutricare-green/20 text-nutricare-dark rounded-full">
                      {food.split(' (')[0]}
                    </span>
                  ))}
                </div>
              </div>
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

      {/* Meal Modal */}
      <MealModal 
        isOpen={isMealModalOpen}
        onClose={() => {
          setIsMealModalOpen(false);
          setEditingMeal(null);
        }}
        onMealAdded={() => {
          // Refresh the food logs data when a meal is added
          // The modal will handle the query invalidation
        }}
        editingMeal={editingMeal}
      />

      {/* Water Modal */}
      <WaterModal
        isOpen={isWaterModalOpen}
        onClose={() => setIsWaterModalOpen(false)}
      />
    </Layout>
  );
}
