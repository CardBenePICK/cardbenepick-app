import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, Clock, TrendingUp, CreditCard, ShoppingBag, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

import { useMonthlyTransactions } from '@/hooks/useAnalysis';
import { useMyCards } from '@/hooks/useMyCards'; 
import { Transaction } from '@/api/analysis';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

// 카테고리 분류 헬퍼
const getCategory = (tx: Transaction) => {
  if (tx.category) return tx.category;
  const name = tx.merchant_name;
  if (name.includes('스타벅스') || name.includes('카페') || name.includes('커피')) return '카페/간식';
  if (name.includes('편의점') || name.includes('마트') || name.includes('GS25') || name.includes('CU')) return '쇼핑/마트';
  if (name.includes('식당') || name.includes('음식') || name.includes('버거')) return '식비';
  if (name.includes('주유') || name.includes('교통') || name.includes('택시')) return '교통/주유';
  if (name.includes('학원')) return '교육';
  return '기타 소비';
};

// 카드 이미지 컴포넌트
const CardImage = ({ 
  cardId, 
  name, 
  onLayoutChange 
}: { 
  cardId: number; 
  name: string; 
  onLayoutChange?: (isLandscape: boolean) => void 
}) => {
  const extensions = ['png', 'jpg', 'gif'];
  const [extIndex, setExtIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false); 

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    const isLandscape = width >= height;

    // console.log(`[CardImage Debug] Card ID: ${cardId} (${isLandscape ? '가로' : '세로'})`);

    setIsPortrait(!isLandscape);
    if (onLayoutChange) onLayoutChange(isLandscape);
  }, [cardId, onLayoutChange]);

  const handleError = () => {
    if (extIndex < extensions.length - 1) {
      setExtIndex((prev) => prev + 1);
    } else {
      setHasError(true);
      if (onLayoutChange) onLayoutChange(true);
    }
  };

  if (hasError) {
    return <span className="font-bold text-gray-900 text-xs flex items-center justify-center h-full text-center p-1 bg-gray-100 rounded">{name}</span>;
  }

  // const imageStyle = isPortrait 
  //   ? { transform: 'rotate(-90deg)', width: 'auto', height: '100%' }
  //   : { width: '100%', height: '100%' };
  // [수정 포인트]
  // 1. 세로형(Portrait): 회전(-90deg) 후 박스에 꽉 차도록 scale(1.5)로 확대합니다.
  // 2. 가로형(Landscape): width/height 100%로 설정합니다.
  const imageStyle: React.CSSProperties = isPortrait 
    ? { transform: 'rotate(-90deg) scale(1.5)', width: 'auto', height: '100%' }
    : { width: '100%', height: '100%' };

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden bg-gray-50 rounded border border-gray-100">
        <img
        src={`/images/${cardId}card.${extensions[extIndex]}`}
        alt={name}
        onError={handleError}
        onLoad={handleImageLoad}
        className="object-contain transition-transform duration-300"
        style={imageStyle} 
        />
    </div>
  );
};

const SpendingDetail = () => {
  const navigate = useNavigate();
  
  // [수정] 날짜 상태 변경 함수 추가 (setCurrentDate)
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  const [cardLayouts, setCardLayouts] = useState<Record<number, boolean>>({});

  const { data: transactions = [], isLoading: isTxLoading } = useMonthlyTransactions(currentDate.year, currentDate.month);
  
  const { cards: cardList = [], isLoading: isCardLoading } = useMyCards();
  
  const isLoading = isTxLoading || isCardLoading;

  // [추가] 월 변경 핸들러
  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const newMonth = prev.month - 1;
      if (newMonth < 1) return { year: prev.year - 1, month: 12 };
      return { ...prev, month: newMonth };
    });
  };

  const handleNextMonth = () => {
    const now = new Date();
    // 미래 날짜로 가는 것 방지 (선택 사항)
    if (currentDate.year === now.getFullYear() && currentDate.month === now.getMonth() + 1) return;

    setCurrentDate(prev => {
      const newMonth = prev.month + 1;
      if (newMonth > 12) return { year: prev.year + 1, month: 1 };
      return { ...prev, month: newMonth };
    });
  };

  // --- useMemo 로직 ---

  // [수정됨] cardList의 external_account_id와 external_account_name을 사용하여 매핑
  const cardNameMap = useMemo(() => {
    const map: Record<number, string> = {};
    console.log("🔍 [DEBUG] 1. cardList 전체 데이터:", cardList);
    
    if (Array.isArray(cardList)) {
        if(cardList.length > 0) {
            const firstCard = cardList[0];
            console.log("🔍 [DEBUG] 2. 첫 번째 카드 객체의 Keys:", Object.keys(firstCard));
            console.log("🔍 [DEBUG] 3. 첫 번째 카드 객체 내용:", firstCard);
        }

        cardList.forEach((card: any) => {
            // 소비 내역의 card_id는 asset의 external_account_id와 매핑됨
            // external_account_id가 문자열("13")이므로 숫자로 변환하여 키로 사용
            const mappedId = Number(card.external_account_id);
            if (!isNaN(mappedId)) {
                map[mappedId] = card.external_account_name;
            }
        });
    }
    return map;
  }, [cardList]);

  const totalAmount = useMemo(() => transactions.reduce((acc, curr) => acc + curr.amount_krw, 0), [transactions]);

  const categoryData = useMemo(() => {
    const stats: Record<string, number> = {};
    transactions.forEach(tx => {
      const cat = getCategory(tx);
      stats[cat] = (stats[cat] || 0) + tx.amount_krw;
    });
    return Object.entries(stats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const cardData = useMemo(() => {
    const stats: Record<number, number> = {};
    transactions.forEach(tx => {
      stats[tx.card_id] = (stats[tx.card_id] || 0) + tx.amount_krw;
    });
    
    return Object.entries(stats)
      .map(([idStr, value]) => {
        const cardId = Number(idStr);
        return { 
            cardId,
            // 매핑된 이름이 있으면 사용, 없으면 기존 방식대로
            name: cardNameMap[cardId] || `카드 ${cardId}`, 
            amount: value 
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, cardNameMap]);

  const cardTopCategory = useMemo(() => {
    const stats: Record<number, { name: string, cats: Record<string, number> }> = {};
    transactions.forEach(tx => {
      const cardId = tx.card_id;
      // 매핑된 이름이 있으면 사용, 없으면 기존 방식대로
      const cardName = cardNameMap[cardId] || `카드 ${cardId}`;
      const cat = getCategory(tx);
      if (!stats[cardId]) stats[cardId] = { name: cardName, cats: {} };
      stats[cardId].cats[cat] = (stats[cardId].cats[cat] || 0) + tx.amount_krw;
    });
    const result = Object.entries(stats).map(([idStr, data]) => {
      const cardId = Number(idStr);
      const topCat = Object.entries(data.cats).reduce((max, curr) => curr[1] > max[1] ? curr : max);
      return {
        cardId,
        cardName: data.name,
        category: topCat[0],
        amount: topCat[1],
        totalCardAmount: Object.values(data.cats).reduce((a, b) => a + b, 0)
      };
    });
    return result.sort((a, b) => b.totalCardAmount - a.totalCardAmount);
  }, [transactions, cardNameMap]);

  const insights = useMemo(() => {
    if (transactions.length === 0) return null;
    const dailyStats: Record<string, number> = {};
    const timeStats: Record<string, number> = { '아침': 0, '점심': 0, '오후': 0, '저녁': 0, '심야': 0 };
    transactions.forEach(tx => {
      const date = tx.transaction_date.split('T')[0].split('-')[2];
      dailyStats[date] = (dailyStats[date] || 0) + tx.amount_krw;
      const hour = new Date(tx.transaction_date).getHours();
      if (hour >= 6 && hour < 11) timeStats['아침']++;
      else if (hour >= 11 && hour < 14) timeStats['점심']++;
      else if (hour >= 14 && hour < 18) timeStats['오후']++;
      else if (hour >= 18 && hour <= 24) timeStats['저녁']++;
      else timeStats['심야']++;
    });
    const days = Object.entries(dailyStats);
    if (days.length === 0) return null;
    const maxDay = days.reduce((a, b) => a[1] > b[1] ? a : b);
    const maxTime = Object.entries(timeStats).reduce((a, b) => a[1] > b[1] ? a : b);
    return { maxDay: { day: maxDay[0], amount: maxDay[1] }, maxTime: maxTime[0] };
  }, [transactions]);

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="11" fontWeight="bold">{percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}</text>;
  };

  const handleCardLayoutChange = (cardId: number, isLandscape: boolean) => {
    setCardLayouts(prev => ({ ...prev, [cardId]: isLandscape }));
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen bg-white"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const maxCardAmount = cardData.length > 0 ? cardData[0].amount : 0;

  return (
    <div className="bg-white min-h-screen pb-10">
      <div className="flex items-center p-4 border-b sticky top-0 bg-white z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-3 hover:bg-gray-50"><ArrowLeft className="w-6 h-6" /></Button>
        <h1 className="text-xl font-bold flex-1">소비 분석</h1>
      </div>

      <div className="p-6 space-y-8">
        
        {/* [수정] 날짜 이동 및 요약 섹션 */}
        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-4 mb-2">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8 rounded-full hover:bg-gray-100">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
            </Button>
            <span className="text-lg font-bold text-gray-700">
                {currentDate.year}년 {currentDate.month}월
            </span>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8 rounded-full hover:bg-gray-100">
                <ChevronRight className="w-5 h-5 text-gray-600" />
            </Button>
          </div>
          
          <p className="text-gray-500 mb-1">총 지출</p>
          <h2 className="text-3xl font-extrabold text-gray-900">{totalAmount.toLocaleString()}<span className="text-xl font-medium">원</span></h2>
        </div>

        {insights && (
          <Card className="shadow-sm border border-blue-100 bg-blue-50/50">
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2 text-blue-700"><TrendingUp className="w-5 h-5"/> 소비 패턴 요약</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start gap-3"><Calendar className="w-4 h-4 text-blue-400 mt-0.5" /><p><strong>{insights.maxDay.day}일</strong>에 가장 많은 지출(<span className="font-bold">{insights.maxDay.amount.toLocaleString()}원</span>)이 있었어요.</p></div>
              <div className="flex items-start gap-3"><Clock className="w-4 h-4 text-blue-400 mt-0.5" /><p>주로 <strong>{insights.maxTime}</strong> 시간대에 카드를 자주 사용하시네요.</p></div>
            </CardContent>
          </Card>
        )}

        <div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><PieChart className="w-5 h-5 text-gray-400"/>어디에 돈을 썼을까?</h3>
          <Card className="shadow-card border-gray-100">
            <CardContent className="pt-6">
              {categoryData.length > 0 ? (
                <>
                  <div className="h-64 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryData} cx="50%" cy="50%" labelLine={false} label={renderCustomizedLabel} outerRadius={80} fill="#8884d8" dataKey="value">
                          {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip formatter={(value: number) => [`${value.toLocaleString()}원`, '지출']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {categoryData.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} /><span className="font-medium text-gray-700">{item.name}</span></div>
                        <span className="font-bold text-gray-900">{item.value.toLocaleString()}원</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <div className="text-center py-10 text-gray-400">내역이 없습니다.</div>}
            </CardContent>
          </Card>
        </div>

        <div>
           <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-gray-400"/>카드별 주요 소비처</h3>
          <div className="space-y-3">
            {cardTopCategory.length > 0 ? (
              cardTopCategory.map((item, index) => (
                  <Card key={index} className="shadow-sm border-gray-100">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-32 h-20 flex-shrink-0 flex items-center justify-center"> 
                            <CardImage 
                              cardId={item.cardId} 
                              name={item.cardName} 
                              onLayoutChange={(isL) => handleCardLayoutChange(item.cardId, isL)}
                            />
                        </div>
                        
                        <div className="flex-1 min-w-0"> 
                          <p className="font-bold text-gray-900 mb-1 truncate">{item.cardName}</p>
                          <p className="text-sm text-gray-500 truncate">
                            주로 <span className="font-bold text-blue-600">{item.category}</span>에 썼어요
                          </p>
                        </div>
                      </div>

                      <div className="text-right pl-2">
                          <p className="text-sm font-bold text-gray-900">{item.amount.toLocaleString()}원</p>
                          <p className="text-xs text-gray-400">({((item.amount / item.totalCardAmount) * 100).toFixed(0)}%)</p>
                      </div>
                    </CardContent>
                  </Card>
              ))
            ) : <div className="text-center py-8 text-gray-400">데이터가 없습니다.</div>}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-gray-400"/>가장 많이 쓴 카드는?</h3>
          <Card className="shadow-card border-gray-100">
            <CardContent className="pt-6 pb-6">
              {cardData.length > 0 ? (
                <div className="space-y-5">
                  {cardData.map((item, index) => {
                    const widthPercent = (item.amount / maxCardAmount) * 100;
                    
                    return (
                      <div key={item.cardId} className="flex items-center gap-4">
                        {/* 1. 카드 이미지 영역 */}
                        <div className="w-20 h-12 flex-shrink-0 flex items-center justify-center">
                          <CardImage 
                            cardId={item.cardId} 
                            name={item.name}
                          />
                        </div>

                        {/* 2. 막대 그래프 및 정보 영역 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-end mb-1">
                            {/* item.name은 이제 cardNameMap을 통해 실제 카드 이름으로 표시됩니다 */}
                            <span className="font-medium text-sm text-gray-700 truncate mr-2">{item.name}</span>
                            <span className="font-bold text-sm text-gray-900">{item.amount.toLocaleString()}원</span>
                          </div>
                          
                          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-500"
                              style={{ 
                                width: `${widthPercent}%`,
                                backgroundColor: index === 0 ? '#2563eb' : '#93c5fd'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400">사용 내역이 없습니다.</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="pt-4">
          <Button variant="outline" className="w-full h-12 text-base font-medium border-gray-300 hover:bg-gray-50" onClick={() => navigate('/app/performance')}>카드 실적 자세히 보기</Button>
        </div>

      </div>
    </div>
  );
};

export default SpendingDetail;