import React, { useState } from 'react';
import { useLocation } from 'wouter';

interface CircularMenuProps {
  onChatbotOpen: () => void;
}

export function CircularMenu({ onChatbotOpen }: CircularMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleMenuItemClick = (action: string) => {
    switch (action) {
      case 'food':
        setLocation('/food-log');
        break;
      case 'reports':
        setLocation('/reports');
        break;
      case 'appointments':
        setLocation('/appointments');
        break;
      case 'community':
        setLocation('/community');
        break;
      case 'friends':
        setLocation('/friends');
        break;
      case 'chatbot':
        onChatbotOpen();
        break;
    }
    setIsOpen(false);
  };

  return (
    <div className={`circular-menu fixed right-6 bottom-6 z-50 ${isOpen ? 'active' : ''}`}>
      {/* Main Menu Button */}
      <button
        onClick={toggleMenu}
        className="w-16 h-16 bg-gradient-to-r from-nutricare-green to-nutricare-light text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 flex items-center justify-center text-xl relative z-10"
      >
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-plus'}`}></i>
      </button>

      {/* Menu Items */}

      <button
        onClick={() => handleMenuItemClick('reports')}
        className="circular-menu-item w-12 h-12 bg-blue-500 text-white shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 flex items-center justify-center rounded-full"
        title="Reports"
        style={{ transitionDelay: '0.2s' }}
      >
        <i className="fas fa-chart-bar"></i>
      </button>

      <button
        onClick={() => handleMenuItemClick('appointments')}
        className="circular-menu-item w-12 h-12 bg-green-500 text-white shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 flex items-center justify-center rounded-full"
        title="Appointments"
        style={{ transitionDelay: '0.3s' }}
      >
        <i className="fas fa-calendar-check"></i>
      </button>

      <button
        onClick={() => handleMenuItemClick('community')}
        className="circular-menu-item w-12 h-12 bg-purple-500 text-white shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 flex items-center justify-center rounded-full"
        title="Community Feed"
        style={{ transitionDelay: '0.4s' }}
      >
        <i className="fab fa-instagram"></i>
      </button>

      <button
        onClick={() => handleMenuItemClick('friends')}
        className="circular-menu-item w-12 h-12 bg-pink-500 text-white shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 flex items-center justify-center rounded-full"
        title="Friends"
        style={{ transitionDelay: '0.5s' }}
      >
        <i className="fas fa-user-friends"></i>
      </button>

      <button
        onClick={() => handleMenuItemClick('chatbot')}
        className="circular-menu-item w-12 h-12 bg-orange-500 text-white shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 flex items-center justify-center rounded-full"
        title="AI Chatbot"
        style={{ transitionDelay: '0.6s' }}
      >
        <i className="fas fa-robot"></i>
      </button>
    </div>
  );
}
