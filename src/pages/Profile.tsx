import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/hooks/useToast';
import { presetsApi } from '@/api/presets';
import { Toast } from '@/components/Toast';

interface MyPreset {
  id: number;
  name: string;
  isPublic: boolean;
  createdAt: string;
  config: any;
}

interface LikedPreset {
  id: number;
  name: string;
  author: { id: number; email: string };
  likesCount: number;
  viewsCount: number;
  createdAt: string;
}

export const Profile = () => {
  const navigate = useNavigate();
  const { mode, theme } = useTheme();
  const { user, isAuthenticated } = useAuthStore();
  const { toasts, showToast, removeToast } = useToast();
  
  const [myPresets, setMyPresets] = useState<MyPreset[]>([]);
  const [likedPresets, setLikedPresets] = useState<LikedPreset[]>([]);
  const [activeTab, setActiveTab] = useState<'my' | 'liked'>('my');
  const [isLoading, setIsLoading] = useState(true);

  const currentTheme = mode === 'dark' ? theme.dark : theme.light;

  const loadMyPresets = async () => {
    try {
      const data = await presetsApi.getMyPresets();
      setMyPresets(data);
    } catch (error) {
      console.error('Failed to load my presets:', error);
      showToast('Не удалось загрузить пресеты', 'error');
    }
  };

  const loadLikedPresets = async () => {
    try {
      const data = await presetsApi.getLikedPresets();
      setLikedPresets(data);
    } catch (error) {
      console.error('Failed to load liked presets:', error);
      showToast('Не удалось загрузить лайкнутые пресеты', 'error');
    }
  };

  const handleDeletePreset = async (id: number) => {
    if (!confirm('Удалить пресет? Это действие нельзя отменить.')) return;
    
    try {
      await presetsApi.deletePreset(id);
      setMyPresets(prev => prev.filter(p => p.id !== id));
      showToast('Пресет удалён', 'success');
    } catch (error) {
      console.error('Failed to delete preset:', error);
      showToast('Не удалось удалить пресет', 'error');
    }
  };

  const handleEditPreset = (id: number) => {
    navigate(`/constructor?id=${id}`);
  };

  const handleViewPreset = (id: number) => {
    navigate(`/preset/${id}`);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    
    const loadAll = async () => {
      setIsLoading(true);
      await Promise.all([loadMyPresets(), loadLikedPresets()]);
      setIsLoading(false);
    };
    loadAll();
  }, [isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: currentTheme.textPrimary }}>
        Загрузка...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: currentTheme.background, padding: '24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Информация о пользователе */}
        <div style={{
          backgroundColor: currentTheme.surface,
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '24px',
          border: `1px solid ${currentTheme.border}`,
        }}>
          <h1 style={{ fontSize: '28px', color: currentTheme.textPrimary, marginBottom: '8px' }}>
            Профиль
          </h1>
          <div style={{ color: currentTheme.textSecondary }}>
            <div>Email: {user?.email}</div>
            <div>Дата регистрации: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</div>
            <div>Всего пресетов: {myPresets.length}</div>
            <div>Лайкнуто пресетов: {likedPresets.length}</div>
          </div>
        </div>
        
        {/* Табы */}
        <div style={{
          backgroundColor: currentTheme.surface,
          borderRadius: '20px',
          padding: '20px',
          border: `1px solid ${currentTheme.border}`,
        }}>
          <div style={{ display: 'flex', gap: '8px', borderBottom: `1px solid ${currentTheme.border}`, marginBottom: '20px' }}>
            <button
              onClick={() => setActiveTab('my')}
              style={{
                padding: '10px 20px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'my' ? `2px solid ${theme.accent}` : '2px solid transparent',
                color: activeTab === 'my' ? theme.accent : currentTheme.textSecondary,
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              Мои пресеты ({myPresets.length})
            </button>
            <button
              onClick={() => setActiveTab('liked')}
              style={{
                padding: '10px 20px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'liked' ? `2px solid ${theme.accent}` : '2px solid transparent',
                color: activeTab === 'liked' ? theme.accent : currentTheme.textSecondary,
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              Лайкнутые ({likedPresets.length})
            </button>
          </div>
          
          {/* Мои пресеты */}
          {activeTab === 'my' && (
            <div>
              {myPresets.length === 0 ? (
                <p style={{ color: currentTheme.textSecondary, textAlign: 'center', padding: '40px' }}>
                  У вас пока нет пресетов. Перейдите в Конструктор, чтобы создать первый!
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {myPresets.map(preset => (
                    <div key={preset.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      borderRadius: '12px',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', color: currentTheme.textPrimary }}>{preset.name}</div>
                        <div style={{ fontSize: '12px', color: currentTheme.textSecondary }}>
                          {preset.isPublic ? '🌍 Публичный' : '🔒 Приватный'} • {new Date(preset.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleViewPreset(preset.id)} style={{ padding: '6px 12px', backgroundColor: theme.accent, border: 'none', borderRadius: '8px', color: '#000', cursor: 'pointer' }}>👁️ Просмотр</button>
                        <button onClick={() => handleEditPreset(preset.id)} style={{ padding: '6px 12px', backgroundColor: currentTheme.surfaceHover, border: `1px solid ${currentTheme.border}`, borderRadius: '8px', color: currentTheme.textPrimary, cursor: 'pointer' }}>✏️ Редактировать</button>
                        <button onClick={() => handleDeletePreset(preset.id)} style={{ padding: '6px 12px', backgroundColor: '#ff4757', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>🗑️ Удалить</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Лайкнутые пресеты */}
          {activeTab === 'liked' && (
            <div>
              {likedPresets.length === 0 ? (
                <p style={{ color: currentTheme.textSecondary, textAlign: 'center', padding: '40px' }}>
                  Вы ещё не лайкнули ни один пресет. Лайкайте понравившиеся в ленте!
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {likedPresets.map(preset => (
                    <div key={preset.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      borderRadius: '12px',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', color: currentTheme.textPrimary }}>{preset.name}</div>
                        <div style={{ fontSize: '12px', color: currentTheme.textSecondary }}>
                          Автор: {preset.author.email.split('@')[0]} • ❤️ {preset.likesCount} • 👁️ {preset.viewsCount}
                        </div>
                      </div>
                      <button onClick={() => handleViewPreset(preset.id)} style={{ padding: '6px 12px', backgroundColor: theme.accent, border: 'none', borderRadius: '8px', color: '#000', cursor: 'pointer' }}>👁️ Просмотр</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {toasts.map(toast => (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};
