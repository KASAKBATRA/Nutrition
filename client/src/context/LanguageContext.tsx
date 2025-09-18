import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'hi' | 'ur' | 'pa' | 'mr' | 'gu';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Header
    'header.signin': 'Sign In',
    'header.register': 'Register',
    'header.progress': 'Progress',
    'header.daily': 'Daily View',
    'header.weekly': 'Weekly View',
    'header.monthly': 'Monthly View',
    
    // Dashboard
    'dashboard.welcome': 'Welcome back',
    'dashboard.journey': "Here's your health journey today",
    'dashboard.calories': 'Calories',
    'dashboard.water': 'Water',
    'dashboard.weight': 'Weight',
    'dashboard.bmi': 'BMI',
    'dashboard.today': 'Today',
    'dashboard.thisweek': 'This week',
    'dashboard.current': 'Current',
    'dashboard.glasses': 'glasses',
    'dashboard.normal': 'Normal',
    'dashboard.healthy_range': 'Healthy range: 18.5-24.9',
    
    // Meals
    'meals.title': "Today's Meals",
    'meals.add': 'Add Meal',
    'meals.breakfast': 'Breakfast',
    'meals.lunch': 'Lunch',
    'meals.dinner': 'Dinner',
    'meals.snack': 'Snack',
    'meals.not_logged': 'Not logged yet',
    'meals.add_button': 'Add',
    
    // Community
    'community.title': 'Community Feed',
    'community.view_all': 'View All',
    
    // Quick Actions
    'actions.title': 'Quick Actions',
    'actions.scan': 'Scan Food Label',
    'actions.appointment': 'Book Appointment',
    'actions.reports': 'View Reports',
    
    // Appointments
    'appointments.title': 'Upcoming Appointments',
    'appointments.consultation': 'Nutritionist Consultation',
    'appointments.tomorrow': 'Tomorrow',
    
    // Friends
    'friends.title': 'Friends Activity',
    'friends.completed_goal': 'completed his daily goal',
    'friends.shared_recipe': 'shared a healthy recipe',
    
    // Chatbot
    'chatbot.title': 'NutriCare AI',
    'chatbot.placeholder': 'Ask me anything...',
    'chatbot.initial': "Hello! I'm here to help you with your nutrition and health goals. What would you like to know?",
    
    // Motivation
    'motivation.title': 'Daily Motivation',
    'motivation.streak': 'Daily Streak',
    'motivation.days': 'days',
    'motivation.week': 'This Week',
    'motivation.meals_logged': 'healthy meals logged!',
  },
  
  hi: {
    // Header
    'header.signin': 'साइन इन',
    'header.register': 'पंजीकरण',
    'header.progress': 'प्रगति',
    'header.daily': 'दैनिक दृश्य',
    'header.weekly': 'साप्ताहिक दृश्य',
    'header.monthly': 'मासिक दृश्य',
    
    // Dashboard
    'dashboard.welcome': 'वापसी पर स्वागत है',
    'dashboard.journey': 'यहाँ आज आपकी स्वास्थ्य यात्रा है',
    'dashboard.calories': 'कैलोरी',
    'dashboard.water': 'पानी',
    'dashboard.weight': 'वजन',
    'dashboard.bmi': 'बीएमआई',
    'dashboard.today': 'आज',
    'dashboard.thisweek': 'इस सप्ताह',
    'dashboard.current': 'वर्तमान',
    'dashboard.glasses': 'गिलास',
    'dashboard.normal': 'सामान्य',
    'dashboard.healthy_range': 'स्वस्थ सीमा: 18.5-24.9',
    
    // Meals
    'meals.title': 'आज का भोजन',
    'meals.add': 'भोजन जोड़ें',
    'meals.breakfast': 'नाश्ता',
    'meals.lunch': 'दोपहर का खाना',
    'meals.dinner': 'रात का खाना',
    'meals.snack': 'नाश्ता',
    'meals.not_logged': 'अभी तक लॉग नहीं किया गया',
    'meals.add_button': 'जोड़ें',
    
    // Community
    'community.title': 'समुदायिक फ़ीड',
    'community.view_all': 'सभी देखें',
    
    // Quick Actions
    'actions.title': 'त्वरित कार्य',
    'actions.scan': 'खाद्य लेबल स्कैन करें',
    'actions.appointment': 'अपॉइंटमेंट बुक करें',
    'actions.reports': 'रिपोर्ट देखें',
    
    // Appointments
    'appointments.title': 'आगामी अपॉइंटमेंट',
    'appointments.consultation': 'पोषणविशेषज्ञ परामर्श',
    'appointments.tomorrow': 'कल',
    
    // Friends
    'friends.title': 'मित्रों की गतिविधि',
    'friends.completed_goal': 'ने अपना दैनिक लक्ष्य पूरा किया',
    'friends.shared_recipe': 'ने एक स्वस्थ रेसिपी साझा की',
    
    // Chatbot
    'chatbot.title': 'NutriCare AI',
    'chatbot.placeholder': 'मुझसे कुछ भी पूछें...',
    'chatbot.initial': 'नमस्ते! मैं यहाँ आपके पोषण और स्वास्थ्य लक्ष्यों में मदद करने के लिए हूँ। आप क्या जानना चाहते हैं?',
    
    // Motivation
    'motivation.title': 'दैनिक प्रेरणा',
    'motivation.streak': 'दैनिक लकीर',
    'motivation.days': 'दिन',
    'motivation.week': 'इस सप्ताह',
    'motivation.meals_logged': 'स्वस्थ भोजन लॉग किया गया!',
  },
  
  // Add other languages similarly...
  ur: {
    'header.signin': 'سائن ان',
    'header.register': 'رجسٹر',
    'dashboard.welcome': 'واپسی پر خوش آمدید',
    'dashboard.journey': 'یہاں آج آپ کا صحت کا سفر ہے',
    'chatbot.initial': 'ہیلو! میں یہاں آپ کی غذائیت اور صحت کے اہداف میں مدد کے لیے ہوں۔ آپ کیا جاننا چاہتے ہیں؟',
  },
  
  pa: {
    'header.signin': 'ਸਾਈਨ ਇਨ',
    'header.register': 'ਰਜਿਸਟਰ',
    'dashboard.welcome': 'ਵਾਪਸੀ ਤੇ ਜੀ ਆਇਆਂ ਨੂੰ',
    'dashboard.journey': 'ਇੱਥੇ ਅੱਜ ਤੁਹਾਡੀ ਸਿਹਤ ਦੀ ਯਾਤਰਾ ਹੈ',
    'chatbot.initial': 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਇੱਥੇ ਤੁਹਾਡੇ ਪੋਸ਼ਣ ਅਤੇ ਸਿਹਤ ਦੇ ਟੀਚਿਆਂ ਵਿੱਚ ਮਦਦ ਕਰਨ ਲਈ ਹਾਂ। ਤੁਸੀਂ ਕੀ ਜਾਣਨਾ ਚਾਹੁੰਦੇ ਹੋ?',
  },
  
  mr: {
    'header.signin': 'साइन इन',
    'header.register': 'नोंदणी',
    'dashboard.welcome': 'परत येण्यावर स्वागत आहे',
    'dashboard.journey': 'आज तुमचा आरोग्य प्रवास इथे आहे',
    'chatbot.initial': 'नमस्कार! मी तुमच्या पोषण आणि आरोग्य उद्दिष्टांमध्ये मदत करण्यासाठी येथे आहे। तुम्हाला काय जाणून घ्यायचे आहे?',
  },
  
  gu: {
    'header.signin': 'સાઇન ઇન',
    'header.register': 'નોંધણી',
    'dashboard.welcome': 'પાછા આવવા પર સ્વાગત છે',
    'dashboard.journey': 'અહીં આજે તમારી આરોગ્યની યાત્રા છે',
    'chatbot.initial': 'નમસ્તે! હું અહીં તમારા પોષણ અને આરોગ્યના લક્ષ્યોમાં મદદ કરવા માટે છું। તમે શું જાણવા માંગો છો?',
  },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && Object.keys(translations).includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
