import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(this.handleAuthInterceptor);
  }

  private handleAuthInterceptor = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = this.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  };

  public setToken(token: string | null): void {
    this.accessToken = token;
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
  }

  private getToken(): string | null {
    if (this.accessToken) return this.accessToken;
    const stored = localStorage.getItem('access_token');
    if (stored) this.accessToken = stored;
    return this.accessToken;
  }

  public clearToken(): void {
    this.accessToken = null;
    localStorage.removeItem('access_token');
  }

  public getClient(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient();
export const http = apiClient.getClient();
