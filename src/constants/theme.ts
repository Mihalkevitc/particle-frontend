// Цветовая схема приложения
// Поддерживает светлую и тёмную тему с жёлтым акцентом

export const theme = {
  // Основные цвета
  accent: '#FFD700',     // Солнечно-жёлтый
  accentDark: '#FFC107', // Тёмно-жёлтый
  accentLight: '#FFE082', // Светло-жёлтый

  // Тёмная тема
  dark: {
    background: '#0a0a0a',
    surface: 'rgba(255,255,255,0.05)',
    surfaceHover: 'rgba(255,255,255,0.1)',
    border: '#222',
    textPrimary: '#ffffff',
    textSecondary: '#888888',
    textMuted: '#666666',
  },

  // Светлая тема
  light: {
    background: '#f5f5f5',
    surface: '#ffffff',
    surfaceHover: '#f0f0f0',
    border: '#e0e0e0',
    textPrimary: '#1a1a1a',
    textSecondary: '#666666',
    textMuted: '#999999',
  },
};

export type ThemeMode = 'dark' | 'light';
