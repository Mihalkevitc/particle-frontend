import { http } from './client';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '@/types';

export const authApi = {
  register: (data: RegisterRequest): Promise<User> =>
    http.post('/auth/register', data).then(res => res.data),

  login: (data: LoginRequest): Promise<AuthResponse> =>
    http.post('/auth/login', data).then(res => res.data),

  getMe: (): Promise<User> =>
    http.get('/users/me').then(res => res.data),

  updateProfile: (data: { email: string }): Promise<User> =>
    http.put('/users/me', data).then(res => res.data),

  deleteAccount: (): Promise<void> =>
    http.delete('/users/me'),
};
