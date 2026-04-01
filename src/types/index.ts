export interface User {
  id: number;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Preset {
  id: number;
  name: string;
  config: ParticleConfig;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicPreset {
  id: number;
  name: string;
  config: ParticleConfig;
  author: {
    id: number;
    email: string;
  };
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  isLikedByCurrentUser: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: number;
  text: string;
  author: {
    id: number;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ParticleConfig {
  particleCount: number;
  colors: string[];
  particleSize: number;
  maxSpeed: number;
  behavior: string;
  behaviorParams?: Record<string, any>;
  shape?: 'square' | 'circle' | 'triangle';
  initSpeed?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface ApiError {
  message: string;
  statusCode: number;
}
