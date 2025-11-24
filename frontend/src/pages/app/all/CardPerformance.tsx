import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchWithAuth } from '@/lib/api';
import { cn } from '@/lib/utils';

// 백엔드 데이터 타입 (last_month_usage 추가됨)
interface RealtimeCardData {
  card_name: string;
  card_number: string;
  current_usage: number; // 이번 달
  last_month_usage: number; // 지난 달 (NEW)
  requirement: number;
  image_filename?: string;
}

const CardPerformance = () => {
  const navigate = useNavigate();
  const [cards, setCards] = useState<RealtimeCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetchWithAuth(
          'http://localhost:8000/api/analysis/realtime-cards',
        );
        if (res.ok) {
          const data = await res.json();
          setCards(data);
        }
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // 달성률 계산
  const getProgressPercentage = (current: number, required: number) => {
    if (required === 0) return 100;
    return Math.min((current / required) * 100, 100);
  };

  // 상태 배지 정보
  const getStatusInfo = (current: number, required: number) => {
    const ratio = current / required;
    if (ratio >= 1)
      return {
        text: '달성 완료',
        badgeClass: 'bg-green-100 text-green-700',
        icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      };
    if (ratio >= 0.8)
      return {
        text: '달성 임박',
        badgeClass: 'bg-yellow-100 text-yellow-700',
        icon: <Clock className="w-5 h-5 text-yellow-600" />,
      };
    return {
      text: '달성 필요',
      badgeClass: 'bg-red-100 text-red-700',
      icon: <AlertCircle className="w-5 h-5 text-red-600" />,
    };
  };

  // 상단 요약 카운트
  const achievedCount = cards.filter(
    (c) => c.current_usage >= c.requirement,
  ).length;
  const warningCount = cards.filter(
    (c) =>
      c.current_usage < c.requirement &&
      c.current_usage / c.requirement >= 0.8,
  ).length;
  const dangerCount = cards.filter(
    (c) =>
      c.current_usage < c.requirement &&
      c.current_usage / c.requirement < 0.8,
  ).length;

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      {/* 헤더 */}
      <div className="flex items-center p-4 border-b bg-white sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="mr-3"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">카드 실적 현황</h1>
      </div>

      {/* 로딩 및 에러 처리 */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center text-gray-400 py-20">
          보유한 카드가 없습니다.
        </div>
      ) : (
        <div className="p-4 space-y-6">
          {/* 1. 상단 요약 */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="shadow-sm border-none">
              <CardContent className="p-4 text-center">
                <div className="text-xl font-bold text-green-600">
                  {achievedCount}
                </div>
                <div className="text-xs text-gray-500">달성 완료</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-none">
              <CardContent className="p-4 text-center">
                <div className="text-xl font-bold text-yellow-500">
                  {warningCount}
                </div>
                <div className="text-xs text-gray-500">달성 임박</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-none">
              <CardContent className="p-4 text-center">
                <div className="text-xl font-bold text-red-500">
                  {dangerCount}
                </div>
                <div className="text-xs text-gray-500">달성 필요</div>
              </CardContent>
            </Card>
          </div>

          {/* 2. 이번 달 실적 리스트 */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800 px-1">
              이번 달 실적 현황
            </h2>
            {cards.map((card, index) => {
              const status = getStatusInfo(
                card.current_usage,
                card.requirement,
              );
              const percent = getProgressPercentage(
                card.current_usage,
                card.requirement,
              );
              return (
                <Card
                  key={index}
                  className="shadow-sm border-gray-100 overflow-hidden"
                >
                  <CardHeader className="pb-3 bg-white border-b border-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {/* 🔹 카드 이미지만 (네모 박스 제거) */}
                        {card.image_filename ? (
                          <img
                            src={`/images/${card.image_filename}`}
                            alt={card.card_name}
                            className="w-24 h-16 object-contain rotate-90"
                          />
                        ) : (
                          <CreditCard className="w-8 h-8 text-gray-400" />
                        )}

                        <div>
                          <CardTitle className="text-sm font-bold">
                            {card.card_name}
                          </CardTitle>
                          <p className="text-xs text-gray-400 mt-0.5">
                            목표 {card.requirement.toLocaleString()}원
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={cn(
                          'px-2 py-1 text-[10px] font-bold border-0',
                          status.badgeClass,
                        )}
                      >
                        {status.text}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 pb-5 space-y-3">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-gray-600">실적 진행률</span>
                      <span className="text-gray-900">
                        {card.current_usage.toLocaleString()}원
                      </span>
                    </div>
                    <div className="relative w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className={cn(
                          'h-2.5 rounded-full transition-all duration-1000',
                          percent >= 100
                            ? 'bg-green-500'
                            : percent >= 80
                            ? 'bg-yellow-500'
                            : 'bg-blue-600',
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* 3. 지난 달 실적 요약 */}
          <Card className="shadow-sm border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg">지난 달 실적 요약</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cards.map((card, index) => {
                  const isLastMonthAchieved =
                    card.last_month_usage >= card.requirement;

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      {/* 왼쪽: 이미지 + 텍스트 */}
                      <div className="flex items-center gap-3">
                        {/* 🔹 여기서도 네모 박스 제거, 카드 이미지만 */}
                        {card.image_filename ? (
                          <img
                            src={`/images/${card.image_filename}`}
                            className="w-24 h-16 object-contain rotate-90"
                          />
                        ) : (
                          <CreditCard className="w-7 h-7 text-gray-300" />
                        )}

                        <div className="flex flex-col">
                          <p className="font-medium text-sm text-gray-700">
                            {card.card_name}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {card.last_month_usage.toLocaleString()}원 사용
                          </p>
                        </div>
                      </div>

                      {/* 오른쪽: 달성 배지 */}
                      <Badge
                        variant="outline"
                        className={cn(
                          'border-0 px-2 py-1 text-[11px] font-bold',
                          isLastMonthAchieved
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-200 text-gray-500',
                        )}
                      >
                        {isLastMonthAchieved ? '달성' : '미달성'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CardPerformance;
