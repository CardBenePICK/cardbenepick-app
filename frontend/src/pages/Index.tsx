import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, TrendingUp, Users, Zap } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="app-container">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6 rounded-b-3xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold mb-2">카드 혜택 추천</h1>
          <p className="text-primary-foreground/80">나에게 맞는 최적의 카드를 찾아보세요</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">시작하기</h2>
          
          <Card className="shadow-card hover:shadow-elevated transition-shadow cursor-pointer" 
                onClick={() => navigate('/login')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">회원 로그인</h3>
                  <p className="text-sm text-muted-foreground">내 카드 정보로 맞춤 추천받기</p>
                </div>
                <div className="text-primary">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-elevated transition-shadow cursor-pointer" 
                onClick={() => navigate('/survey')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <Zap className="w-6 h-6 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">체험하기</h3>
                  <p className="text-sm text-muted-foreground">간단한 설문으로 카드 추천받기</p>
                </div>
                <div className="text-accent">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">주요 기능</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <Card className="shadow-card">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-medium text-sm mb-1">맞춤 추천</h3>
                <p className="text-xs text-muted-foreground">결제 상황별 최적 카드</p>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-medium text-sm mb-1">소비 분석</h3>
                <p className="text-xs text-muted-foreground">나의 소비 패턴 분석</p>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-medium text-sm mb-1">실적 관리</h3>
                <p className="text-xs text-muted-foreground">카드별 실적 현황</p>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="font-medium text-sm mb-1">카드 조합</h3>
                <p className="text-xs text-muted-foreground">최적 카드 조합 추천</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="pt-4">
          <Button 
            className="w-full btn-gradient h-12 text-base font-medium"
            onClick={() => navigate('/survey')}
          >
            지금 시작하기
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
