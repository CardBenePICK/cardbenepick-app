import { client } from './client';

export const cardApi = {
  // 내 카드 목록 조회 (useCardStore에서 사용)
  getMyCards: async () => {
    const response = await client.get('/assets/');
    return response.data;
  },

  // 카드 삭제
  deleteCard: async (assetId: number) => {
    await client.delete(`/assets/${assetId}`);
  },

  // 마이데이터 연동 (LinkMyData.tsx)
  linkMyData: async (companies: string[]) => {
    const response = await client.post('/assets/link', { companies });
    return response.data;
  },

  // 카드 상품 목록 조회 (RegisterCards.tsx)
  getCardProducts: async (companyName: string) => {
    const response = await client.get(`/assets/products?company=${companyName}`);
    return response.data;
  },
};