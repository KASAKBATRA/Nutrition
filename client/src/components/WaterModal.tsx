import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface WaterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WaterModal({ isOpen, onClose }: WaterModalProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('1');

  const addWaterMutation = useMutation({
    mutationFn: async (waterData: { amount: number; date: string }) => {
      const response = await apiRequest('POST', '/api/water-logs', waterData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/water-logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/daily-log'] });
      toast({
        title: "Success",
        description: "Water intake logged successfully!",
      });
      handleClose();
    },
    onError: (error: any) => {
      console.error('Error adding water log:', error);
      toast({
        title: "Error",
        description: "Failed to log water intake. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setAmount('1');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const waterAmount = parseFloat(amount);
    if (isNaN(waterAmount) || waterAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount of water.",
        variant: "destructive",
      });
      return;
    }

    const today = new Date();
    addWaterMutation.mutate({
      amount: waterAmount,
      date: today.toISOString(),
    });
  };

  const quickAddOptions = [0.5, 1, 2, 3, 4];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <i className="fas fa-tint text-blue-500"></i>
            Log Water Intake
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (glasses)</Label>
            <Input
              id="amount"
              type="number"
              step="0.1"
              min="0.1"
              max="20"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter glasses of water"
            />
          </div>

          {/* Quick Add Buttons */}
          <div className="space-y-2">
            <Label>Quick Add</Label>
            <div className="flex flex-wrap gap-2">
              {quickAddOptions.map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(option.toString())}
                  className="text-xs"
                >
                  {option} glass{option !== 1 ? 'es' : ''}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
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
              disabled={addWaterMutation.isPending}
              className="flex-1 bg-blue-500 hover:bg-blue-600"
            >
              {addWaterMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Logging...
                </>
              ) : (
                <>
                  <i className="fas fa-plus mr-2"></i>
                  Log Water
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}