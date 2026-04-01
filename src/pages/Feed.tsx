import { useEffect, useState, useCallback } from 'react';
import { presetsApi } from '@/api/presets';
import { PresetCard } from '@/components/PresetCard';
import { Toast } from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/store/useAuthStore';
import { useLikesStore } from '@/store/useLikesStore';
import { useTheme } from '@/context/ThemeContext';
import { PublicPreset } from '@/types';

export const Feed = () => {
  const [presets, setPresets] = useState<PublicPreset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { isAuthenticated } = useAuthStore();
  const { loadLikedPresets } = useLikesStore();
  const { mode, theme } = useTheme();
  const { toasts, showToast, removeToast } = useToast();
  
  const currentTheme = mode === 'dark' ? theme.dark : theme.light;

  const loadPresets = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await presetsApi.getPublicFeed();
      setPresets(data);
      setError(null);
      
      // Загружаем лайкнутые пресеты для авторизованного пользователя
      if (isAuthenticated) {
        await loadLikedPresets();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Не удалось загрузить ленту');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, loadLikedPresets]);

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: currentTheme.textPrimary }}>
        Загрузка пресетов...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#f00' }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '24px', color: currentTheme.textPrimary }}>
        Публичные визуализации
      </h1>
      {presets.length === 0 ? (
        <p style={{ color: currentTheme.textSecondary, textAlign: 'center', padding: '60px' }}>
          Пока нет публичных пресетов. Будь первым!
        </p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px',
        }}>
          {presets.map((preset) => (
            <PresetCard 
              key={preset.id} 
              preset={preset} 
            />
          ))}
        </div>
      )}
      
      {/* Toast уведомления */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};
