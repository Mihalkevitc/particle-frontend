import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/hooks/useToast';
import { presetsApi } from '@/api/presets';
import { authApi } from '@/api/auth';
import { Toast } from '@/components/Toast';
import { Preset } from '@/types';

interface Stats {
  totalPresets: number;
  totalLikes: number;
  totalComments: number;
  totalViews: number;
  mostLikedPreset: Preset | null;
}

export const Profile = () => {
  const navigate = useNavigate();
  const { mode, theme } = useTheme();
  const { user, isAuthenticated, logout, checkAuth } = useAuthStore();
  const { toasts, showToast, removeToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'my' | 'liked' | 'stats'>('my');
  const [myPresets, setMyPresets] = useState<Preset[]>([]);
  const [likedPresets, setLikedPresets] = useState<Preset[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalPresets: 0,
    totalLikes: 0,
    totalComments: 0,
    totalViews: 0,
    mostLikedPreset: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const currentTheme = mode === 'dark' ? theme.dark : theme.light;

  // Загрузка пресетов пользователя
  const loadMyPresets = async () => {
    try {
      const data = await presetsApi.getMyPresets();
      setMyPresets(data);
      return data;
    } catch (error) {
      console.error('Failed to load my presets:', error);
      return [];
    }
  };

  // Загрузка лайкнутых пресетов
  const loadLikedPresets = async () => {
    try {
      const data = await presetsApi.getLikedPresets();
      setLikedPresets(data);
      return data;
    } catch (error) {
      console.error('Failed to load liked presets:', error);
      return [];
    }
  };

  // Расчёт статистики
  const calculateStats = async () => {
    const presets = await loadMyPresets();
    
    let totalLikes = 0;
    let totalComments = 0;
    let totalViews = 0;
    let mostLiked: Preset | null = null;
    
    for (const preset of presets) {
      // Получаем полную информацию о пресете (с лайками, просмотрами)
      try {
        const fullPreset = await presetsApi.getPresetById(preset.id);
        totalLikes += fullPreset.likesCount;
        totalComments += fullPreset.commentsCount;
        totalViews += fullPreset.viewsCount;
        
        if (!mostLiked || (fullPreset.likesCount > (mostLiked as any).likesCount)) {
          mostLiked = preset;
          (mostLiked as any).likesCount = fullPreset.likesCount;
        }
      } catch (error) {
        console.error('Failed to get preset stats:', error);
      }
    }
    
    setStats({
      totalPresets: presets.length,
      totalLikes,
      totalComments,
      totalViews,
      mostLikedPreset: mostLiked,
    });
  };

  // Редактирование профиля
  const handleUpdateProfile = async () => {
    if (!newEmail.trim()) {
      showToast('Введите email', 'warning');
      return;
    }
    
    try {
      await authApi.updateProfile({ email: newEmail });
      await checkAuth();
      setIsEditing(false);
      setNewEmail('');
      showToast('Email обновлён', 'success');
    } catch (error) {
      console.error('Failed to update profile:', error);
      showToast('Не удалось обновить email', 'error');
    }
  };

  // Удаление аккаунта
  const handleDeleteAccount = async () => {
    try {
      await authApi.deleteAccount();
      logout();
      showToast('Аккаунт удалён', 'success');
      navigate('/');
    } catch (error) {
      console.error('Failed to delete account:', error);
      showToast('Не удалось удалить аккаунт', 'error');
    }
  };

  // Удаление пресета
  const handleDeletePreset = async (id: number) => {
    if (!confirm('Удалить пресет?')) return;
    
    try {
      await presetsApi.deletePreset(id);
      setMyPresets(prev => prev.filter(p => p.id !== id));
      await calculateStats();
      showToast('Пресет удалён', 'success');
    } catch (error) {
      console.error('Failed to delete preset:', error);
      showToast('Не удалось удалить пресет', 'error');
    }
  };

  // Редактирование пресета
  const handleEditPreset = (id: number) => {
    navigate(`/constructor?id=${id}`);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([loadMyPresets(), loadLikedPresets(), calculateStats()]);
      setIsLoading(false);
    };
    loadData();
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '28px', color: currentTheme.textPrimary, marginBottom: '8px' }}>
                👤 {user?.email?.split('@')[0]}
              </h1>
              <div style={{ color: currentTheme.textSecondary, fontSize: '14px' }}>
                {user?.email}
              </div>
              <div style={{ color: currentTheme.textSecondary, fontSize: '14px', marginTop: '8px' }}>
                Регистрация: {new Date(user?.createdAt || '').toLocaleDateString()}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              {!isEditing ? (
                <button
                  onClick={() => {
                    setNewEmail(user?.email || '');
                    setIsEditing(true);
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: currentTheme.surfaceHover,
                    border: `1px solid ${currentTheme.border}`,
                    borderRadius: '12px',
                    color: currentTheme.textPrimary,
                    cursor: 'pointer',
                  }}
                >
                  ✏️ Редактировать
                </button>
              ) : (
                <>
                  <button
                    onClick={handleUpdateProfile}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: theme.accent,
                      border: 'none',
                      borderRadius: '12px',
                      color: '#000',
                      cursor: 'pointer',
                      fontWeight: '500',
                    }}
                  >
                    💾 Сохранить
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: currentTheme.surfaceHover,
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: '12px',
                      color: currentTheme.textPrimary,
                      cursor: 'pointer',
                    }}
                  >
                    Отмена
                  </button>
                </>
              )}
              
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ff4757',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                🗑️ Удалить аккаунт
              </button>
            </div>
          </div>
          
          {isEditing && (
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${currentTheme.border}` }}>
              <label style={{ display: 'block', marginBottom: '8px', color: currentTheme.textPrimary, fontSize: '14px', fontWeight: '500' }}>
                Новый email
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: '12px',
                  color: currentTheme.textPrimary,
                }}
              />
            </div>
          )}
        </div>
        
        {/* Вкладки */}
        <div style={{
          backgroundColor: currentTheme.surface,
          borderRadius: '20px',
          padding: '24px',
          border: `1px solid ${currentTheme.border}`,
        }}>
          <div style={{ display: 'flex', gap: '8px', borderBottom: `1px solid ${currentTheme.border}`, marginBottom: '24px' }}>
            {[
              { id: 'my', label: `📁 Мои пресеты (${myPresets.length})` },
              { id: 'liked', label: `❤️ Лайкнутые (${likedPresets.length})` },
              { id: 'stats', label: 'Статистика' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '10px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? `2px solid ${theme.accent}` : '2px solid transparent',
                  color: activeTab === tab.id ? theme.accent : currentTheme.textSecondary,
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeTab === tab.id ? '600' : '400',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* Мои пресеты */}
          {activeTab === 'my' && (
            <div>
              {myPresets.length === 0 ? (
                <p style={{ color: currentTheme.textSecondary, textAlign: 'center', padding: '40px' }}>
                  У вас пока нет пресетов. Создайте первый в конструкторе!
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {myPresets.map(preset => (
                    <div
                      key={preset.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px',
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        borderRadius: '12px',
                        flexWrap: 'wrap',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <h4 style={{ color: currentTheme.textPrimary, marginBottom: '4px' }}>{preset.name}</h4>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: currentTheme.textSecondary }}>
                          <span>{preset.isPublic ? '🌍 Публичный' : '🔒 Приватный'}</span>
                          <span>📅 {new Date(preset.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleEditPreset(preset.id)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: currentTheme.surfaceHover,
                            border: `1px solid ${currentTheme.border}`,
                            borderRadius: '8px',
                            color: currentTheme.textPrimary,
                            cursor: 'pointer',
                          }}
                        >
                          ✏️ Редактировать
                        </button>
                        <button
                          onClick={() => handleDeletePreset(preset.id)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#ff4757',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                            cursor: 'pointer',
                          }}
                        >
                          🗑️ Удалить
                        </button>
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
                  Вы ещё не лайкнули ни один пресет
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {likedPresets.map(preset => (
                    <div
                      key={preset.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px',
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        borderRadius: '12px',
                        flexWrap: 'wrap',
                        gap: '12px',
                        cursor: 'pointer',
                      }}
                      onClick={() => navigate(`/preset/${preset.id}`)}
                    >
                      <div>
                        <h4 style={{ color: currentTheme.textPrimary, marginBottom: '4px' }}>{preset.name}</h4>
                        <div style={{ fontSize: '12px', color: currentTheme.textSecondary }}>
                          Автор: {preset.userId}
                        </div>
                      </div>
                      <span style={{ color: currentTheme.textSecondary, fontSize: '14px' }}>👉 Перейти</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Статистика */}
          {activeTab === 'stats' && (
            <div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '24px',
              }}>
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderRadius: '16px',
                  padding: '20px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '36px', fontWeight: '700', color: theme.accent }}>{stats.totalPresets}</div>
                  <div style={{ fontSize: '14px', color: currentTheme.textSecondary }}>Всего пресетов</div>
                </div>
                
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderRadius: '16px',
                  padding: '20px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '36px', fontWeight: '700', color: theme.accent }}>{stats.totalLikes}</div>
                  <div style={{ fontSize: '14px', color: currentTheme.textSecondary }}>Всего лайков</div>
                </div>
                
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderRadius: '16px',
                  padding: '20px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '36px', fontWeight: '700', color: theme.accent }}>{stats.totalComments}</div>
                  <div style={{ fontSize: '14px', color: currentTheme.textSecondary }}>Всего комментариев</div>
                </div>
                
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderRadius: '16px',
                  padding: '20px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '36px', fontWeight: '700', color: theme.accent }}>{stats.totalViews}</div>
                  <div style={{ fontSize: '14px', color: currentTheme.textSecondary }}>Всего просмотров</div>
                </div>
              </div>
              
              {stats.mostLikedPreset && (
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderRadius: '16px',
                  padding: '20px',
                }}>
                  <h4 style={{ color: currentTheme.textPrimary, marginBottom: '12px' }}>🏆 Самый популярный пресет</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: currentTheme.textPrimary }}>{stats.mostLikedPreset.name}</div>
                      <div style={{ fontSize: '12px', color: currentTheme.textSecondary }}>
                        ❤️ {(stats.mostLikedPreset as any).likesCount || 0} лайков
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/preset/${stats.mostLikedPreset!.id}`)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: theme.accent,
                        border: 'none',
                        borderRadius: '8px',
                        color: '#000',
                        cursor: 'pointer',
                      }}
                    >
                      Перейти
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Модальное окно подтверждения удаления аккаунта */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
        }}>
          <div style={{
            backgroundColor: currentTheme.surface,
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
          }}>
            <h3 style={{ color: currentTheme.textPrimary, marginBottom: '16px' }}>Удалить аккаунт?</h3>
            <p style={{ color: currentTheme.textSecondary, marginBottom: '24px' }}>
              Это действие необратимо. Все ваши пресеты, лайки и комментарии будут удалены.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={handleDeleteAccount}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#ff4757',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Да, удалить
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: '10px 24px',
                  backgroundColor: currentTheme.surfaceHover,
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: '12px',
                  color: currentTheme.textPrimary,
                  cursor: 'pointer',
                }}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
      
      {toasts.map(toast => (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};
