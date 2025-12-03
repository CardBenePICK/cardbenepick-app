import { useQuery } from '@tanstack/react-query';
import { analysisApi } from '@/api/analysis';

export const useCardPerformance = () => {
  return useQuery({
    queryKey: ['cardPerformance'], // 캐싱 키
    queryFn: analysisApi.getRealtimePerformance,
    staleTime: 1000 * 60 * 5, // 5분간 데이터 신선함 유지 (선택 사항)
  });
};