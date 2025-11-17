import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, Users, TrendingUp, Star } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { SurveyResponse, UserGroup, Card as CardType } from '../types';
import { benefitCategoryNames } from '../data/mockData';

const Recommendations = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // --- [수정됨] ---
  // state가 비어있는 경우를 대비 (AnalysisLoading 페이지를 거치지 않은 경우)
  const surveyState = location.state as {
    surveyResponse: SurveyResponse;
    userGroup: UserGroup;
    cardCombinations: CardType[][];
  };

  // userGroup이나 cardCombinations가 없으면 survey 페이지로 리다이렉트
  if (!surveyState || !surveyState.userGroup || !surveyState.cardCombinations) {
    return (
      <div className="app-container p-6">
        <p>추천 데이터를 불러오는 데 실패했습니다. 설문을 다시 진행해주세요.</p>
        <Button onClick={() => navigate('/survey')}>설문으로 돌아가기</Button>
      </div>
    );
  }

  const { surveyResponse, userGroup, cardCombinations } = surveyState;
  // --- [수정 완료] ---


  // 방사형 차트 데이터 생성
  const radarData = Object.entries(benefitCategoryNames).map(([category, name]) => ({
    category: name,
    user: surveyResponse.spendingCategories.includes(category as any) ? 5 : 1,
    // 그룹 데이터가 없을 경우 1로 처리
    group: userGroup?.spendingPattern?.categories[category as keyof typeof userGroup.spendingPattern.categories] || 1
  }));

  const handleCardClick = (cardId: string) => {
    navigate(`/app/card/${cardId}`);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <Button variant="ghost" size="icon" onClick={() => navigate('/survey')} className="mr-3">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">추천 결과</h1>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">

        {/* --- [수정됨] --- */}
        {/* 회원가입 버튼 추가 */}
        <Button className="w-full btn-gradient h-11" onClick={() => navigate('/login')}>
          가입하고 내 카드 관리하기
        </Button>
        {/* --- [수정 완료] --- */}


        {/* 사용자 그룹 정보 */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">당신의 소비 그룹</CardTitle>
                <p className="text-sm text-muted-foreground">비슷한 소비 패턴을 가진 사용자들</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-secondary"> 
              <h3 className="font-semibold mb-2 text-primary">{userGroup.name}</h3>
              <div className="space-y-2">
                {userGroup.characteristics.map((characteristic, index) => (
                  <div key={index} className="flex items-center text-sm text-muted-foreground">
                    <div className="w-1 h-1 bg-primary rounded-full mr-2" />
                    {characteristic}
                  </div>
                ))}
              </div>
            </div>

            {/* 소비 성향 비교 차트 */}
            <div>
              <h4 className="font-medium mb-3">소비 성향 비교</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" tick={{
                      fontSize: 10, fill: "hsl(var(--muted-foreground))"
                    }} />
                    <PolarRadiusAxis angle={90} domain={[0, 5]} tick={false} />
                    <Radar name="나의 성향" dataKey="user" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} strokeWidth={2} />
                    <Radar name="그룹 평균" dataKey="group" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.1} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center space-x-6 mt-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-primary rounded-full" />
                  <span className="text-xs text-muted-foreground">나의 성향</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-success rounded-full" />
                  <span className="text-xs text-muted-foreground">그룹 평균</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 카드 조합 추천 */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            추천 카드 조합
          </h2>
          
          {cardCombinations.map((combination, index) => (
            <Card key={index} className="shadow-card overflow-hidden"> 
              <CardHeader className="flex flex-col space-y-1.5 p-4 bg-secondary"> 
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-primary">
                    조합 {index + 1}: {index === 0 ? '맞춤 혜택 조합' : index === 1 ? '균형 잡힌 조합' : '인기 카드 조합'}
                  </CardTitle>
                  <Badge variant="secondary" className="text-primary-foreground bg-primary/80"> 
                    {combination.length}장
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-4 space-y-3"> 
                {combination.map((card, cardIndex) => (
                  <div 
                    key={cardIndex} 
                    className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors" 
                    onClick={() => handleCardClick(card.id)}
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{card.name}</h4>
                      <p className="text-xs text-muted-foreground">{card.bank}</p>
                      <div className="flex items-center mt-1">
                        <Star className="w-3 h-3 text-yellow-500 mr-1" />
                        <span className="text-xs text-muted-foreground">
                          인기도 {card.popularityScore}점
                        </span>
                      </div>
                    </div>
                    <div className="text-primary">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
                
                <div className="p-3 bg-secondary rounded-lg">
                  <p className="text-sm text-primary">
                    {index === 0 && '선호하는 혜택 카테고리에 최적화된 카드들로 구성했습니다.'}
                    {index === 1 && '다양한 혜택을 골고루 받을 수 있는 균형잡힌 조합입니다.'}
                    {index === 2 && '많은 사용자들이 선택한 인기 카드들로 구성했습니다.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 그룹 인기 카드 */}
        <Card className="shadow-card overflow-hidden">
          <CardHeader className="flex flex-col space-y-1.5 p-4 bg-secondary"> 
            <CardTitle className="text-lg flex items-center text-primary">
              <TrendingUp className="w-5 h-5 mr-2" />
              {userGroup.name}이 많이 사용하는 카드
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-4 space-y-3"> 
            {userGroup.popularCards.map((card, index) => (
              <div 
                key={index} 
                className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors" 
                onClick={() => handleCardClick(card.id)}
              >
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-success" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{card.name}</h4>
                  <p className="text-xs text-muted-foreground">{card.bank}</p>
                  <div className="flex items-center mt-1">
                    <Users className="w-3 h-3 text-success mr-1" />
                    <span className="text-xs text-muted-foreground">
                      그룹 내 인기 카드
                    </span>
                  </div>
                </div>
                <div className="text-success">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 액션 버튼 */}
        <div className="space-y-3">
          {/* --- [수정됨] --- */}
          {/* 상단으로 이동시켰으므로 하단 버튼은 '설문 다시하기'만 남김 */}
          <Button variant="outline" className="w-full" onClick={() => navigate('/survey')}>
            설문 다시하기
          </Button>
          {/* --- [수정 완료] --- */}
        </div>
      </div>
    </div>
  );
};

export default Recommendations;