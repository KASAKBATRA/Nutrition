import React from 'react';

interface MicronutrientCardProps {
  name: string;
  current: number;
  target: number;
  unit: string;
  icon: string;
  color: string;
  description: string;
}

export function MicronutrientCard({ 
  name, 
  current, 
  target, 
  unit, 
  icon, 
  color, 
  description 
}: MicronutrientCardProps) {
  const progress = Math.min((current / target) * 100, 100);
  const isLow = progress < 70;
  const isGood = progress >= 70 && progress < 90;
  const isExcellent = progress >= 90;

  const getStatusColor = () => {
    if (isLow) return 'text-red-500';
    if (isGood) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusText = () => {
    if (isLow) return 'Low';
    if (isGood) return 'Good';
    return 'Excellent';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <i className={`fas ${icon} ${color}`}></i>
          <span className="font-medium text-gray-900 dark:text-white text-sm">{name}</span>
        </div>
        <span className={`text-xs font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>
      
      <div className="mb-2">
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>{current.toFixed(1)}{unit}</span>
          <span>{target}{unit}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              isLow ? 'bg-red-500' : isGood ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      
      <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );
}

interface GenderSpecificMicronutrientsProps {
  gender: string;
  age: number;
  currentIntake?: {
    iron?: number;
    calcium?: number;
    vitaminD?: number;
    folate?: number;
    zinc?: number;
    magnesium?: number;
    potassium?: number;
    vitaminB12?: number;
  };
}

export function GenderSpecificMicronutrients({ 
  gender, 
  age, 
  currentIntake = {} 
}: GenderSpecificMicronutrientsProps) {
  // Get gender-specific requirements (from our nutrition calculator)
  const getRequirements = () => {
    if (gender === 'female') {
      return {
        iron: { target: age <= 50 ? 18 : 8, icon: 'fa-tint', color: 'text-red-500', description: 'Essential for blood health and energy' },
        calcium: { target: age <= 50 ? 1000 : 1200, icon: 'fa-bone', color: 'text-gray-500', description: 'Supports bone health and prevents osteoporosis' },
        vitaminD: { target: 15, icon: 'fa-sun', color: 'text-yellow-500', description: 'Helps calcium absorption and bone health' },
        folate: { target: 400, icon: 'fa-leaf', color: 'text-green-500', description: 'Important for reproductive health and cell repair' }
      };
    } else {
      return {
        zinc: { target: 11, icon: 'fa-shield-alt', color: 'text-blue-500', description: 'Supports testosterone and immune function' },
        magnesium: { target: age <= 30 ? 400 : 420, icon: 'fa-heart', color: 'text-purple-500', description: 'Essential for muscle and heart health' },
        potassium: { target: 3400, icon: 'fa-bolt', color: 'text-orange-500', description: 'Supports muscle function and blood pressure' },
        vitaminB12: { target: 2.4, icon: 'fa-battery-full', color: 'text-indigo-500', description: 'Boosts energy and metabolism' }
      };
    }
  };

  const requirements = getRequirements();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <i className={`fas ${gender === 'male' ? 'fa-mars text-blue-500' : 'fa-venus text-pink-500'} mr-2`}></i>
        {gender === 'male' ? 'Male' : 'Female'} Key Nutrients
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(requirements).map(([nutrient, data]) => (
          <MicronutrientCard
            key={nutrient}
            name={nutrient.charAt(0).toUpperCase() + nutrient.slice(1)}
            current={currentIntake[nutrient as keyof typeof currentIntake] || 0}
            target={data.target}
            unit={nutrient === 'potassium' || nutrient === 'calcium' ? 'mg' : nutrient === 'vitaminD' || nutrient === 'folate' || nutrient === 'vitaminB12' ? 'mcg' : 'mg'}
            icon={data.icon}
            color={data.color}
            description={data.description}
          />
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-gradient-to-r from-nutricare-green/10 to-nutricare-light/10 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <i className="fas fa-info-circle text-nutricare-green mr-1"></i>
          Track your {gender === 'male' ? 'male-specific' : 'female-specific'} nutrients to optimize your health and wellness goals.
        </p>
      </div>
    </div>
  );
}