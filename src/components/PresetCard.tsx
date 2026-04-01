import { Link } from 'react-router-dom';
import { PublicPreset } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { useLikesStore } from '@/store/useLikesStore';
import { useToast } from '@/hooks/useToast';
import { useTheme } from '@/context/ThemeContext';
import { useState, useEffect } from 'react';

interface PresetCardProps {
  preset: PublicPreset;
}

export const PresetCard = ({ preset }: PresetCardProps) => {
  const { isAuthenticated } = useAuthStore();
  const { isLiked, like, unlike } = useLikesStore();
  const { showToast } = useToast();
  const { mode, theme } = useTheme();
  const currentTheme = mode === 'dark' ? theme.dark : theme.light;
  
  const [isLiking, setIsLiking] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(preset.likesCount);

  useEffect(() => {
    setLiked(isLiked(preset.id));
  }, [preset.id, isLiked]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Если не авторизован — показываем уведомление
    if (!isAuthenticated) {
      showToast('❤️ Чтобы поставить лайк, войдите в аккаунт', 'warning');
      return;
    }

    setIsLiking(true);
    try {
      if (liked) {
        await unlike(preset.id);
        setLikesCount(prev => prev - 1);
        setLiked(false);
      } else {
        await like(preset.id);
        setLikesCount(prev => prev + 1);
        setLiked(true);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
      showToast('Не удалось поставить лайк. Попробуйте позже.', 'error');
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <Link to={`/preset/${preset.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        backgroundColor: currentTheme.surface,
        borderRadius: '16px',
        padding: '16px',
        border: `1px solid ${currentTheme.border}`,
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = mode === 'dark' 
          ? '0 8px 24px rgba(0,0,0,0.3)' 
          : '0 8px 24px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}>
        <div style={{
          backgroundColor: mode === 'dark' ? '#111' : '#e0e0e0',
          borderRadius: '12px',
          height: '150px',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
        }}>
          🎨
        </div>

        <h3 style={{ color: currentTheme.textPrimary, fontSize: '18px', marginBottom: '8px' }}>
          {preset.name}
        </h3>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ color: currentTheme.textSecondary, fontSize: '12px' }}>
            {preset.author?.email?.split('@')[0] || 'Пользователь'}
          </span>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ color: currentTheme.textSecondary, fontSize: '12px' }}>❤️ {likesCount}</span>
            <span style={{ color: currentTheme.textSecondary, fontSize: '12px' }}>💬 {preset.commentsCount}</span>
            <span style={{ color: currentTheme.textSecondary, fontSize: '12px' }}>👁️ {preset.viewsCount}</span>
          </div>
        </div>

        <button
          onClick={handleLike}
          disabled={isLiking}
          style={{
            marginTop: '8px',
            padding: '8px',
            backgroundColor: 'transparent',
            border: `1px solid ${liked ? '#ff4757' : currentTheme.border}`,
            borderRadius: '8px',
            color: liked ? '#ff4757' : currentTheme.textPrimary,
            cursor: !isAuthenticated ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
          title={!isAuthenticated ? 'Войдите, чтобы поставить лайк' : ''}
        >
          <span style={{ fontSize: '16px' }}>{liked ? '❤️' : '🤍'}</span>
          <span>{liked ? 'Лайкнут' : 'Лайкнуть'}</span>
        </button>
      </div>
    </Link>
  );
};
