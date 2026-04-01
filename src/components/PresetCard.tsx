import { Link } from 'react-router-dom';
import { PublicPreset } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { likesApi } from '@/api/likes';
import { useState } from 'react';

interface PresetCardProps {
  preset: PublicPreset;
  onLikeChange?: () => void;
}

export const PresetCard = ({ preset, onLikeChange }: PresetCardProps) => {
  const { isAuthenticated } = useAuthStore();
  const [isLiking, setIsLiking] = useState(false);
  const [liked, setLiked] = useState(preset.isLikedByCurrentUser);
  const [likesCount, setLikesCount] = useState(preset.likesCount);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault(); // Предотвращаем переход по ссылке
    if (!isAuthenticated) return;

    setIsLiking(true);
    try {
      if (liked) {
        await likesApi.unlike(preset.id);
        setLikesCount(prev => prev - 1);
      } else {
        await likesApi.like(preset.id);
        setLikesCount(prev => prev + 1);
      }
      setLiked(!liked);
      onLikeChange?.();
    } catch (error) {
      console.error('Failed to toggle like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <Link
      to={`/preset/${preset.id}`}
      style={{ textDecoration: 'none' }}
    >
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: '16px',
        padding: '16px',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}>
        {/* Canvas preview placeholder */}
        <div style={{
          backgroundColor: '#111',
          borderRadius: '12px',
          height: '150px',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${preset.config.colors?.[0] || '#333'}20, #000)`,
          fontSize: '32px',
        }}>
          🎨
        </div>

        <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '8px' }}>{preset.name}</h3>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ color: '#888', fontSize: '12px' }}>{preset.author?.email || 'Пользователь удалён'}</span>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ color: '#888', fontSize: '12px' }}>❤️ {likesCount}</span>
            <span style={{ color: '#888', fontSize: '12px' }}>💬 {preset.commentsCount}</span>
            <span style={{ color: '#888', fontSize: '12px' }}>👁️ {preset.viewsCount}</span>
          </div>
        </div>

        <button
          onClick={handleLike}
          disabled={!isAuthenticated || isLiking}
          style={{
            marginTop: '8px',
            padding: '8px',
            backgroundColor: liked ? '#ff4757' : 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            cursor: isAuthenticated ? 'pointer' : 'not-allowed',
            opacity: isAuthenticated ? 1 : 0.5,
          }}
        >
          {isLiking ? '...' : (liked ? '❤️ Лайкнут' : '🤍 Лайкнуть')}
        </button>
      </div>
    </Link>
  );
};
