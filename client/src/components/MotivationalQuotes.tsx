import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';

const quotes = {
  en: [
    { text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
    { text: "Health is not about the weight you lose, but about the life you gain.", author: "Dr. Josh Axe" },
    { text: "Your body can stand almost anything. It's your mind that you have to convince.", author: "Unknown" },
    { text: "A healthy outside starts from the inside.", author: "Robert Urich" },
    { text: "The first wealth is health.", author: "Ralph Waldo Emerson" },
    { text: "Eating well is a form of self-respect.", author: "Unknown" },
    { text: "Good nutrition creates health in all areas of our existence.", author: "T. Colin Campbell" }
  ],
  hi: [
    { text: "अपने शरीर की देखभाल करें। यह एकमात्र जगह है जहाँ आपको रहना है।", author: "जिम रोहन" },
    { text: "स्वास्थ्य इस बारे में नहीं है कि आप कितना वजन कम करते हैं, बल्कि इस बारे में है कि आप कितना जीवन पाते हैं।", author: "डॉ. जोश एक्स" },
    { text: "आपका शरीर लगभग कुछ भी सह सकता है। आपको अपने मन को मनाना होगा।", author: "अज्ञात" },
    { text: "एक स्वस्थ बाहरी हिस्सा अंदर से शुरू होता है।", author: "रॉबर्ट उरिच" },
    { text: "पहली संपत्ति स्वास्थ्य है।", author: "राल्फ वाल्डो एमर्सन" },
  ],
  ur: [
    { text: "اپنے جسم کی دیکھ بھال کریں۔ یہ واحد جگہ ہے جہاں آپ کو رہنا ہے۔", author: "جم رون" },
    { text: "صحت اس بارے میں نہیں ہے کہ آپ کتنا وزن کم کرتے ہیں، بلکہ اس بارے میں ہے کہ آپ کتنی زندگی حاصل کرتے ہیں۔", author: "ڈاکٹر جوش ایکس" },
  ],
  pa: [
    { text: "ਆਪਣੇ ਸਰੀਰ ਦੀ ਦੇਖਭਾਲ ਕਰੋ। ਇਹ ਇਕੋ ਜਗ੍ਹਾ ਹੈ ਜਿੱਥੇ ਤੁਹਾਨੂੰ ਰਹਿਣਾ ਹੈ।", author: "ਜਿਮ ਰੋਹਨ" },
    { text: "ਸਿਹਤ ਇਸ ਬਾਰੇ ਨਹੀਂ ਹੈ ਕਿ ਤੁਸੀਂ ਕਿੰਨਾ ਭਾਰ ਗੁਆਉਂਦੇ ਹੋ, ਸਗੋਂ ਇਸ ਬਾਰੇ ਹੈ ਕਿ ਤੁਸੀਂ ਕਿੰਨੀ ਜ਼ਿੰਦਗੀ ਪ੍ਰਾਪਤ ਕਰਦੇ ਹੋ।", author: "ਡਾ. ਜੋਸ਼ ਐਕਸ" },
  ],
  mr: [
    { text: "आपल्या शरीराची काळजी घ्या. ही एकमेव जागा आहे जिथे तुम्हाला राहावे लागेल.", author: "जिम रोहन" },
    { text: "आरोग्य म्हणजे तुम्ही किती वजन कमी करता याबद्दल नाही, तर तुम्हाला किती आयुष्य मिळते याबद्दल आहे.", author: "डॉ. जोश अॅक्स" },
  ],
  gu: [
    { text: "તમારા શરીરની કાળજી લો. આ એકમાત્ર સ્થળ છે જ્યાં તમારે રહેવાનું છે.", author: "જિમ રોહન" },
    { text: "આરોગ્ય એ વિશે નથી કે તમે કેટલું વજન ગુમાવો છો, પરંતુ તમે કેટલું જીવન મેળવો છો તે વિશે છે.", author: "ડૉ. જોશ એક્સ" },
  ]
};

export function MotivationalQuotes() {
  const { language } = useLanguage();
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const currentQuotes = quotes[language] || quotes.en;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % currentQuotes.length);
    }, 10000); // Change every 10 seconds

    return () => clearInterval(interval);
  }, [currentQuotes.length]);

  const currentQuote = currentQuotes[currentQuoteIndex];

  return (
    <div className="sticky top-6">
      <h3 className="text-lg font-semibold mb-6 text-nutricare-forest dark:text-nutricare-light">
        <i className="fas fa-quote-left mr-2"></i>
        Daily Motivation
      </h3>
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg">
        <p className="text-gray-700 dark:text-gray-300 italic text-lg leading-relaxed mb-4">
          "{currentQuote.text}"
        </p>
        <p className="text-nutricare-green font-medium">— {currentQuote.author}</p>
      </div>
      
      {/* Additional motivational elements */}
      <div className="mt-8 space-y-4">
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <i className="fas fa-fire text-orange-500 mr-2"></i>
            <span className="text-sm font-medium">Daily Streak</span>
          </div>
          <p className="text-2xl font-bold text-nutricare-green">12 days</p>
        </div>
        
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <i className="fas fa-trophy text-yellow-500 mr-2"></i>
            <span className="text-sm font-medium">This Week</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">5 healthy meals logged!</p>
        </div>
      </div>
    </div>
  );
}
