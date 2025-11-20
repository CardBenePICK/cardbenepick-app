// frontend/src/lib/api.ts

export const AUTH_ERROR_EVENT = 'auth:unauthorized';

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');

  // 헤더에 토큰 자동 주입 (편리함!)
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // [핵심] 서버가 401(인증 실패)을 리턴하면 -> 이벤트 발생!
  if (response.status === 401) {
    window.dispatchEvent(new Event(AUTH_ERROR_EVENT));
    throw new Error('Session expired or invalid');
  }

  return response;
};