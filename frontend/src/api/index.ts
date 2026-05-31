import { get, post, patch, put, del } from './http';

export interface User { id: string; email: string; created_at?: number }
export interface Task {
  id: string;
  user_id: string;
  content: string;
  priority: 'high' | 'normal' | 'low';
  status: 'pending' | 'done';
  created_at: number;
  next_remind_at: number;
  remind_count: number;
  reminded: 0 | 1;
  closed_at: number | null;
  note: string;
  tags?: string[];
}
export interface PageResp<T> { list: T[]; total: number; page: number; pageSize: number }

export const authApi = {
  sendCode: (email: string, scene: 'register' | 'login' = 'login') =>
    post<{ sent: boolean }>('/auth/send-code', { email, scene }),
  register: (email: string, code: string, password: string) =>
    post<{ token: string; user: User }>('/auth/register', { email, code, password }),
  login: (email: string, password: string) =>
    post<{ token: string; user: User }>('/auth/login', { email, password }),
  loginByCode: (email: string, code: string) =>
    post<{ token: string; user: User }>('/auth/login-by-code', { email, code }),
  me: () => get<User>('/auth/me'),
};

export const tasksApi = {
  create: (input: string) => post<Task>('/tasks', { input }),
  list: (params: Record<string, unknown>) => get<PageResp<Task>>('/tasks', params),
  patch: (id: string, body: Record<string, unknown>) =>
    patch<{ task: Task; encourage?: string }>(`/tasks/${id}`, body),
  remove: (id: string) => del<{ deleted: boolean }>(`/tasks/${id}`),
  getTags: () => get<{ tags: string[] }>('/tasks/tags'),
};

export interface SummaryStats {
  newCount: number;
  closedCount: number;
  closeRate: number;
  pendingCount: number;
  overdueCount: number;
  avgClosedDays: number;
  longPending?: { content: string; days: number }[];
}

export const summaryApi = {
  stats: (period: 'week' | 'month') => get<SummaryStats>('/summary', { period }),
  ai: (period: 'week' | 'month') =>
    post<{ stats: SummaryStats; text: string }>(`/summary/ai?period=${period}`),
};

export interface UserConfig {
  user_id?: string;
  remind_email?: string;
  daily_remind_time?: string;
  weekly_report?: number;
  monthly_report?: number;
}

export interface UserConfigInput {
  remind_email?: string;
  daily_remind_time?: string;
  weekly_report?: boolean;
  monthly_report?: boolean;
}

export const configApi = {
  get: () => get<UserConfig>('/config'),
  put: (body: UserConfigInput) => put<UserConfig>('/config', body),
};
