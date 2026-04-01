import { create } from 'zustand';
import { likesApi } from '@/api/likes';
import { presetsApi } from '@/api/presets';

interface LikesState {
  likedPresetIds: Set<number>;
  isLoading: boolean;
  loadLikedPresets: () => Promise<void>;
  like: (presetId: number) => Promise<void>;
  unlike: (presetId: number) => Promise<void>;
  isLiked: (presetId: number) => boolean;
}

export const useLikesStore = create<LikesState>((set, get) => ({
  likedPresetIds: new Set<number>(),
  isLoading: false,

  loadLikedPresets: async () => {
    set({ isLoading: true });
    try {
      const likedPresets = await presetsApi.getLikedPresets();
      const ids = new Set(likedPresets.map(p => p.id));
      set({ likedPresetIds: ids, isLoading: false });
    } catch (error) {
      console.error('Failed to load liked presets:', error);
      set({ isLoading: false });
    }
  },

  like: async (presetId: number) => {
    try {
      await likesApi.like(presetId);
      set((state) => ({
        likedPresetIds: new Set([...state.likedPresetIds, presetId]),
      }));
    } catch (error) {
      console.error('Failed to like:', error);
      throw error;
    }
  },

  unlike: async (presetId: number) => {
    try {
      await likesApi.unlike(presetId);
      set((state) => {
        const newSet = new Set(state.likedPresetIds);
        newSet.delete(presetId);
        return { likedPresetIds: newSet };
      });
    } catch (error) {
      console.error('Failed to unlike:', error);
      throw error;
    }
  },

  isLiked: (presetId: number) => {
    return get().likedPresetIds.has(presetId);
  },
}));
