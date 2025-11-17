import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PieChart, CreditCard, BarChart2, Plus } from 'lucide-react';

// --- [수정됨] ---
const analysisMenuItems = [
  {
    title: "소비패턴",
    description: "카테고리별 지출 분석",
    icon: PieChart,
    link: "/app/analysis/detail", // 1. 'spending/detail' -> 'analysis/detail'
  },
  {
    title: "카드별 이용실적",
    description: "보유 카드 실적 현황",
    icon: CreditCard,
    link: "/app/performance", // 2. (요청대로) '/app/performance' 경로 유지
  },
  // {
  //   title: "월별 리포트",
  //   description: "지난 달 소비 요약",
  //   icon: BarChart2,
  //   link: "#",
  // },
];
// --- [수정 완료] ---

const Analysis = () => {
  const navigate = useNavigate();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <h1 className="text-lg font-semibold flex-1 text-center">분석</h1>
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