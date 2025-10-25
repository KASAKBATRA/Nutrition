import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { FloatingElements } from '@/components/FloatingElements';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';

const calibrationSchema = z.object({
  spoon: z.number().min(1, 'Spoon weight must be at least 1g').max(50, 'Spoon weight too large'),
  bowl: z.number().min(1, 'Bowl weight must be at least 1g').max(1000, 'Bowl weight too large'),
  cup: z.number().min(1, 'Cup volume must be at least 1ml').max(1000, 'Cup volume too large'),
  skipCalibration: z.boolean().optional(),
});

type CalibrationForm = z.infer<typeof calibrationSchema>;

export default function Calibration() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CalibrationForm>({
    resolver: zodResolver(calibrationSchema),
    defaultValues: {
      spoon: 5,
      bowl: 150,
      cup: 240,
      skipCalibration: false,
    },
  });

  const skipCalibration = form.watch('skipCalibration');

  const onSubmit = async (data: CalibrationForm) => {
    setIsLoading(true);
    try {
      const calibrationData = [
        { utensilType: 'spoon', gramsPerUnit: data.spoon },
        { utensilType: 'bowl', gramsPerUnit: data.bowl },
        { utensilType: 'cup', gramsPerUnit: data.cup },
      ];

      const response = await fetch('/api/calibration/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ calibrationData }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save calibration');
      }

      toast({
        title: "Calibration Saved!",
        description: data.skipCalibration
          ? "Default values will be used for your meal tracking."
          : "Your calorie calculations will now be personalized.",
      });

      // Redirect to dashboard
      setLocation('/');
    } catch (error: any) {
      toast({
        title: "Calibration Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-nutricare-green/10 via-white to-nutricare-light/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <FloatingElements />

      <div className="w-full max-w-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-nutricare-green to-nutricare-light rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-utensils text-white text-3xl"></i>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-nutricare-green to-nutricare-forest bg-clip-text text-transparent">
            Personalize Your Measurements
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Calibrate your utensils for accurate meal tracking
          </p>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8">
          <div className="mb-6">
            <div className="bg-gradient-to-r from-nutricare-green/10 to-nutricare-light/10 border-l-4 border-nutricare-green rounded-lg p-4">
              <h3 className="font-semibold text-nutricare-forest dark:text-nutricare-light mb-2">
                Why Calibrate?
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Different utensils hold different amounts. By measuring your utensils once,
                we can provide more accurate calorie and nutrition calculations for all your meals.
              </p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="spoon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <i className="fas fa-spoon text-nutricare-green"></i>
                      Spoon (grams)
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="5"
                        disabled={skipCalibration}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        className="text-lg"
                      />
                    </FormControl>
                    <FormDescription>
                      Fill your spoon with rice or sugar and weigh it
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bowl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <i className="fas fa-bowl-food text-nutricare-green"></i>
                      Bowl (grams)
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="150"
                        disabled={skipCalibration}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        className="text-lg"
                      />
                    </FormControl>
                    <FormDescription>
                      Fill your bowl with a typical serving and weigh it
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <i className="fas fa-mug-hot text-nutricare-green"></i>
                      Cup (ml)
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="240"
                        disabled={skipCalibration}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        className="text-lg"
                      />
                    </FormControl>
                    <FormDescription>
                      Measure your cup capacity in milliliters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="skipCalibration"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-gray-200 dark:border-gray-700 p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Skip calibration for now
                      </FormLabel>
                      <FormDescription>
                        Use default WHO/USDA standard values (you can recalibrate later from settings)
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-nutricare-green hover:bg-nutricare-dark text-white py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 h-12"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  'Save Calibration & Continue'
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <i className="fas fa-info-circle mr-1"></i>
                Default values: Spoon = 5g, Bowl = 150g, Cup = 240ml
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
