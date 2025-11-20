// frontend/src/lib/api.ts

export const AUTH_ERROR_EVENT = 'auth:unauthorized';

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // [핵심 수정] 401 발생 시 즉시 처리 (이벤트 방식 -> 직접 이동 방식)
  if (response.status === 401) {
    // 1. 토큰 삭제
    localStorage.removeItem('token');
    
    // 2. 로그인 페이지로 강제 이동 (가장 확실한 방법)
    window.location.href = '/login';
    
    // 3. 로직 중단
    throw new Error('Session expired or invalid');
  }

  return response;
};