import { http } from './client';
import { Comment } from '@/types';

export const commentsApi = {
  getComments: (presetId: number): Promise<Comment[]> =>
    http.get(`/presets/${presetId}/comments`).then(res => res.data),

  addComment: (presetId: number, text: string): Promise<Comment> =>
    http.post(`/presets/${presetId}/comments`, { text }).then(res => res.data),

  updateComment: (commentId: number, text: string): Promise<Comment> =>
    http.put(`/comments/${commentId}`, { text }).then(res => res.data),

  deleteComment: (commentId: number): Promise<void> =>
    http.delete(`/comments/${commentId}`),
};
