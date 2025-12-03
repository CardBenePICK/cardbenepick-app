import { client } from './client';

export const userApi = {
  // 내 정보 조회
  getMe: async () => {
    const response = await client.get('/users/me');
    return response.data;
  },

  // 회원 탈퇴
  withdraw: async () => {
    await client.delete('/users/me');
  },
};