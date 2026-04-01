import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeMode, theme } from '@/constants/theme';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  theme: typeof theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme-mode');
    return (saved === 'light' ? 'light' : 'dark') as ThemeMode;
  });

  useEffect(() => {
    localStorage.setItem('theme-mode', mode);
    // Применяем класс к body
    document.body.style.backgroundColor = mode === 'dark' ? '#0a0a0a' : '#f5f5f5';
    document.body.style.color = mode === 'dark' ? '#fff' : '#1a1a1a';
  }, [mode]);

  const toggleTheme = () => {
    setMode(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};
