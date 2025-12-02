import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
// 1. PieChart, CreditCard, BarChart2, Plus와 함께 'User' 아이콘을 가져옵니다.
import { PieChart, CreditCard, BarChart2, Plus, User, CalendarDays, Sparkles } from 'lucide-react';

// 2. '마이페이지' 항목을 배열의 맨 위에 추가합니다.
const analysisMenuItems = [
  {
    title: "마이페이지",
    description: (
      <>
      내 정보 및<br /> 로그아웃
      </>
    ),
    icon: User,
    link: "/app/mypage", // 마이페이지 라우트
  },
  {
    title: "소비 패턴",
    description: (
      <>
      카테고리별<br /> 지출 분석
      </>
    ),
    icon: PieChart,
    link: "/app/analysis/detail", 
  },
  {
    title: "소비 달력", // [NEW] 소비 달력 추가
    description: (
      <>  
      월별 지출<br />캘린더
      </>
    ),
    icon: CalendarDays,
    link: "/app/analysis/calendar", // 캘린더 페이지 라우트
  },
  {
    title: "카드 실적",
    description: (  
      <>  
      보유 카드<br />실적 현황
      </>
    ),
    icon: CreditCard,
    link: "/app/performance", 
  },
  // [NEW] 카드 추천 탭 추가
  {
    title: "카드 추천",
    description: (
      <>
      AI 맞춤형<br />카드 찾기
      </>
    ),
    icon: Sparkles,
    link: "/survey", // 설문조사 페이지로 이동
  },
];

const Analysis = () => {
  const navigate = useNavigate();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        {/* 3. 페이지 제목을 '분석'에서 '전체'로 변경합니다. */}
        <h1 className="text-lg font-semibold flex-1 text-center">전체</h1>
      </div>

      {/* Content (3*n 버튼 메뉴) */}
      <div className="p-6">
        <div className="grid grid-cols-3 gap-3">
          {analysisMenuItems.map((item) => (
            <Card 
              key={item.title} 
              className="shadow-card hover:shadow-elevated transition-shadow cursor-pointer"
              onClick={() => navigate(item.link)}
            >
              <CardContent className="p-4 flex flex-col items-center justify-center text-center h-32">
                <item.icon className="w-8 h-8 text-primary mb-2" />
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
              </CardContent>
            </Card>
          ))}

          {/* 예비 '추가' 버튼 */}
          <Card className="shadow-none border-2 border-dashed border-muted-foreground/30 bg-transparent flex items-center justify-center h-32 cursor-pointer hover:border-primary">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <Plus className="w-8 h-8 text-muted-foreground/70" />
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default Analysis;