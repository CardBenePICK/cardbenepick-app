import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { sampleCards } from '../data/mockData';
import { cn } from "@/lib/utils";

const CardPerformance = () => {
  const navigate = useNavigate();
  
  // (샘플 데이터)
  const userCards = [
    {
      card: sampleCards[0],
      currentMonth: {
        requiredAmount: 300000,
        currentAmount: 180000,
        isAchieved: false,
        benefits: ['온라인 쇼핑 5% 적립', '대중교통 10% 적립']
      },
      lastMonth: {
        requiredAmount: 300000,
        currentAmount: 350000,
        isAchieved: true,
      }
    },
    {
      card: sampleCards[1],
      currentMonth: {
        requiredAmount: 200000,
        currentAmount: 220000,
        isAchieved: true,
        benefits: ['카페 15% 할인', '배달앱 10% 할인']
      },
      lastMonth: {
        requiredAmount: 200000,
        currentAmount: 150000,
        isAchieved: false,
      }
    },
  ];

  const getProgressPercentage = (current: number, required: number) => {
    return Math.min((current / required) * 100, 100);
  };

  // 헬퍼 함수: 상태 아이콘
  const getStatusIcon = (isAchieved: boolean, current: number, required: number) => {
    if (isAchieved) return <CheckCircle className="w-5 h-5 text-success" />;
    if (current / required >= 0.8) return <Clock className="w-5 h-5 text-yellow-500" />;
    return <AlertCircle className="w-5 h-5 text-destructive" />;
  };

  // 헬퍼 함수: 상태 텍스트
  const getStatusText = (isAchieved: boolean, current: number, required: number) => {
    if (isAchieved) return '달성 완료';
    if (current / required >= 0.8) return '달성 임박';
    return '달성 필요';
  };

  // 헬퍼 함수: 상태 배지 스타일 (테마 색상 적용)
  const getStatusBadgeClass = (isAchieved: boolean, current: number, required: number) => {
    if (isAchieved) return 'bg-success/10 text-success';
    if (current / required >= 0.8) return 'bg-warning/10 text-yellow-800'; // text-warning-foreground가 없으므로 임시
    return 'bg-destructive/10 text-destructive';
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/app/analysis')} // '분석' 메뉴로 뒤로 가기
          className="mr-3"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">카드 실적 현황</h1>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        
        {/* 요약 정보 */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="shadow-card">
            <CardContent className="p-4 text-center">
              <div className="text-xl font-bold text-success">
                {userCards.filter(card => card.currentMonth.isAchieved).length}
              </div>
              <div className="text-xs text-muted-foreground">달성 완료</div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4 text-center">
              <div className="text-xl font-bold text-yellow-500">
                {userCards.filter(card => !card.currentMonth.isAchieved && card.currentMonth.currentAmount / card.currentMonth.requiredAmount >= 0.8).length}
              </div>
              <div className="text-xs text-muted-foreground">달성 임박</div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4 text-center">
              <div className="text-xl font-bold text-destructive">
                {userCards.filter(card => !card.currentMonth.isAchieved && card.currentMonth.currentAmount / card.currentMonth.requiredAmount < 0.8).length}
              </div>
              <div className="text-xs text-muted-foreground">달성 필요</div>
            </CardContent>
          </Card>
        </div>

        {/* 1. 이번 달 실적 현황 (충족율) */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">이번 달 실적 현황</h2>
          
          {userCards.map((userCard, index) => (
            <Card key={index} className="shadow-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{userCard.card.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{userCard.card.bank}</p>
                    </div>
                  </div>
                  <Badge className={cn(getStatusBadgeClass(userCard.currentMonth.isAchieved, userCard.currentMonth.currentAmount, userCard.currentMonth.requiredAmount))}>
                    {getStatusText(userCard.currentMonth.isAchieved, userCard.currentMonth.currentAmount, userCard.currentMonth.requiredAmount)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>실적 진행률</span>
                    <span className="font-medium">
                      {userCard.currentMonth.currentAmount.toLocaleString()}원 / {userCard.currentMonth.requiredAmount.toLocaleString()}원
                    </span>
                  </div>
                  <Progress 
                    value={getProgressPercentage(userCard.currentMonth.currentAmount, userCard.currentMonth.requiredAmount)}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 2. 지난 달 실적 요약 (충족 카드) */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">지난 달 실적 요약</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userCards.map((userCard, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{userCard.card.name}</p>
                  </div>
                  <Badge variant={userCard.lastMonth.isAchieved ? "default" : "outline"} className={cn(userCard.lastMonth.isAchieved ? "bg-success/10 text-success" : "text-muted-foreground")}>
                    {userCard.lastMonth.isAchieved ? '달성' : '미달성'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default CardPerformance;