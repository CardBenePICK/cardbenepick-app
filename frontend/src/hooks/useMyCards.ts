// (선택) React Query 설치 필요: npm i @tanstack/react-query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cardApi } from '@/api/card';

export const useMyCards = () => {
  const queryClient = useQueryClient();

  // 카드 목록 조회
  const { data: cards, isLoading } = useQuery({
    queryKey: ['myCards'],
    queryFn: cardApi.getMyCards,
  });

  // 카드 삭제
  const deleteMutation = useMutation({
    mutationFn: cardApi.deleteCard,
    onSuccess: () => {
      // 삭제 성공 시 목록 새로고침
      queryClient.invalidateQueries({ queryKey: ['myCards'] });
    },
  });

  return { cards, isLoading, deleteCard: deleteMutation.mutateAsync };
};