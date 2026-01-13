import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Initialize state from local storage or default to 'dark'
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('quickbite-theme');
      return savedTheme || 'dark'; // Default to dark as requested
    }
    return 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    // Remove both to ensure clean switch
    root.classList.remove('light', 'dark');
    // Add current theme class
    root.classList.add(theme);
    // Persist
    localStorage.setItem('quickbite-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
