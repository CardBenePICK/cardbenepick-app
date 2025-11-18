import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, TrendingUp, Users, Zap } from 'lucide-react';
// 1. useEffect, useState, useToast를 import 합니다.
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const navigate = useNavigate();
  // 2. toast와 backendMessage 상태 변수를 추가합니다.
  const { toast } = useToast();
  const [backendMessage, setBackendMessage] = useState("백엔드 서버에 연결 중...");

  // 3. 컴포넌트 로드 시 백엔드 API를 호출하는 useEffect 훅을 추가합니다.
  useEffect(() => {
    // 백엔드(FastAPI) 서버 주소(localhost:8000)로 fetch 요청
    // (main.py의 @app.get("/")를 호출)
    fetch('http://localhost:8000/') 
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // 성공 시, data = { message: "Welcome to CardBenePICK API" }
        setBackendMessage(data.message || JSON.stringify(data));
      })
      .catch(error => {
        console.error("Fetch error:", error);
        setBackendMessage("❌ 백엔드 연결 실패!");
        toast({
          title: "연결 오류",
          description: "백엔드 서버(localhost:8000)가 실행 중인지 확인하세요.",
          variant: "destructive",
        });
      });
  }, [toast]); // 의존성 배열에 toast 추가

  return (
    <div className="app-container">
      {/* Header (기존과 동일) */}
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
        {/* Quick Actions (기존과 동일) */}
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

        {/* Features (기존과 동일) */}
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

        {/* 4. ===== [새로 추가된] 백엔드 연동 테스트 카드 ===== */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">🚀 백엔드 연동 상태</h2>
          <Card className="shadow-card bg-muted/50">
            <CardContent className="p-4">
              <p className="text-sm text-center font-medium text-muted-foreground">
                {backendMessage}
              </p>
            </CardContent>
          </Card>
        </div>
        {/* ============================================== */}

        {/* Bottom CTA (기존과 동일) */}
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