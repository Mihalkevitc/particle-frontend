import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/hooks/useToast';
import { presetsApi } from '@/api/presets';
import { Toast } from '@/components/Toast';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';

interface ExtendedParticleConfig {
  particleCount: number;
  colors: string[];
  particleSize: number;
  maxSpeed: number;
  behavior: string;
  behaviorParams?: Record<string, any>;
  shape?: 'square' | 'circle' | 'triangle';
  initSpeed?: number;
  canvasBgColor?: string;
  canvasWidth?: number;
  canvasHeight?: number;
}

declare global {
  interface Window {
    ParticleLib: {
      ParticleSystem: new () => {
        init: (config: { canvas: HTMLCanvasElement; config: ExtendedParticleConfig }) => Promise<void>;
        setBehavior: (name: string, params?: any) => void;
        setTargetFps: (fps: number) => void;
        setBackgroundColor: (color: string) => void;
        setBorderRadius: (radius: string) => void;
        setCanvasSize: (width: number, height: number) => void;
        destroy: () => void;
        getActualFps: () => number;
      };
    };
  }
}

export const Constructor = () => {
  const { mode, theme } = useTheme();
  const { isAuthenticated } = useAuthStore();
  const { toasts, showToast, removeToast } = useToast();
  const [searchParams] = useSearchParams();
  const presetId = searchParams.get('id');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleSystemRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'appearance' | 'behavior'>('basic');
  
  const [canvasSize, setCanvasSize] = useState({ width: 900, height: 600 });
  const [canvasBgColor, setCanvasBgColor] = useState('#0a0a0a');
  const [borderRadius, setBorderRadius] = useState(16);
  
  const [particleCount, setParticleCount] = useState(5000);
  const [particleSize, setParticleSize] = useState(4);
  const [particleShape, setParticleShape] = useState<'square' | 'circle' | 'triangle'>('circle');
  const [initSpeed, setInitSpeed] = useState(1.5);
  const [colors, setColors] = useState<string[]>(['#FFD700', '#FFA500', '#FF8C00', '#FFB347', '#FFCC66']);
  const [newColor, setNewColor] = useState('#FFD700');
  const [selectedBehavior, setSelectedBehavior] = useState('followMouse');
  const [targetFps, setTargetFps] = useState(60);
  const [actualFps, setActualFps] = useState(0);
  
  const [followSpeed, setFollowSpeed] = useState(2);
  const [gravityStrength, setGravityStrength] = useState(0.1);
  const [gravityMaxSpeed, setGravityMaxSpeed] = useState(4);
  const [repulseRadius, setRepulseRadius] = useState(150);
  const [repulseForce, setRepulseForce] = useState(3);
  const [repulseDamping, setRepulseDamping] = useState(0.97);
  const [magneticStrength, setMagneticStrength] = useState(0.02);
  const [magneticFieldStrength, setMagneticFieldStrength] = useState(1.5);
  const [magneticRadius, setMagneticRadius] = useState(200);
  const [magneticMaxSpeed, setMagneticMaxSpeed] = useState(4);
  const [vortexStrength, setVortexStrength] = useState(0.15);
  const [vortexRadius, setVortexRadius] = useState(200);
  const [vortexMaxSpeed, setVortexMaxSpeed] = useState(4);
  const [waveAmplitude, setWaveAmplitude] = useState(0.8);
  const [waveFrequency, setWaveFrequency] = useState(0.015);
  const [waveSpeed, setWaveSpeed] = useState(0.03);
  const [waveMaxSpeed, setWaveMaxSpeed] = useState(3);
  const [explosionRadius, setExplosionRadius] = useState(150);
  const [explosionDuration, setExplosionDuration] = useState(10);
  const [explosionDamping, setExplosionDamping] = useState(0.99);

  const currentTheme = mode === 'dark' ? theme.dark : theme.light;

  const addColor = () => {
    if (!colors.includes(newColor)) {
      setColors([...colors, newColor]);
    }
  };

  const removeColor = (colorToRemove: string) => {
    if (colors.length > 1) {
      setColors(colors.filter(c => c !== colorToRemove));
    } else {
      showToast('Должен быть хотя бы один цвет', 'warning');
    }
  };

  const getBehaviorParams = () => {
    switch (selectedBehavior) {
      case 'followMouse':
        return { speed: followSpeed };
      case 'gravity':
        return { strength: gravityStrength, maxSpeed: gravityMaxSpeed };
      case 'repulse':
        return { radius: repulseRadius, force: repulseForce, damping: repulseDamping, minSpeed: 0.2 };
      case 'magneticField':
        return { strength: magneticStrength, fieldStrength: magneticFieldStrength, radius: magneticRadius, maxSpeed: magneticMaxSpeed };
      case 'vortex':
        return { strength: vortexStrength, radius: vortexRadius, maxSpeed: vortexMaxSpeed };
      case 'wave':
        return { amplitude: waveAmplitude, frequency: waveFrequency, speed: waveSpeed, maxSpeed: waveMaxSpeed };
      case 'explosion':
        return { radius: explosionRadius, duration: explosionDuration, damping: explosionDamping };
      default:
        return {};
    }
  };

  const initParticleSystem = useCallback(async () => {
    if (!canvasRef.current || !window.ParticleLib) return;
    
    setIsLoading(true);
    try {
      if (particleSystemRef.current) {
        particleSystemRef.current.destroy();
      }
      
      const ps = new window.ParticleLib.ParticleSystem();
      particleSystemRef.current = ps;
      
      const libConfig: ExtendedParticleConfig = {
        particleCount,
        colors,
        particleSize,
        maxSpeed: 2,
        behavior: selectedBehavior,
        shape: particleShape,
        initSpeed,
      };
      
      await ps.init({
        canvas: canvasRef.current,
        config: libConfig,
      });
      
      ps.setTargetFps(Math.min(targetFps, 60));
      ps.setBackgroundColor(canvasBgColor);
      ps.setBorderRadius(`${borderRadius}px`);
      
      const params = getBehaviorParams();
      if (Object.keys(params).length > 0) {
        ps.setBehavior(selectedBehavior, params);
      }
      
      const fpsInterval = setInterval(() => {
        if (particleSystemRef.current?.getActualFps) {
          setActualFps(particleSystemRef.current.getActualFps());
        }
      }, 500);
      
      return () => clearInterval(fpsInterval);
    } catch (error) {
      console.error('Failed to init particle system:', error);
      showToast('Не удалось инициализировать визуализацию', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [particleCount, colors, particleSize, particleShape, initSpeed, selectedBehavior, targetFps, canvasBgColor, borderRadius, followSpeed, gravityStrength, gravityMaxSpeed, repulseRadius, repulseForce, repulseDamping, magneticStrength, magneticFieldStrength, magneticRadius, magneticMaxSpeed, vortexStrength, vortexRadius, vortexMaxSpeed, waveAmplitude, waveFrequency, waveSpeed, waveMaxSpeed, explosionRadius, explosionDuration, explosionDamping]);

  const loadPreset = useCallback(async (id: number) => {
    setIsLoading(true);
    try {
      const preset = await presetsApi.getPresetById(id);
      setPresetName(preset.name);
      setIsPublic(preset.isPublic);
      
      const config = preset.config as ExtendedParticleConfig;
      setParticleCount(config.particleCount);
      setParticleSize(config.particleSize);
      setParticleShape(config.shape || 'circle');
      setInitSpeed(config.initSpeed || 1.5);
      setColors(config.colors);
      setSelectedBehavior(config.behavior);
      
      const params = config.behaviorParams || {};
      setFollowSpeed(params.speed || 2);
      setGravityStrength(params.strength || 0.1);
      setGravityMaxSpeed(params.maxSpeed || 4);
      setRepulseRadius(params.radius || 150);
      setRepulseForce(params.force || 3);
      setRepulseDamping(params.damping || 0.97);
      setMagneticStrength(params.strength || 0.02);
      setMagneticFieldStrength(params.fieldStrength || 1.5);
      setMagneticRadius(params.radius || 200);
      setMagneticMaxSpeed(params.maxSpeed || 4);
      setVortexStrength(params.strength || 0.15);
      setVortexRadius(params.radius || 200);
      setVortexMaxSpeed(params.maxSpeed || 4);
      setWaveAmplitude(params.amplitude || 0.8);
      setWaveFrequency(params.frequency || 0.015);
      setWaveSpeed(params.speed || 0.03);
      setWaveMaxSpeed(params.maxSpeed || 3);
      setExplosionRadius(params.radius || 150);
      setExplosionDuration(params.duration || 10);
      setExplosionDamping(params.damping || 0.99);
      
      if (config.canvasBgColor) setCanvasBgColor(config.canvasBgColor);
      if (config.canvasWidth && config.canvasHeight) {
        setCanvasSize({ width: config.canvasWidth, height: config.canvasHeight });
      }
      
      showToast('Пресет загружен', 'success');
    } catch (error) {
      console.error('Failed to load preset:', error);
      showToast('Не удалось загрузить пресет', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const savePreset = async () => {
    if (!presetName.trim()) {
      showToast('Введите название пресета', 'warning');
      return;
    }
    
    setIsLoading(true);
    try {
      const config: ExtendedParticleConfig = {
        particleCount,
        colors,
        particleSize,
        maxSpeed: 2,
        behavior: selectedBehavior,
        shape: particleShape,
        initSpeed,
        behaviorParams: getBehaviorParams(),
        canvasBgColor,
        canvasWidth: canvasSize.width,
        canvasHeight: canvasSize.height,
      };
      
      if (presetId) {
        await presetsApi.updatePreset(parseInt(presetId), { name: presetName, config, isPublic });
        showToast('Пресет обновлён', 'success');
      } else {
        const newPreset = await presetsApi.createPreset({ name: presetName, config, isPublic });
        showToast('Пресет сохранён', 'success');
        window.history.replaceState({}, '', `/constructor?id=${newPreset.id}`);
      }
    } catch (error) {
      console.error('Failed to save preset:', error);
      showToast('Не удалось сохранить пресет', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const updateBehavior = (behavior: string) => {
    setSelectedBehavior(behavior);
    if (particleSystemRef.current) {
      particleSystemRef.current.setBehavior(behavior, getBehaviorParams());
    }
  };

  const applySettings = () => {
    if (particleSystemRef.current) {
      initParticleSystem();
    }
  };

  const resetToDefaults = () => {
    setParticleCount(5000);
    setParticleSize(4);
    setParticleShape('circle');
    setInitSpeed(1.5);
    setColors(['#FFD700', '#FFA500', '#FF8C00', '#FFB347', '#FFCC66']);
    setSelectedBehavior('followMouse');
    setCanvasBgColor('#0a0a0a');
    setBorderRadius(16);
    setTargetFps(60);
    setFollowSpeed(2);
    setGravityStrength(0.1);
    setGravityMaxSpeed(4);
    setRepulseRadius(150);
    setRepulseForce(3);
    setMagneticStrength(0.02);
    setMagneticFieldStrength(1.5);
    setMagneticRadius(200);
    setVortexStrength(0.15);
    setVortexRadius(200);
    setWaveAmplitude(0.8);
    setWaveFrequency(0.015);
    setWaveSpeed(0.03);
    setExplosionRadius(150);
    setExplosionDuration(10);
    showToast('Сброшено к стандартным настройкам', 'success');
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/gh/Mihalkevitc/particle-lib@main/dist/particle-lib.umd.js';
    script.onload = () => {
      if (presetId) {
        loadPreset(parseInt(presetId));
      } else {
        initParticleSystem();
      }
    };
    document.body.appendChild(script);
    
    return () => {
      if (particleSystemRef.current) {
        particleSystemRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (particleSystemRef.current && !isLoading) {
      applySettings();
    }
  }, [particleCount, particleSize, particleShape, initSpeed, colors]);

  useEffect(() => {
    if (particleSystemRef.current && !isLoading) {
      particleSystemRef.current.setBehavior(selectedBehavior, getBehaviorParams());
    }
  }, [selectedBehavior, followSpeed, gravityStrength, gravityMaxSpeed, repulseRadius, repulseForce, repulseDamping, magneticStrength, magneticFieldStrength, magneticRadius, magneticMaxSpeed, vortexStrength, vortexRadius, vortexMaxSpeed, waveAmplitude, waveFrequency, waveSpeed, waveMaxSpeed, explosionRadius, explosionDuration, explosionDamping]);

  const renderBehaviorParams = () => {
    switch (selectedBehavior) {
      case 'followMouse':
        return (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: currentTheme.textPrimary, fontSize: '14px', fontWeight: '500' }}>
              Скорость следования {followSpeed}
            </label>
            <input type="range" min="0.5" max="10" step="0.5" value={followSpeed} onChange={(e) => setFollowSpeed(parseFloat(e.target.value))} style={{ width: '100%' }} />
          </div>
        );
      case 'gravity':
        return (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: currentTheme.textPrimary, fontSize: '14px', fontWeight: '500' }}>
                Сила притяжения {gravityStrength}
              </label>
              <input type="range" min="0.02" max="0.3" step="0.01" value={gravityStrength} onChange={(e) => setGravityStrength(parseFloat(e.target.value))} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: currentTheme.textPrimary, fontSize: '14px', fontWeight: '500' }}>
                Макс скорость {gravityMaxSpeed}
              </label>
              <input type="range" min="2" max="8" step="0.5" value={gravityMaxSpeed} onChange={(e) => setGravityMaxSpeed(parseFloat(e.target.value))} style={{ width: '100%' }} />
            </div>
          </>
        );
      case 'repulse':
        return (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: currentTheme.textPrimary, fontSize: '14px', fontWeight: '500' }}>
                Радиус отталкивания {repulseRadius}
              </label>
              <input type="range" min="50" max="400" step="10" value={repulseRadius} onChange={(e) => setRepulseRadius(parseInt(e.target.value))} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: currentTheme.textPrimary, fontSize: '14px', fontWeight: '500' }}>
                Сила отталкивания {repulseForce}
              </label>
              <input type="range" min="0.5" max="8" step="0.5" value={repulseForce} onChange={(e) => setRepulseForce(parseFloat(e.target.value))} style={{ width: '100%' }} />
            </div>
          </>
        );
      case 'magneticField':
        return (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: currentTheme.textPrimary, fontSize: '14px', fontWeight: '500' }}>
                Сила поля {magneticStrength}
              </label>
              <input type="range" min="0.005" max="0.08" step="0.005" value={magneticStrength} onChange={(e) => setMagneticStrength(parseFloat(e.target.value))} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: currentTheme.textPrimary, fontSize: '14px', fontWeight: '500' }}>
                Сила притяжения к курсору {magneticFieldStrength}
              </label>
              <input type="range" min="0.5" max="4" step="0.1" value={magneticFieldStrength} onChange={(e) => setMagneticFieldStrength(parseFloat(e.target.value))} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: currentTheme.textPrimary, fontSize: '14px', fontWeight: '500' }}>
                Радиус действия {magneticRadius}
              </label>
              <input type="range" min="50" max="400" step="10" value={magneticRadius} onChange={(e) => setMagneticRadius(parseInt(e.target.value))} style={{ width: '100%' }} />
            </div>
          </>
        );
      case 'vortex':
        return (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: currentTheme.textPrimary, fontSize: '14px', fontWeight: '500' }}>
                Сила вихря {vortexStrength}
              </label>
              <input type="range" min="0.05" max="2.5" step="0.01" value={vortexStrength} onChange={(e) => setVortexStrength(parseFloat(e.target.value))} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: currentTheme.textPrimary, fontSize: '14px', fontWeight: '500' }}>
                Радиус вихря {vortexRadius}
              </label>
              <input type="range" min="100" max="500" step="10" value={vortexRadius} onChange={(e) => setVortexRadius(parseInt(e.target.value))} style={{ width: '100%' }} />
            </div>
          </>
        );
      case 'wave':
        return (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: currentTheme.textPrimary, fontSize: '14px', fontWeight: '500' }}>
                Амплитуда волны {waveAmplitude}
              </label>
              <input type="range" min="0.1" max="2" step="0.1" value={waveAmplitude} onChange={(e) => setWaveAmplitude(parseFloat(e.target.value))} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: currentTheme.textPrimary, fontSize: '14px', fontWeight: '500' }}>
                Частота волны {waveFrequency}
              </label>
              <input type="range" min="0.005" max="0.04" step="0.001" value={waveFrequency} onChange={(e) => setWaveFrequency(parseFloat(e.target.value))} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: currentTheme.textPrimary, fontSize: '14px', fontWeight: '500' }}>
                Скорость волны {waveSpeed}
              </label>
              <input type="range" min="0.1" max="0.8" step="0.005" value={waveSpeed} onChange={(e) => setWaveSpeed(parseFloat(e.target.value))} style={{ width: '100%' }} />
            </div>
          </>
        );
      case 'explosion':
        return (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: currentTheme.textPrimary, fontSize: '14px', fontWeight: '500' }}>
                Радиус взрыва {explosionRadius}
              </label>
              <input type="range" min="50" max="400" step="10" value={explosionRadius} onChange={(e) => setExplosionRadius(parseInt(e.target.value))} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: currentTheme.textPrimary, fontSize: '14px', fontWeight: '500' }}>
                Длительность эффекта {explosionDuration}
              </label>
              <input type="range" min="5" max="30" step="1" value={explosionDuration} onChange={(e) => setExplosionDuration(parseInt(e.target.value))} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: currentTheme.textPrimary, fontSize: '14px', fontWeight: '500' }}>
                Торможение {explosionDamping}
              </label>
              <input type="range" min="0.95" max="0.999" step="0.001" value={explosionDamping} onChange={(e) => setExplosionDamping(parseFloat(e.target.value))} style={{ width: '100%' }} />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: currentTheme.textPrimary, fontSize: '14px', fontWeight: '500' }}>
                Количество частиц {particleCount}
              </label>
              <input type="range" min="100" max="15000" step="100" value={particleCount} onChange={(e) => setParticleCount(parseInt(e.target.value))} style={{ width: '100%' }} />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: currentTheme.textPrimary, fontSize: '14px', fontWeight: '500' }}>
                Размер частиц {particleSize}
              </label>
              <input type="range" min="2" max="10" step="0.5" value={particleSize} onChange={(e) => setParticleSize(parseFloat(e.target.value))} style={{ width: '100%' }} />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: currentTheme.textPrimary, fontSize: '14px', fontWeight: '500' }}>
                Форма частиц
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {(['square', 'circle', 'triangle'] as const).map(shape => (
                  <button key={shape} onClick={() => setParticleShape(shape)} style={{
                    flex: 1, padding: '10px', backgroundColor: particleShape === shape ? theme.accent : currentTheme.surfaceHover,
                    border: `1px solid ${particleShape === shape ? theme.accent : currentTheme.border}`, borderRadius: '8px',
                    color: particleShape === shape ? '#000' : currentTheme.textPrimary, cursor: 'pointer',
                    fontWeight: particleShape === shape ? '600' : '400',
                  }}>
                    {shape === 'square' ? 'Квадрат' : shape === 'circle' ? 'Круг' : 'Треугольник'}
                  </button>
                ))}
              </div>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: currentTheme.textPrimary, fontSize: '14px', fontWeight: '500' }}>
                Начальная скорость {initSpeed}
              </label>
              <input type="range" min="0.5" max="3" step="0.1" value={initSpeed} onChange={(e) => setInitSpeed(parseFloat(e.target.value))} style={{ width: '100%' }} />
            </div>
          </>
        );
      
      case 'appearance':
        return (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: currentTheme.textPrimary, fontSize: '14px', fontWeight: '500' }}>
                Цвета частиц
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                {colors.map(color => (
                  <div key={color} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '40px', height: '40px', backgroundColor: color, borderRadius: '8px', border: `2px solid ${currentTheme.border}` }} />
                    <button onClick={() => removeColor(color)} style={{ background: 'none', border: 'none', color: '#f00', cursor: 'pointer', fontSize: '18px' }}>✕</button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} style={{ width: '50px', height: '40px', cursor: 'pointer' }} />
                <button onClick={addColor} style={{ padding: '8px 16px', backgroundColor: theme.accent, border: 'none', borderRadius: '8px', color: '#000', cursor: 'pointer' }}>Добавить цвет</button>
              </div>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: currentTheme.textPrimary, fontSize: '14px', fontWeight: '500' }}>
                Цвет фона холста
              </label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input type="color" value={canvasBgColor} onChange={(e) => setCanvasBgColor(e.target.value)} style={{ width: '60px', height: '40px', cursor: 'pointer' }} />
                <input type="text" value={canvasBgColor} onChange={(e) => setCanvasBgColor(e.target.value)} style={{ flex: 1, padding: '10px', backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', border: `1px solid ${currentTheme.border}`, borderRadius: '8px', color: currentTheme.textPrimary }} />
              </div>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: currentTheme.textPrimary, fontSize: '14px', fontWeight: '500' }}>
                Скругление углов {borderRadius}px
              </label>
              <input type="range" min="0" max="50" step="1" value={borderRadius} onChange={(e) => { setBorderRadius(parseInt(e.target.value)); if (particleSystemRef.current) { particleSystemRef.current.setBorderRadius(`${parseInt(e.target.value)}px`); } }} style={{ width: '100%' }} />
            </div>
          </>
        );
      
      case 'behavior':
        return (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: currentTheme.textPrimary, fontSize: '14px', fontWeight: '500' }}>
                Поведение частиц
              </label>
              <select value={selectedBehavior} onChange={(e) => updateBehavior(e.target.value)} style={{
                width: '100%', padding: '10px', backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                border: `1px solid ${currentTheme.border}`, borderRadius: '8px', color: currentTheme.textPrimary,
              }}>
                <option value="followMouse">Следование за курсором</option>
                <option value="gravity">Гравитационный шар (зажми ЛКМ)</option>
                <option value="repulse">Отталкивание от курсора</option>
                <option value="magneticField">Магнитное поле</option>
                <option value="vortex">Вихрь вокруг курсора</option>
                <option value="wave">Волновое движение</option>
                <option value="explosion">Взрыв (клик ЛКМ)</option>
              </select>
            </div>
            
            {renderBehaviorParams()}
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: currentTheme.textPrimary, fontSize: '14px', fontWeight: '500' }}>
                Целевой FPS {targetFps}
              </label>
              <input type="range" min="15" max="60" step="5" value={targetFps} onChange={(e) => { const fps = parseInt(e.target.value); setTargetFps(fps); if (particleSystemRef.current) { particleSystemRef.current.setTargetFps(fps); } }} style={{ width: '100%' }} />
              <div style={{ fontSize: '12px', color: currentTheme.textSecondary, marginTop: '4px' }}>Максимальное значение 60 FPS</div>
            </div>
          </>
        );
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: currentTheme.background, padding: '20px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="text" placeholder="Название пресета" value={presetName} onChange={(e) => setPresetName(e.target.value)} style={{ flex: 2, minWidth: '200px', padding: '12px 16px', backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', border: `1px solid ${currentTheme.border}`, borderRadius: '12px', color: currentTheme.textPrimary, fontSize: '14px' }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: currentTheme.textSecondary }}>
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />Публичный
          </label>
          <button onClick={resetToDefaults} style={{ padding: '12px 20px', backgroundColor: currentTheme.surfaceHover, border: `1px solid ${currentTheme.border}`, borderRadius: '12px', color: currentTheme.textPrimary, cursor: 'pointer' }}>Сбросить</button>
          <button onClick={savePreset} disabled={isLoading} style={{ padding: '12px 24px', backgroundColor: theme.accent, border: 'none', borderRadius: '12px', color: '#000', fontWeight: '600', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1 }}>{presetId ? 'Обновить' : 'Сохранить'}</button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: window.innerWidth < 1024 ? 'column' : 'row', gap: '24px' }}>
          <div style={{ flex: '1.2' }}>
            <div style={{ backgroundColor: currentTheme.surface, borderRadius: '20px', padding: '20px', border: `1px solid ${currentTheme.border}` }}>
              <ResizableBox width={canvasSize.width} height={canvasSize.height} minConstraints={[400, 300]} maxConstraints={[1200, 800]} onResizeStop={(e, data) => { setCanvasSize({ width: data.size.width, height: data.size.height }); if (particleSystemRef.current) { particleSystemRef.current.setCanvasSize(data.size.width, data.size.height); } }} resizeHandles={['se']} style={{ margin: '0 auto' }}>
                <canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height} style={{ width: '100%', height: '100%', display: 'block', borderRadius: `${borderRadius}px`, boxShadow: mode === 'dark' ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.1)' }} />
              </ResizableBox>
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: currentTheme.textSecondary, fontSize: '12px' }}>
                <span>Target FPS {targetFps}</span>
                <span>Real FPS {actualFps}</span>
              </div>
            </div>
          </div>
          
          <div style={{ flex: '0.8' }}>
            <div style={{ backgroundColor: currentTheme.surface, borderRadius: '20px', padding: '20px', border: `1px solid ${currentTheme.border}` }}>
              <div style={{ display: 'flex', gap: '8px', borderBottom: `1px solid ${currentTheme.border}`, marginBottom: '24px' }}>
                {[{ id: 'basic', label: 'Основные' }, { id: 'appearance', label: 'Внешний вид' }, { id: 'behavior', label: 'Поведение' }].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} style={{ padding: '10px 16px', background: 'none', border: 'none', borderBottom: activeTab === tab.id ? `2px solid ${theme.accent}` : '2px solid transparent', color: activeTab === tab.id ? theme.accent : currentTheme.textSecondary, cursor: 'pointer', fontSize: '14px', fontWeight: activeTab === tab.id ? '600' : '400' }}>{tab.label}</button>
                ))}
              </div>
              <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '8px' }}>{renderTabContent()}</div>
              <button onClick={applySettings} style={{ width: '100%', padding: '14px', backgroundColor: theme.accent, border: 'none', borderRadius: '12px', color: '#000', fontWeight: '600', cursor: 'pointer', marginTop: '20px' }}>Применить все настройки</button>
            </div>
          </div>
        </div>
      </div>
      {toasts.map(toast => (<Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />))}
    </div>
  );
};
