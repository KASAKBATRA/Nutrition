import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/context/LanguageContext';

// Form validation schema
const addMealSchema = z.object({
  mealName: z.string().min(1, "Meal name is required"),
  quantity: z.number().positive("Quantity must be positive"),
  unit: z.enum(["grams", "ml", "cups", "pieces", "oz", "tbsp", "tsp"]),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
});

type AddMealFormData = z.infer<typeof addMealSchema>;

interface MealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMealAdded?: () => void;
  editingMeal?: any;
}

interface FoodSearchResult {
  food_name: string;
  serving_unit: string;
  serving_qty: number;
  photo: {
    thumb: string;
  };
}

interface NutritionResponse {
  message: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export function MealModal({ isOpen, onClose, onMealAdded, editingMeal }: MealModalProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null);
  const [nutritionResult, setNutritionResult] = useState<NutritionResponse['nutrition'] | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    trigger,
  } = useForm<AddMealFormData>({
    resolver: zodResolver(addMealSchema),
    defaultValues: {
      quantity: 1,
      unit: "grams",
      mealType: "snack",
    },
  });

  // Pre-fill form when editing
  useEffect(() => {
    console.log('MealModal editingMeal changed:', editingMeal);
    if (editingMeal) {
      setValue('mealName', editingMeal.food_name);
      setValue('quantity', editingMeal.quantity);
      setValue('unit', editingMeal.unit);
      setValue('mealType', editingMeal.meal_type);
      setSearchQuery(editingMeal.food_name);
    } else {
      reset({
        quantity: 1,
        unit: "grams",
        mealType: "snack",
      });
      setSearchQuery('');
      setSelectedFood(null);
      setNutritionResult(null);
    }
  }, [editingMeal, setValue, reset]);

  // Food search query
  const { data: searchResults } = useQuery({
    queryKey: ['/api/food-search', searchQuery],
    enabled: searchQuery.length >= 2,
    queryFn: async () => {
      const response = await fetch(`/api/food-search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
  });

  // Add/Update meal mutation
  const addMealMutation = useMutation({
    mutationFn: async (data: AddMealFormData) => {
      const url = editingMeal ? `/api/food-logs/${editingMeal.id}` : '/api/add-meal';
      const method = editingMeal ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to ${editingMeal ? 'update' : 'add'} meal`);
      }
      return response.json();
    },
    onSuccess: (data: NutritionResponse) => {
      setNutritionResult(data.nutrition);
      toast({
        title: editingMeal ? "Meal Updated Successfully!" : "Meal Added Successfully!",
        description: `${data.nutrition.calories} calories logged`,
      });
      
      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['/api/food-logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/daily-log'] });
      
      if (onMealAdded) onMealAdded();
      
      // Keep modal open to show nutrition info for a moment, then close
      setTimeout(() => {
        handleClose();
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    reset();
    setSearchQuery('');
    setSelectedFood(null);
    setNutritionResult(null);
    setIsSearchOpen(false);
    onClose();
  };

  const onSubmit = (data: AddMealFormData) => {
    addMealMutation.mutate(data);
  };

  const handleFoodSelect = (food: FoodSearchResult) => {
    setSelectedFood(food);
    setValue('mealName', food.food_name);
    setValue('quantity', food.serving_qty);
    setValue('unit', food.serving_unit as any);
    setIsSearchOpen(false);
    trigger(['mealName', 'quantity', 'unit']);
  };

  const unitOptions = [
    { value: "grams", label: "Grams" },
    { value: "ml", label: "Milliliters" },
    { value: "cups", label: "Cups" },
    { value: "pieces", label: "Pieces" },
    { value: "oz", label: "Ounces" },
    { value: "tbsp", label: "Tablespoons" },
    { value: "tsp", label: "Teaspoons" },
  ];

  const mealTypeOptions = [
    { value: "breakfast", label: "Breakfast", icon: "☀️" },
    { value: "lunch", label: "Lunch", icon: "🌞" },
    { value: "dinner", label: "Dinner", icon: "🌙" },
    { value: "snack", label: "Snack", icon: "🍎" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <i className="fas fa-utensils text-nutricare-green"></i>
            {editingMeal ? 'Edit Meal' : 'Add Meal'}
          </DialogTitle>
        </DialogHeader>

        {nutritionResult ? (
          // Show nutrition results after successful submission
          <div className="space-y-4 text-center">
            <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-green-500 rounded-full">
                  <i className="fas fa-check text-white text-xl"></i>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Meal Logged Successfully!
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400">Calories</p>
                  <p className="text-xl font-bold text-nutricare-green">{nutritionResult.calories}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400">Protein</p>
                  <p className="text-xl font-bold text-blue-500">{nutritionResult.protein}g</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400">Carbs</p>
                  <p className="text-xl font-bold text-orange-500">{nutritionResult.carbs}g</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400">Fat</p>
                  <p className="text-xl font-bold text-purple-500">{nutritionResult.fat}g</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Show meal logging form
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Food Name with Search */}
            <div className="space-y-2">
              <Label htmlFor="mealName">Food Name</Label>
              <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                <PopoverTrigger asChild>
                  <div className="relative">
                    <Input
                      {...register('mealName')}
                      placeholder="Search for food (e.g., banana, rice, chicken)"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setValue('mealName', e.target.value);
                        if (e.target.value.length >= 2) {
                          setIsSearchOpen(true);
                        }
                      }}
                      className="pr-10"
                    />
                    <i className="fas fa-search absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <Command>
                    <CommandList>
                      {searchResults?.common?.length === 0 && searchQuery.length >= 2 && (
                        <CommandEmpty>No foods found. Try a different search term.</CommandEmpty>
                      )}
                      {searchResults?.common?.length > 0 && (
                        <CommandGroup heading="Suggested Foods">
                          {searchResults.common.slice(0, 8).map((food: FoodSearchResult, index: number) => (
                            <CommandItem
                              key={index}
                              onSelect={() => handleFoodSelect(food)}
                              className="flex items-center gap-3 cursor-pointer"
                            >
                              <img 
                                src={food.photo.thumb} 
                                alt={food.food_name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              <div>
                                <p className="font-medium capitalize">{food.food_name}</p>
                                <p className="text-sm text-gray-500">
                                  {food.serving_qty} {food.serving_unit}
                                </p>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.mealName && (
                <p className="text-sm text-red-500">{errors.mealName.message}</p>
              )}
            </div>

            {/* Quantity and Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  {...register('quantity', { valueAsNumber: true })}
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="1"
                />
                {errors.quantity && (
                  <p className="text-sm text-red-500">{errors.quantity.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select onValueChange={(value) => setValue('unit', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.unit && (
                  <p className="text-sm text-red-500">{errors.unit.message}</p>
                )}
              </div>
            </div>

            {/* Meal Type */}
            <div className="space-y-2">
              <Label htmlFor="mealType">Meal Type</Label>
              <Select onValueChange={(value) => setValue('mealType', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select meal type" />
                </SelectTrigger>
                <SelectContent>
                  {mealTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="flex items-center gap-2">
                        <span>{option.icon}</span>
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.mealType && (
                <p className="text-sm text-red-500">{errors.mealType.message}</p>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-nutricare-green hover:bg-nutricare-dark"
                disabled={addMealMutation.isPending}
              >
                {addMealMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Adding...
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus mr-2"></i>
                    Add Meal
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}