
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// (신규) 로그인 상태 및 유저 정보
// - user (이름, 폰번호 등)
// - accessToken    
// - isLoggedIn
// - login(token, user) => localStorage에도 저장
// - logout() => localStorage에서도 제거

// frontend/src/store/useUserStore.ts

interface User {
  user_id: number;
  user_name: string;
  phone_number: string;
  birth_date?: string;
  gender?: string;
  telecom?: string;
  status?: string;
}

interface UserState {
  isLoggedIn: boolean;
  token: string | null;
  user: User | null;
  
  // Actions
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void; // 정보 갱신용
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      token: null,
      user: null,

      login: (token, user) => {
        localStorage.setItem('token', token); // 호환성을 위해 localStorage에도 직접 저장
        set({ isLoggedIn: true, token, user });
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ isLoggedIn: false, token: null, user: null });
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'user-storage', // localStorage 키 이름
      storage: createJSONStorage(() => localStorage),
    }
  )
);