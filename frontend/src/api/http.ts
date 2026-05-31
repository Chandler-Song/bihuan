import axios, { AxiosError, AxiosInstance } from 'axios';
import { message } from 'antd';

const instance: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 20000,
});

instance.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('bihuan_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

instance.interceptors.response.use(
  (resp) => resp,
  (err: AxiosError<{ code?: number; message?: string }>) => {
    const status = err.response?.status;
    const msg = err.response?.data?.message || err.message || '网络错误';
    if (status === 401) {
      localStorage.removeItem('bihuan_token');
      localStorage.removeItem('bihuan_user');
      if (location.pathname !== '/login') {
        location.replace('/login');
      }
    } else {
      message.error(msg);
    }
    return Promise.reject(err);
  }
);

export interface ApiResp<T> {
  code: number;
  data: T;
  message: string;
}

export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const r = await instance.get<ApiResp<T>>(url, { params });
  return r.data.data;
}
export async function post<T>(url: string, body?: unknown): Promise<T> {
  const r = await instance.post<ApiResp<T>>(url, body);
  return r.data.data;
}
export async function patch<T>(url: string, body?: unknown): Promise<T> {
  const r = await instance.patch<ApiResp<T>>(url, body);
  return r.data.data;
}
export async function put<T>(url: string, body?: unknown): Promise<T> {
  const r = await instance.put<ApiResp<T>>(url, body);
  return r.data.data;
}
export async function del<T>(url: string): Promise<T> {
  const r = await instance.delete<ApiResp<T>>(url);
  return r.data.data;
}

export default instance;
