import { http } from './client';

export const likesApi = {
  like: (presetId: number): Promise<void> =>
    http.post(`/presets/${presetId}/like`),

  unlike: (presetId: number): Promise<void> =>
    http.delete(`/presets/${presetId}/like`),
};
