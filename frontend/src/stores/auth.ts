import { create } from 'zustand';
import type { User } from '@/api';

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  clear: () => void;
  isAuthed: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('bihuan_token'),
  user: JSON.parse(localStorage.getItem('bihuan_user') || 'null'),
  setAuth: (token, user) => {
    localStorage.setItem('bihuan_token', token);
    localStorage.setItem('bihuan_user', JSON.stringify(user));
    set({ token, user });
  },
  clear: () => {
    localStorage.removeItem('bihuan_token');
    localStorage.removeItem('bihuan_user');
    set({ token: null, user: null });
  },
  isAuthed: () => !!get().token,
}));
