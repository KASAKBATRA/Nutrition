interface UserData {
  gender: string;
  age: number;
  weight: number; // in kg
  height: number; // in cm
  activityLevel: string;
  goal?: string; // weight loss, maintenance, gain
}

interface NutritionRequirements {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fats: number; // grams
  fiber: number; // grams
  water: number; // glasses
  micronutrients: {
    iron?: number; // mg
    calcium?: number; // mg
    vitaminD?: number; // mcg
    folate?: number; // mcg
    zinc?: number; // mg
    magnesium?: number; // mg
    potassium?: number; // mg
    vitaminB12?: number; // mcg
  };
}

// Activity level multipliers
const activityMultipliers = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  super_active: 1.9
};

// Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
function calculateBMR(gender: string, weight: number, height: number, age: number): number {
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    // female or other
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
}

// Calculate Total Daily Energy Expenditure (TDEE)
function calculateTDEE(bmr: number, activityLevel: string): number {
  const multiplier = activityMultipliers[activityLevel as keyof typeof activityMultipliers] || 1.2;
  return bmr * multiplier;
}

// Get gender-specific micronutrient requirements
function getMicronutrientRequirements(gender: string, age: number): NutritionRequirements['micronutrients'] {
  if (gender === 'female') {
    return {
      iron: age <= 50 ? 18 : 8, // Higher for menstruating women
      calcium: age <= 50 ? 1000 : 1200,
      vitaminD: 15,
      folate: 400, // mcg DFE
      zinc: 8,
      magnesium: age <= 30 ? 310 : 320,
      potassium: 2600,
      vitaminB12: 2.4
    };
  } else {
    // male or other
    return {
      iron: 8,
      calcium: age <= 50 ? 1000 : 1200,
      vitaminD: 15,
      folate: 400,
      zinc: 11, // Higher for males
      magnesium: age <= 30 ? 400 : 420, // Higher for males
      potassium: 3400, // Higher for males
      vitaminB12: 2.4
    };
  }
}

export function calculateNutritionRequirements(userData: UserData): NutritionRequirements {
  const { gender, age, weight, height, activityLevel, goal } = userData;
  
  // Calculate BMR and TDEE
  const bmr = calculateBMR(gender, weight, height, age);
  let tdee = calculateTDEE(bmr, activityLevel);
  
  // Adjust calories based on goal
  let targetCalories = tdee;
  if (goal === 'weight_loss') {
    targetCalories = tdee - 500; // 500 calorie deficit for ~1 lb/week loss
  } else if (goal === 'weight_gain') {
    targetCalories = tdee + 500; // 500 calorie surplus for ~1 lb/week gain
  }
  
  // Gender-specific adjustments
  if (gender === 'female') {
    // Slightly lower calorie needs on average
    targetCalories = Math.max(targetCalories, 1200); // Minimum safe calories for women
  } else {
    // Male
    targetCalories = Math.max(targetCalories, 1500); // Minimum safe calories for men
  }
  
  // Calculate macronutrient distribution
  let proteinPercentage, carbsPercentage, fatsPercentage;
  
  if (gender === 'male') {
    // Male macronutrient distribution
    proteinPercentage = 0.25; // 25% - higher for muscle maintenance
    carbsPercentage = 0.45;   // 45%
    fatsPercentage = 0.30;    // 30%
  } else {
    // Female macronutrient distribution
    proteinPercentage = 0.20; // 20%
    carbsPercentage = 0.45;   // 45%
    fatsPercentage = 0.35;    // 35% - higher healthy fats for hormone balance
  }
  
  // Calculate macronutrients in grams
  const proteinGrams = (targetCalories * proteinPercentage) / 4; // 4 cal/gram
  const carbsGrams = (targetCalories * carbsPercentage) / 4;     // 4 cal/gram
  const fatsGrams = (targetCalories * fatsPercentage) / 9;       // 9 cal/gram
  
  // Calculate fiber (gender-specific)
  const fiberGrams = gender === 'male' ? 38 : 25; // Men need more fiber
  
  // Calculate water intake (gender-specific)
  const waterGlasses = gender === 'male' ? 12 : 9; // Men need more water
  
  // Get micronutrient requirements
  const micronutrients = getMicronutrientRequirements(gender, age);
  
  return {
    calories: Math.round(targetCalories),
    protein: Math.round(proteinGrams),
    carbs: Math.round(carbsGrams),
    fats: Math.round(fatsGrams),
    fiber: fiberGrams,
    water: waterGlasses,
    micronutrients
  };
}

// Get gender-specific nutrition tips
export function getGenderSpecificTips(gender: string): string[] {
  if (gender === 'male') {
    return [
      "🏋️‍♂️ Focus on protein intake (1.2-1.6g/kg) for muscle maintenance and growth",
      "🥩 Include zinc-rich foods like meat, beans, and nuts for testosterone support",
      "💪 Consume adequate magnesium and potassium for muscle and heart health",
      "⚡ Ensure sufficient B12 for energy and metabolism",
      "🥗 Aim for 38g of fiber daily for digestive health",
      "💧 Drink 12+ glasses of water daily due to higher muscle mass"
    ];
  } else {
    return [
      "🩸 Prioritize iron-rich foods like spinach, lentils, and lean meat",
      "🦴 Include calcium and Vitamin D for bone health and osteoporosis prevention",
      "🤰 Ensure adequate folic acid (B9) for reproductive health and cell repair",
      "🌰 Focus on healthy fats (30-35%) for hormone balance",
      "🥛 Aim for 1000-1200mg calcium daily through dairy or fortified alternatives",
      "💧 Drink 9+ glasses of water daily for optimal hydration"
    ];
  }
}

// Get gender-specific food recommendations
export function getGenderSpecificFoods(gender: string): { recommended: string[], focus: string[] } {
  if (gender === 'male') {
    return {
      recommended: [
        "Lean meats and poultry",
        "Fish and seafood",
        "Nuts and seeds",
        "Whole grains",
        "Dark leafy greens",
        "Beans and legumes"
      ],
      focus: [
        "Zinc-rich foods (oysters, beef, pumpkin seeds)",
        "Magnesium sources (almonds, spinach, avocado)",
        "Potassium-rich foods (bananas, potatoes, tomatoes)",
        "B12 sources (fish, meat, fortified cereals)"
      ]
    };
  } else {
    return {
      recommended: [
        "Iron-rich vegetables (spinach, kale)",
        "Lean proteins (chicken, fish, tofu)",
        "Dairy or fortified alternatives",
        "Colorful fruits and vegetables",
        "Healthy fats (avocado, olive oil, nuts)",
        "Whole grains"
      ],
      focus: [
        "Iron sources (lentils, quinoa, dark chocolate)",
        "Calcium-rich foods (yogurt, cheese, broccoli)",
        "Folate sources (asparagus, citrus, fortified grains)",
        "Healthy fats for hormones (salmon, walnuts, chia seeds)"
      ]
    };
  }
}