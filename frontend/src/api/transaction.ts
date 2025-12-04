import { client } from './client';

// [추가] Wallet.tsx에서 사용할 타입 정의
export interface PayRequest {
  user_asset_id: number;
  amount: number;
  merchant_name: string;
  benefit_id?: number;
  discount_amount?: number;
}

export interface PayResponse {
  transaction_id: number;
  merchant: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface EarnPointRequest {
  benefit_id: number;
  amount: number;
  description: string;
}

export interface PointBalanceResponse {
  user_id: number;
  total_point: number;
  earn_count: number;
}

export const transactionApi = {
  // 결제 (Wallet.tsx)
  pay: async (data: PayRequest) => {
    const response = await client.post<PayResponse>('/transactions/pay', data);
    return response.data;
  },

  // 포인트 적립 (Wallet.tsx - 기존 fetch('http://127.0.0.1:8000/api/points/earn') 대체)
  earnPoint: async (data: EarnPointRequest) => {
    const response = await client.post('/points/earn', data);
    return response.data;
  },

  // 포인트 잔액 조회
  getPointBalance: async () => {
    const response = await client.get<PointBalanceResponse>('/points/balance');
    return response.data;
  },
};