import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/useAuthStore';
import { useLikesStore } from '@/store/useLikesStore';
import { useToast } from '@/hooks/useToast';
import { presetsApi, PresetWithStats } from '@/api/presets';
import { commentsApi } from '@/api/comments';
import { Toast } from '@/components/Toast';

interface Comment {
  id: number;
  text: string;
  author: {
    id: number;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

declare global {
  interface Window {
    ParticleLib: {
      ParticleSystem: new () => {
        init: (config: { canvas: HTMLCanvasElement; config: any }) => Promise<void>;
        setTargetFps: (fps: number) => void;
        setBackgroundColor: (color: string) => void;
        setBorderRadius: (radius: string) => void;
        destroy: () => void;
        getActualFps: () => number;
      };
    };
  }
}

export const PresetPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { mode, theme } = useTheme();
  const { isAuthenticated, user } = useAuthStore();
  const { isLiked, like, unlike, loadLikedPresets } = useLikesStore();
  const { toasts, showToast, removeToast } = useToast();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleSystemRef = useRef<any>(null);
  const [isVisualizationInit, setIsVisualizationInit] = useState(false);
  
  const [preset, setPreset] = useState<PresetWithStats | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  
  const currentTheme = mode === 'dark' ? theme.dark : theme.light;
  const isOwner = preset && user && preset.author.id === user.id;

  // Подготовка конфига для библиотеки частиц
  const prepareConfigForLibrary = (config: any) => {
    // Берём только то, что нужно библиотеке
    return {
      particleCount: config.particleCount || 5000,
      colors: config.colors || ['#FFD700', '#FFA500'],
      particleSize: config.particleSize || 4,
      maxSpeed: config.maxSpeed || 2,
      behavior: config.behavior || 'followMouse',
      shape: config.shape || 'circle',
      initSpeed: config.initSpeed || 1.5,
      behaviorParams: config.behaviorParams || {},
    };
  };

  const loadPreset = useCallback(async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const data = await presetsApi.getPresetById(parseInt(id));
      console.log('Loaded preset:', data);
      setPreset(data);
      
      if (isAuthenticated) {
        await loadLikedPresets();
      }
    } catch (error) {
      console.error('Failed to load preset:', error);
      showToast('Не удалось загрузить пресет', 'error');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  }, [id, isAuthenticated, loadLikedPresets, showToast, navigate]);

  const loadComments = useCallback(async () => {
    if (!id) return;
    
    try {
      const data = await commentsApi.getComments(parseInt(id));
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  }, [id]);

  // Инициализация визуализации
  const initVisualization = useCallback(async () => {
    if (!canvasRef.current || !preset || !window.ParticleLib) {
      console.log('Cannot init: missing canvas, preset, or ParticleLib');
      return;
    }
    
    if (particleSystemRef.current) {
      particleSystemRef.current.destroy();
    }
    
    const libConfig = prepareConfigForLibrary(preset.config);
    console.log('Initializing ParticleLib with config:', libConfig);
    
    try {
      const ps = new window.ParticleLib.ParticleSystem();
      particleSystemRef.current = ps;
      
      await ps.init({
        canvas: canvasRef.current,
        config: libConfig,
      });
      
      // Устанавливаем цвет фона, если есть в конфиге
      if (preset.config.canvasBgColor) {
        ps.setBackgroundColor(preset.config.canvasBgColor);
      }
      
      // Устанавливаем целевой FPS
      ps.setTargetFps(60);
      
      setIsVisualizationInit(true);
      console.log('ParticleLib initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ParticleLib:', error);
    }
  }, [preset]);

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      showToast('Введите текст комментария', 'warning');
      return;
    }
    
    try {
      await commentsApi.addComment(parseInt(id!), newComment);
      setNewComment('');
      await loadComments();
      showToast('Комментарий добавлен', 'success');
    } catch (error) {
      console.error('Failed to add comment:', error);
      showToast('Не удалось добавить комментарий', 'error');
    }
  };

  const handleUpdateComment = async (commentId: number) => {
    if (!editingText.trim()) {
      showToast('Введите текст комментария', 'warning');
      return;
    }
    
    try {
      await commentsApi.updateComment(commentId, editingText);
      setEditingCommentId(null);
      setEditingText('');
      await loadComments();
      showToast('Комментарий обновлён', 'success');
    } catch (error) {
      console.error('Failed to update comment:', error);
      showToast('Не удалось обновить комментарий', 'error');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Удалить комментарий?')) return;
    
    try {
      await commentsApi.deleteComment(commentId);
      await loadComments();
      showToast('Комментарий удалён', 'success');
    } catch (error) {
      console.error('Failed to delete comment:', error);
      showToast('Не удалось удалить комментарий', 'error');
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      showToast('Войдите, чтобы поставить лайк', 'warning');
      return;
    }
    
    setIsLiking(true);
    try {
      if (isLiked(preset!.id)) {
        await unlike(preset!.id);
        setPreset(prev => prev ? { ...prev, likesCount: prev.likesCount - 1, isLikedByCurrentUser: false } : null);
      } else {
        await like(preset!.id);
        setPreset(prev => prev ? { ...prev, likesCount: prev.likesCount + 1, isLikedByCurrentUser: true } : null);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
      showToast('Не удалось поставить лайк', 'error');
    } finally {
      setIsLiking(false);
    }
  };

  const handleDeletePreset = async () => {
    if (!confirm('Удалить пресет? Это действие нельзя отменить.')) return;
    
    try {
      await presetsApi.deletePreset(parseInt(id!));
      showToast('Пресет удалён', 'success');
      navigate('/profile');
    } catch (error) {
      console.error('Failed to delete preset:', error);
      showToast('Не удалось удалить пресет', 'error');
    }
  };

  const handleTogglePublic = async () => {
    if (!preset) return;
    
    try {
      await presetsApi.updatePublicStatus(parseInt(id!), !preset.isPublic);
      setPreset(prev => prev ? { ...prev, isPublic: !prev.isPublic } : null);
      showToast(preset.isPublic ? 'Пресет скрыт' : 'Пресет опубликован', 'success');
    } catch (error) {
      console.error('Failed to toggle public status:', error);
      showToast('Не удалось изменить статус', 'error');
    }
  };

  const handleEditPreset = () => {
    navigate(`/constructor?id=${id}`);
  };

  const handleCopyCode = () => {
    if (!preset) return;
    
    const libConfig = prepareConfigForLibrary(preset.config);
    const embedCode = `<script src="https://cdn.jsdelivr.net/gh/Mihalkevitc/particle-lib@main/dist/particle-lib.umd.js"><\/script>
<script>
  const ps = new ParticleLib.ParticleSystem();
  ps.init({
    canvas: document.getElementById('particle-canvas'),
    config: ${JSON.stringify(libConfig, null, 2)}
  });
<\/script>`;
    
    navigator.clipboard.writeText(embedCode);
    showToast('Код скопирован в буфер обмена', 'success');
  };

  useEffect(() => {
    loadPreset();
    loadComments();
  }, [loadPreset, loadComments]);

  // Инициализируем визуализацию после загрузки preset
  useEffect(() => {
    if (preset && !isVisualizationInit && window.ParticleLib) {
      const timer = setTimeout(() => {
        initVisualization();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [preset, isVisualizationInit, initVisualization]);

  // Загружаем библиотеку
  useEffect(() => {
    if (!window.ParticleLib) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/gh/Mihalkevitc/particle-lib@main/dist/particle-lib.umd.js';
      script.onload = () => {
        console.log('ParticleLib loaded');
        if (preset && !isVisualizationInit) {
          initVisualization();
        }
      };
      document.body.appendChild(script);
    }
  }, [preset, isVisualizationInit, initVisualization]);

  useEffect(() => {
    return () => {
      if (particleSystemRef.current) {
        particleSystemRef.current.destroy();
      }
    };
  }, []);

  if (isLoading || !preset) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: currentTheme.textPrimary }}>
        Загрузка...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: currentTheme.background, padding: '24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Canvas */}
        <div style={{
          backgroundColor: currentTheme.surface,
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '24px',
          border: `1px solid ${currentTheme.border}`,
          position: 'relative',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
          }}>
            <canvas
              ref={canvasRef}
              width={800}
              height={500}
              style={{
                width: '100%',
                maxWidth: '800px',
                height: 'auto',
                display: 'block',
                borderRadius: '12px',
                boxShadow: mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)',
                backgroundColor: preset.config.canvasBgColor || '#0a0a0a',
              }}
            />
          </div>
        </div>
        
        {/* Информация о пресете */}
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
                {preset.name}
              </h1>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', color: currentTheme.textSecondary, fontSize: '14px' }}>
                <span>Автор: {preset.author.email?.split('@')[0] || 'Пользователь'}</span>
                <span>📅 {new Date(preset.createdAt).toLocaleDateString()}</span>
                <span>{preset.isPublic ? '🌍 Публичный' : '🔒 Приватный'}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={handleLike}
                disabled={isLiking}
                style={{
                  padding: '10px 20px',
                  backgroundColor: preset.isLikedByCurrentUser ? '#ff4757' : currentTheme.surfaceHover,
                  border: `1px solid ${preset.isLikedByCurrentUser ? '#ff4757' : currentTheme.border}`,
                  borderRadius: '12px',
                  color: preset.isLikedByCurrentUser ? '#fff' : currentTheme.textPrimary,
                  cursor: isAuthenticated ? 'pointer' : 'not-allowed',
                  opacity: isAuthenticated ? 1 : 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>{preset.isLikedByCurrentUser ? '❤️' : '🤍'}</span>
                <span>{preset.likesCount}</span>
              </button>
              
              <button
                onClick={handleCopyCode}
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
                📋 Скопировать код
              </button>
              
              {isOwner && (
                <>
                  <button
                    onClick={handleEditPreset}
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
                  <button
                    onClick={handleTogglePublic}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: currentTheme.surfaceHover,
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: '12px',
                      color: currentTheme.textPrimary,
                      cursor: 'pointer',
                    }}
                  >
                    {preset.isPublic ? '🔒 Сделать приватным' : '🌍 Опубликовать'}
                  </button>
                  <button
                    onClick={handleDeletePreset}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#ff4757',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    🗑️ Удалить
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '24px', marginTop: '24px', paddingTop: '16px', borderTop: `1px solid ${currentTheme.border}` }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '600', color: currentTheme.textPrimary }}>{preset.viewsCount}</div>
              <div style={{ fontSize: '12px', color: currentTheme.textSecondary }}>просмотров</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '600', color: currentTheme.textPrimary }}>{preset.likesCount}</div>
              <div style={{ fontSize: '12px', color: currentTheme.textSecondary }}>лайков</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '600', color: currentTheme.textPrimary }}>{comments.length}</div>
              <div style={{ fontSize: '12px', color: currentTheme.textSecondary }}>комментариев</div>
            </div>
          </div>
        </div>
        
        {/* Комментарии */}
        <div style={{
          backgroundColor: currentTheme.surface,
          borderRadius: '20px',
          padding: '24px',
          border: `1px solid ${currentTheme.border}`,
        }}>
          <h3 style={{ fontSize: '20px', color: currentTheme.textPrimary, marginBottom: '20px' }}>
            Комментарии ({comments.length})
          </h3>
          
          {isAuthenticated && (
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Напишите комментарий..."
                rows={2}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: '12px',
                  color: currentTheme.textPrimary,
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
              <button
                onClick={handleAddComment}
                style={{
                  padding: '0 24px',
                  backgroundColor: theme.accent,
                  border: 'none',
                  borderRadius: '12px',
                  color: '#000',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Отправить
              </button>
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {comments.length === 0 ? (
              <p style={{ color: currentTheme.textSecondary, textAlign: 'center', padding: '40px' }}>
                Нет комментариев. Будьте первым!
              </p>
            ) : (
              comments.map(comment => (
                <div key={comment.id} style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                  {editingCommentId === comment.id ? (
                    <div>
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        rows={2}
                        style={{
                          width: '100%',
                          padding: '12px',
                          backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                          border: `1px solid ${currentTheme.border}`,
                          borderRadius: '12px',
                          color: currentTheme.textPrimary,
                          fontFamily: 'inherit',
                          resize: 'vertical',
                        }}
                      />
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <button onClick={() => handleUpdateComment(comment.id)} style={{ padding: '6px 16px', backgroundColor: theme.accent, border: 'none', borderRadius: '8px', color: '#000', cursor: 'pointer' }}>Сохранить</button>
                        <button onClick={() => { setEditingCommentId(null); setEditingText(''); }} style={{ padding: '6px 16px', backgroundColor: currentTheme.surfaceHover, border: `1px solid ${currentTheme.border}`, borderRadius: '8px', color: currentTheme.textPrimary, cursor: 'pointer' }}>Отмена</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <span style={{ fontWeight: '600', color: currentTheme.textPrimary }}>
                            {comment.author.email?.split('@')[0] || 'Пользователь'}
                          </span>
                          <span style={{ fontSize: '11px', color: currentTheme.textSecondary, marginLeft: '12px' }}>
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {isAuthenticated && comment.author.id === user?.id && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => { setEditingCommentId(comment.id); setEditingText(comment.text); }} style={{ background: 'none', border: 'none', color: currentTheme.textSecondary, cursor: 'pointer', fontSize: '16px' }}>✏️</button>
                            <button onClick={() => handleDeleteComment(comment.id)} style={{ background: 'none', border: 'none', color: '#ff4757', cursor: 'pointer', fontSize: '16px' }}>🗑️</button>
                          </div>
                        )}
                      </div>
                      <p style={{ color: currentTheme.textPrimary, lineHeight: 1.5 }}>{comment.text}</p>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {toasts.map(toast => (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};
