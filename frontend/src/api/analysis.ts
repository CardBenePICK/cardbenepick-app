import { client } from './client';

export interface CardPerformanceData {
  card_id: string;
  card_name: string;
  card_company: string;
  current_usage: number;
  last_month_usage: number;
  requirement: number;
  image_filename: string;
}

export const analysisApi = {
  // 실시간 카드 실적 조회
  getRealtimePerformance: async () => {
    // client가 baseURL(/api/v1)을 포함하므로 뒷부분만 작성
    const response = await client.get<CardPerformanceData[]>('/analysis/realtime-cards');
    return response.data;
  },
};