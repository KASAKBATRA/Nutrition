import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';

interface MoodTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (mood: string, reason?: string) => void;
}

export function MoodTrackerModal({ isOpen, onClose, onSubmit }: MoodTrackerModalProps) {
  // Try to get language context, fallback to English if not available
  let t;
  try {
    const { t: useT } = useLanguage();
    t = useT;
  } catch (error) {
    // Fallback function for when context is not available
    t = (key: string) => {
      const fallbackTranslations: Record<string, string> = {
        'mood.question': 'How are you feeling now?',
        'mood.selectFeeling': 'Please select how you feel after this meal:',
        'mood.veryGood': 'Very Good',
        'mood.good': 'Good',
        'mood.neutral': 'Neutral',
        'mood.bad': 'Bad',
        'mood.veryBad': 'Very Bad',
        'mood.whyGood': "That's great! What made you feel good? Was the meal tasty and satisfying?",
        'mood.whyBad': 'Sorry to hear that. What went wrong? Was the meal not good or something else?',
        'mood.reasonPlaceholder': 'Please share your thoughts...',
        'mood.submit': 'Submit',
        'common.cancel': 'Cancel',
      };
      return fallbackTranslations[key] || key;
    };
  }
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(false);

  const moodOptions = [
    {
      value: 'very-good',
      label: t('mood.veryGood'),
      emoji: '😊',
      color: 'bg-green-500 hover:bg-green-600',
      textColor: 'text-green-700',
      bgColor: 'bg-green-50'
    },
    {
      value: 'good',
      label: t('mood.good'),
      emoji: '🙂',
      color: 'bg-blue-500 hover:bg-blue-600',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50'
    },
    {
      value: 'neutral',
      label: t('mood.neutral'),
      emoji: '😐',
      color: 'bg-gray-500 hover:bg-gray-600',
      textColor: 'text-gray-700',
      bgColor: 'bg-gray-50'
    },
    {
      value: 'bad',
      label: t('mood.bad'),
      emoji: '🙁',
      color: 'bg-orange-500 hover:bg-orange-600',
      textColor: 'text-orange-700',
      bgColor: 'bg-orange-50'
    },
    {
      value: 'very-bad',
      label: t('mood.veryBad'),
      emoji: '😢',
      color: 'bg-red-500 hover:bg-red-600',
      textColor: 'text-red-700',
      bgColor: 'bg-red-50'
    }
  ];

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood);
    
    // Show reason input for all moods except neutral
    if (mood !== 'neutral') {
      setShowReasonInput(true);
    } else {
      // For neutral, submit immediately without reason
      onSubmit(mood);
      handleClose();
    }
  };

  const handleSubmit = () => {
    if (selectedMood) {
      onSubmit(selectedMood, reason.trim() || undefined);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedMood(null);
    setReason('');
    setShowReasonInput(false);
    onClose();
  };

  const getReasonPrompt = () => {
    if (!selectedMood) return '';
    
    if (selectedMood === 'very-good' || selectedMood === 'good') {
      return t('mood.whyGood');
    } else if (selectedMood === 'bad' || selectedMood === 'very-bad') {
      return t('mood.whyBad');
    }
    return '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">
            {t('mood.question')}
          </DialogTitle>
        </DialogHeader>

        {!showReasonInput ? (
          <div className="space-y-4">
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
              {t('mood.selectFeeling')}
            </p>
            
            <div className="grid grid-cols-1 gap-3">
              {moodOptions.map((mood) => (
                <Card
                  key={mood.value}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${mood.bgColor} border-2 hover:border-gray-300`}
                  onClick={() => handleMoodSelect(mood.value)}
                >
                  <div className="p-4 flex items-center space-x-4">
                    <div className="text-3xl">{mood.emoji}</div>
                    <div className={`flex-1 font-medium ${mood.textColor}`}>
                      {mood.label}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 mb-4">
                <span className="text-2xl">
                  {moodOptions.find(m => m.value === selectedMood)?.emoji}
                </span>
                <span className="font-medium">
                  {moodOptions.find(m => m.value === selectedMood)?.label}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {getReasonPrompt()}
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('mood.reasonPlaceholder')}
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="flex space-x-3">
              <Button 
                onClick={handleSubmit}
                className="flex-1 bg-nutricare-green hover:bg-nutricare-dark"
              >
                {t('mood.submit')}
              </Button>
              <Button 
                onClick={handleClose}
                variant="outline"
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}