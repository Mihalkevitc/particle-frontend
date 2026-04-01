import { useEffect, useState } from 'react';
import { presetsApi } from '@/api/presets';
import { PresetCard } from '@/components/PresetCard';
import { PublicPreset } from '@/types';

export const Feed = () => {
  const [presets, setPresets] = useState<PublicPreset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPresets = async () => {
    setIsLoading(true);
    try {
      const data = await presetsApi.getPublicFeed();
      setPresets(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Не удалось загрузить ленту');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPresets();
  }, []);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
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
      <h1 style={{ fontSize: '32px', marginBottom: '24px' }}>Публичные визуализации</h1>
      {presets.length === 0 ? (
        <p style={{ color: '#888', textAlign: 'center', padding: '60px' }}>
          Пока нет публичных пресетов. Будь первым!
        </p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px',
        }}>
          {presets.map((preset) => (
            <PresetCard key={preset.id} preset={preset} onLikeChange={loadPresets} />
          ))}
        </div>
      )}
    </div>
  );
};
