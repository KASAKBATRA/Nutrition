import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AboutModalContextType {
  isAboutModalOpen: boolean;
  openAboutModal: () => void;
  closeAboutModal: () => void;
}

const AboutModalContext = createContext<AboutModalContextType | undefined>(undefined);

export const useAboutModal = () => {
  const context = useContext(AboutModalContext);
  if (!context) {
    throw new Error('useAboutModal must be used within an AboutModalProvider');
  }
  return context;
};

interface AboutModalProviderProps {
  children: ReactNode;
}

export const AboutModalProvider: React.FC<AboutModalProviderProps> = ({ children }) => {
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  const openAboutModal = () => setIsAboutModalOpen(true);
  const closeAboutModal = () => setIsAboutModalOpen(false);

  return (
    <AboutModalContext.Provider value={{
      isAboutModalOpen,
      openAboutModal,
      closeAboutModal
    }}>
      {children}
    </AboutModalContext.Provider>
  );
};