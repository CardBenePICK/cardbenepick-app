import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, Gift, AlertCircle, Star, ExternalLink } from 'lucide-react';
import { sampleCards, benefitCategoryNames, benefitCategoryColors } from '../data/mockData';

const CardDetail = () => {
  const { cardId } = useParams();
  const navigate = useNavigate();
  
  const card = sampleCards.find(c => c.id === cardId);
  
  if (!card) {
    return (
      <div className="app-container flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">카드를 찾을 수 없습니다</h1>
          <Button onClick={() => navigate('/app/wallet')}>월렛으로 돌아가기</Button>
        </div>
      </div>
    );
  }

  const getBenefitTypeText = (benefit: any) => {
    if (benefit.cashbackRate) return `${benefit.cashbackRate}% 적립`;
    if (benefit.discountRate) return `${benefit.discountRate}% 할인`;
    if (benefit.pointRate) return `${benefit.pointRate}% 포인트`;
    return '혜택';
  };

  const getCategoryColor = (category: string) => {
    return benefitCategoryColors[category as keyof typeof benefitCategoryColors] || '#6B6B6B'; // #6B6B6B는 새 보조 텍스트 색
  };

  return (
    // app-container 제거
    <div>
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate(-1)}
          className="mr-3"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">카드 상세정보</h1>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* 카드 기본 정보 */}
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              {/* 카드 이미지 영역 (새 프라이머리 색상 적용) */}
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-blue-400 rounded-2xl flex items-center justify-center mx-auto">
                <CreditCard className="w-12 h-12 text-primary-foreground" />
              </div>
              
              <div>
                <h1 className="text-xl font-bold">{card.name}</h1>
                <p className="text-muted-foreground">{card.bank}</p>
              </div>
              
              <div className="flex items-center justify-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">{card.popularityScore}</span>
                </div>
                <Badge variant="secondary">{card.category}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 연회비 정보 */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              연회비 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <span className="font-medium">연회비</span>
              <span className={`font-bold ${card.annualFee === 0 ? 'text-success' : 'text-foreground'}`}>
                {card.annualFee === 0 ? '무료' : `${card.annualFee.toLocaleString()}원`}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 혜택 정보 */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Gift className="w-5 h-5 mr-2" />
              주요 혜택
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {card.benefits.map((benefit, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getCategoryColor(benefit.category) }}
                    />
                    <span className="font-medium">
                      {benefitCategoryNames[benefit.category]}
                    </span>
                  </div>
                  <Badge variant="outline">
                    {getBenefitTypeText(benefit)}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {benefit.description}
                </p>
                
                {benefit.maxDiscount && (
                  <div className="flex items-center space-x-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-yellow-500" /> {/* 임시 warning 색상 */}
                    <span className="text-yellow-600">
                      월 최대 {benefit.maxDiscount.toLocaleString()}원
                    </span>
                  </div>
                )}
                
                {benefit.conditions && benefit.conditions.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">이용 조건:</p>
                    {benefit.conditions.map((condition, conditionIndex) => (
                      <div key={conditionIndex} className="flex items-center text-xs text-muted-foreground">
                        <div className="w-1 h-1 bg-muted-foreground rounded-full mr-2" />
                        {condition}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 혜택 시뮬레이션 (새로운 색상 적용) */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">월 예상 혜택</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-success/10 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-success/90">월 50만원 사용 시</span>
                  <span className="font-bold text-success">약 15,000원 혜택</span>
                </div>
              </div>
              <div className="p-3 bg-secondary rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-primary/90">월 100만원 사용 시</span>
                  <span className="font-bold text-primary">약 25,000원 혜택</span>
                </div>
              </div>
              <div className="p-3 bg-info/10 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-info/90">월 150만원 사용 시</span>
                  <span className="font-bold text-info">약 30,000원 혜택</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              * 예상 혜택은 주요 혜택 카테고리 사용을 기준으로 계산된 추정치입니다.
            </p>
          </CardContent>
        </Card>

        {/* 추천 이유 (새로운 색상 적용) */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">이 카드를 추천하는 이유</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-secondary rounded-lg">
              <p className="text-sm text-primary">
                ✓ 연회비 무료로 부담 없이 사용 가능
              </p>
            </div>
            <div className="p-3 bg-secondary rounded-lg">
              <p className="text-sm text-primary">
                ✓ 일상 소비에서 높은 적립률 제공
              </p>
            </div>
            <div className="p-3 bg-secondary rounded-lg">
              <p className="text-sm text-primary">
                ✓ 사용자 만족도 및 인기도 높음
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 액션 버튼 */}
        <div className="space-y-3">
          <Button className="w-full btn-gradient">
            <ExternalLink className="w-4 h-4 mr-2" />
            카드 신청하기
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline"
              onClick={() => navigate('/app/chat')}
            >
              다른 카드 추천받기
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/recommendations')}
            >
              추천 결과로 돌아가기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardDetail;