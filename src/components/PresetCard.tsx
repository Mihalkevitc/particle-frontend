import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicPreset } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { useLikesStore } from '@/store/useLikesStore';
import { useToast } from '@/hooks/useToast';
import { useTheme } from '@/context/ThemeContext';

interface PresetCardProps {
  preset: PublicPreset;
}

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

export const PresetCard = ({ preset }: PresetCardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleSystemRef = useRef<any>(null);
  const { isAuthenticated } = useAuthStore();
  const { isLiked, like, unlike, loadLikedPresets } = useLikesStore();
  const { showToast } = useToast();
  const { mode, theme } = useTheme();
  const currentTheme = mode === 'dark' ? theme.dark : theme.light;
  
  const liked = isLiked(preset.id);
  const [likesCount, setLikesCount] = useState(preset.likesCount);
  const [isLiking, setIsLiking] = useState(false);

  // Инициализация мини-визуализации
  useEffect(() => {
    if (!canvasRef.current || !window.ParticleLib) return;
    
    // Подготавливаем конфиг для превью (уменьшаем количество частиц)
    const previewConfig = {
      ...preset.config,
      particleCount: Math.min(preset.config.particleCount || 500, 500),
      particleSize: (preset.config.particleSize || 4) * 0.8,
    };
    
    const initPreview = async () => {
      if (particleSystemRef.current) {
        particleSystemRef.current.destroy();
      }
      
      const ps = new window.ParticleLib.ParticleSystem();
      particleSystemRef.current = ps;
      
      await ps.init({
        canvas: canvasRef.current,
        config: previewConfig,
      });
      
      // Устанавливаем цвет фона из конфига пресета
      ps.setBackgroundColor(preset.config.canvasBgColor || '#0a0a0a');
    };
    
    initPreview();
    
    return () => {
      if (particleSystemRef.current) {
        particleSystemRef.current.destroy();
      }
    };
  }, [preset]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      showToast('Войдите, чтобы поставить лайк', 'warning');
      return;
    }

    setIsLiking(true);
    try {
      if (liked) {
        await unlike(preset.id);
        setLikesCount(prev => prev - 1);
      } else {
        await like(preset.id);
        setLikesCount(prev => prev + 1);
      }
      await loadLikedPresets();
    } catch (error) {
      console.error('Failed to toggle like:', error);
      showToast('Не удалось поставить лайк', 'error');
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
        {/* Мини-холст с визуализацией */}
        <div style={{
          backgroundColor: '#111',
          borderRadius: '12px',
          height: '150px',
          marginBottom: '12px',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <canvas
            ref={canvasRef}
            width={300}
            height={150}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
            }}
          />
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
            cursor: isAuthenticated ? 'pointer' : 'not-allowed',
            opacity: isAuthenticated ? 1 : 0.5,
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
