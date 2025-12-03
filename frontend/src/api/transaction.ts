import { client } from './client';

export const transactionApi = {
  // 결제 (Wallet.tsx)
  pay: async (data: {
    user_asset_id: number;
    amount: number;
    merchant_name: string;
    benefit_id?: number;
    discount_amount?: number;
  }) => {
    const response = await client.post('/transactions/pay', data);
    return response.data;
  },

  // 포인트 적립 (Wallet.tsx - 기존 fetch('http://127.0.0.1:8000/api/points/earn') 대체)
  earnPoint: async (data: {
    benefit_id: number;
    amount: number;
    description: string;
  }) => {
    const response = await client.post('/points/earn', data);
    return response.data;
  },

  // 포인트 잔액 조회
  getPointBalance: async () => {
    const response = await client.get('/points/balance');
    return response.data;
  },
};