import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useTheme } from '@/context/ThemeContext';

type AuthMode = 'login' | 'register';

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
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: themeMode === 'dark' 
        ? 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)'
        : 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
    }}>
      <div style={{
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
