import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useTheme } from '@/context/ThemeContext';

type AuthMode = 'login' | 'register';

declare global {
  interface Window {
    ParticleLib: {
      ParticleSystem: new () => {
        init: (config: { canvas: HTMLCanvasElement; config: any }) => Promise<void>;
        destroy: () => void;
      };
    };
  }
}

export const Auth = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login, register } = useAuthStore();
  const { mode: themeMode, theme } = useTheme();
  const currentTheme = themeMode === 'dark' ? theme.dark : theme.light;
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleSystemRef = useRef<any>(null);

  // Инициализация фоновой визуализации
  useEffect(() => {
    if (!canvasRef.current || !window.ParticleLib) return;

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/gh/Mihalkevitc/particle-lib@main/dist/particle-lib.umd.js';
    script.onload = () => {
      const ps = new window.ParticleLib.ParticleSystem();
      particleSystemRef.current = ps;
      
      // Настройка волнового поведения для фона
      ps.init({
        canvas: canvasRef.current,
        config: {
          particleCount: 10000,
          colors: ['#FFD700', '#FFA500', '#FF8C00', '#FFB347', '#FFCC66'],
          particleSize: 7,
          maxSpeed: 2,
          behavior: 'wave',
          shape: 'circle',
          initSpeed: 1,
          behaviorParams: {
            speed: 0.02,
            maxSpeed: 2,
            amplitude: 0.2,
            frequency: 0.018
          }
        }
      });
    };
    document.body.appendChild(script);

    return () => {
      if (particleSystemRef.current) {
        particleSystemRef.current.destroy();
      }
    };
  }, []);

  // Адаптация размера canvas под окно
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password);
        setMode('login');
        setError('Регистрация успешна! Войдите в систему.');
      }
      if (mode === 'login') {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка. Попробуйте снова.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {/* Фоновый canvas с частицами */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          zIndex: 0,
        }}
      />
      
      {/* Затемнение фона для читаемости формы */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1,
      }} />
      
      {/* Форма авторизации */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        backgroundColor: currentTheme.surface,
        backdropFilter: 'blur(10px)',
        borderRadius: '24px',
        padding: '40px',
        width: '100%',
        maxWidth: '440px',
        boxShadow: themeMode === 'dark' ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.1)',
      }}>
        <h1 style={{ fontSize: '28px', marginBottom: '8px', textAlign: 'center', color: theme.accent }}>
          Particle Constructor
        </h1>
        <p style={{ textAlign: 'center', color: currentTheme.textSecondary, marginBottom: '32px' }}>
          {mode === 'login' ? 'Войдите в аккаунт' : 'Создайте аккаунт'}
        </p>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', borderBottom: `1px solid ${currentTheme.border}` }}>
          <button
            onClick={() => { setMode('login'); setError(null); }}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px 0',
              fontSize: '16px',
              fontWeight: mode === 'login' ? '600' : '400',
              color: mode === 'login' ? theme.accent : currentTheme.textMuted,
              borderBottom: mode === 'login' ? `2px solid ${theme.accent}` : 'none',
              cursor: 'pointer',
            }}
          >
            Вход
          </button>
          <button
            onClick={() => { setMode('register'); setError(null); }}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px 0',
              fontSize: '16px',
              fontWeight: mode === 'register' ? '600' : '400',
              color: mode === 'register' ? theme.accent : currentTheme.textMuted,
              borderBottom: mode === 'register' ? `2px solid ${theme.accent}` : 'none',
              cursor: 'pointer',
            }}
          >
            Регистрация
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '14px 16px',
              marginBottom: '16px',
              backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              border: `1px solid ${currentTheme.border}`,
              borderRadius: '12px',
              color: currentTheme.textPrimary,
              fontSize: '16px',
              outline: 'none',
            }}
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '14px 16px',
              marginBottom: '24px',
              backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              border: `1px solid ${currentTheme.border}`,
              borderRadius: '12px',
              color: currentTheme.textPrimary,
              fontSize: '16px',
              outline: 'none',
            }}
          />

          {error && (
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: error.includes('успешна') ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)',
              borderLeft: `4px solid ${error.includes('успешна') ? '#0f0' : '#f00'}`,
              borderRadius: '8px',
              fontSize: '14px',
              color: currentTheme.textPrimary,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: theme.accent,
              color: '#000',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? 'Загрузка...' : (mode === 'login' ? 'Войти' : 'Зарегистрироваться')}
          </button>
        </form>
      </div>
    </div>
  );
};
