import { http } from './client';
import { Preset, PublicPreset, ParticleConfig } from '@/types';

export interface PresetWithStats {
  id: number;
  name: string;
  config: ParticleConfig;
  isPublic: boolean;
  author: {
    id: number;
    email: string;
  };
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  isLikedByCurrentUser: boolean;
  createdAt: string;
  updatedAt: string;
}

export const presetsApi = {
  getPublicFeed: (): Promise<PublicPreset[]> =>
    http.get('/presets/public').then(res => res.data),

  getPublicPreset: (id: number): Promise<PublicPreset> =>
    http.get(`/presets/public/${id}`).then(res => res.data),

  getMyPresets: (): Promise<Preset[]> =>
    http.get('/presets').then(res => res.data),

  getLikedPresets: (): Promise<PublicPreset[]> =>
    http.get('/presets/liked').then(res => res.data),

  // Защищённый эндпоинт — требует авторизацию
  getPresetById: (id: number): Promise<PresetWithStats> =>
    http.get(`/presets/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    }).then(res => res.data),

  createPreset: (data: { name: string; config: ParticleConfig; isPublic: boolean }): Promise<Preset> =>
    http.post('/presets', data).then(res => res.data),

  updatePreset: (id: number, data: Partial<Preset>): Promise<Preset> =>
    http.put(`/presets/${id}`, data).then(res => res.data),

  deletePreset: (id: number): Promise<void> =>
    http.delete(`/presets/${id}`),

  updatePublicStatus: (id: number, isPublic: boolean): Promise<Preset> =>
    http.patch(`/presets/${id}/public`, { isPublic }).then(res => res.data),
};
