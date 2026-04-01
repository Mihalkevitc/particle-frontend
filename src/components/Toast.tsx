import { useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';

interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'error' | 'warning';
  duration?: number;
  onClose: () => void;
}

export const Toast = ({ message, type = 'info', duration = 3000, onClose }: ToastProps) => {
  const { mode, theme } = useTheme();
  const currentTheme = mode === 'dark' ? theme.dark : theme.light;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getBgColor = () => {
    switch (type) {
      case 'success': return '#4caf50';
      case 'error': return '#f44336';
      case 'warning': return theme.accent;
      default: return theme.accent;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: getBgColor(),
      color: type === 'warning' || type === 'info' ? '#000' : '#fff',
      padding: '12px 24px',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      zIndex: 2000,
      fontSize: '14px',
      fontWeight: '500',
      animation: 'fadeInUp 0.3s ease',
    }}>
      {message}
    </div>
  );
};
