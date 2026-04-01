import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useTheme } from '@/context/ThemeContext';

export const Header = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { mode, toggleTheme, theme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const currentTheme = mode === 'dark' ? theme.dark : theme.light;

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: currentTheme.surface,
      backdropFilter: 'blur(10px)',
      borderBottom: `1px solid ${currentTheme.border}`,
      padding: '16px 24px',
      zIndex: 1000,
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link to="/" style={{ fontSize: '20px', fontWeight: 'bold', color: theme.accent, textDecoration: 'none' }}>
          🎨 Particle Constructor
        </Link>

        <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <Link to="/" style={{ color: currentTheme.textPrimary, textDecoration: 'none' }}>Лента</Link>
          {isAuthenticated && (
            <>
              <Link to="/constructor" style={{ color: currentTheme.textPrimary, textDecoration: 'none' }}>Конструктор</Link>
              <Link to="/profile" style={{ color: currentTheme.textPrimary, textDecoration: 'none' }}>Профиль</Link>
            </>
          )}
          
          {/* Переключатель темы */}
          <button
            onClick={toggleTheme}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
            title={mode === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          >
            {mode === 'dark' ? '☀️' : '🌙'}
          </button>

          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ color: currentTheme.textSecondary, fontSize: '14px' }}>{user?.email}</span>
              <button
                onClick={handleLogout}
                style={{
                  padding: '6px 16px',
                  backgroundColor: theme.accent,
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Выйти
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              style={{
                padding: '6px 16px',
                backgroundColor: theme.accent,
                borderRadius: '8px',
                color: '#000',
                textDecoration: 'none',
                fontWeight: '500',
              }}
            >
              Войти
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};
