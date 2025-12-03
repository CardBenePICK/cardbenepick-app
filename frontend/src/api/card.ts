import { client } from './client';

export interface CardMaster {
  card_id: number;
  card_name: string;
  card_img_url?: string;
}

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
  // [추가] 카드 전체 목록 조회 (SpendingDetail에서 카드 이름 매핑용)
  getAllCards: async () => {
    // 내 카드(자산) 목록 조회
    // 백엔드 엔드포인트: /api/v1/assets/
    const response = await client.get<CardMaster[]>('/assets');
    return response.data;
  },
};