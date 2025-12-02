import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Wallet, Calendar, Clock, TrendingUp, CreditCard, ShoppingBag } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { fetchWithAuth } from '@/lib/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

type Transaction = {
  id: number;
  amount_krw: number;
  merchant_name: string;
  category?: string;
  card_id: number;
  transaction_date: string;
};

type CardMaster = {
  card_id: number;
  card_name: string;
  card_img_url?: string;
};

// 카테고리 분류 헬퍼 함수
const getCategory = (tx: Transaction) => {
  if (tx.category) return tx.category;
  
  const name = tx.merchant_name;
  if (name.includes('스타벅스') || name.includes('카페') || name.includes('커피')) return '카페/간식';
  if (name.includes('편의점') || name.includes('마트') || name.includes('GS25') || name.includes('CU')) return '쇼핑/마트';
  if (name.includes('식당') || name.includes('음식') || name.includes('버거')) return '식비';
  if (name.includes('주유') || name.includes('교통') || name.includes('택시')) return '교통/주유';
  return '기타 소비';
};

const SpendingDetail = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cardList, setCardList] = useState<CardMaster[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. 데이터 가져오기
  useEffect(() => {
    const loadData = async () => {
      try {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        
        const txRes = await fetchWithAuth(`http://localhost:8000/api/analysis/calendar?year=${year}&month=${month}`);
        // [주의] 실제 카드 목록 API 주소 확인 필요
        const cardRes = await fetchWithAuth(`http://localhost:8000/api/cards`); 

        if (txRes.ok) {
          const txData = await txRes.json();
          setTransactions(txData);
          
          if (cardRes.ok) {
            const cardData = await cardRes.json();
            setCardList(cardData);
          }
        }
      } catch (error) {
        console.error("데이터 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // --- 2. 데이터 분석 로직 ---

  // Card ID 매핑
  const cardNameMap = useMemo(() => {
    const map: Record<number, string> = {};
    cardList.forEach(card => {
      map[card.card_id] = card.card_name;
    });
    return map;
  }, [cardList]);

  // [통계 1] 총 지출
  const totalAmount = useMemo(() => {
    return transactions.reduce((acc, curr) => acc + curr.amount_krw, 0);
  }, [transactions]);

  // [통계 2] 전체 카테고리별 지출
  const categoryData = useMemo(() => {
    const stats: Record<string, number> = {};
    transactions.forEach(tx => {
      const cat = getCategory(tx);
      stats[cat] = (stats[cat] || 0) + tx.amount_krw;
    });

    return Object.entries(stats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // [통계 3] 카드별 사용 금액
  const cardData = useMemo(() => {
    const stats: Record<string, number> = {};
    transactions.forEach(tx => {
      const name = cardNameMap[tx.card_id] || `카드 ${tx.card_id}`;
      stats[name] = (stats[name] || 0) + tx.amount_krw;
    });
    return Object.entries(stats)
      .map(([name, value]) => ({ name, amount: value }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, cardNameMap]);

  // [통계 4] 카드별 최다 소비 카테고리 (NEW!)
  const cardTopCategory = useMemo(() => {
    // 1. 카드별로 카테고리 통계 집계
    // 구조: { '신한카드': { '식비': 5000, '카페': 3000 }, ... }
    const stats: Record<string, Record<string, number>> = {};

    transactions.forEach(tx => {
      const cardName = cardNameMap[tx.card_id] || `카드 ${tx.card_id}`;
      const cat = getCategory(tx);

      if (!stats[cardName]) stats[cardName] = {};
      stats[cardName][cat] = (stats[cardName][cat] || 0) + tx.amount_krw;
    });

    // 2. 각 카드별 1등 카테고리 추출
    const result = Object.entries(stats).map(([cardName, catStats]) => {
      // 해당 카드의 카테고리 중 max 찾기
      const topCat = Object.entries(catStats).reduce((max, curr) => 
        curr[1] > max[1] ? curr : max
      );
      
      return {
        cardName,
        category: topCat[0],
        amount: topCat[1],
        totalCardAmount: Object.values(catStats).reduce((a, b) => a + b, 0) // 비중 계산용
      };
    });
    
    // 많이 쓴 카드 순으로 정렬
    return result.sort((a, b) => b.totalCardAmount - a.totalCardAmount);

  }, [transactions, cardNameMap]);

  // [통계 5] 인사이트
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
    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="11" fontWeight="bold">
        {percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
      </text>
    );
  };

  if (loading) return <div className="p-20 text-center text-gray-500">데이터를 분석하고 있어요...</div>;

  return (
    <div className="bg-white min-h-screen pb-10">
      <div className="flex items-center p-4 border-b sticky top-0 bg-white z-10">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate(-1)}
          className="mr-3 hover:bg-gray-50"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold flex-1">소비 분석</h1>
      </div>

      <div className="p-6 space-y-8">
        
        {/* 요약 */}
        <div className="text-center py-4">
          <p className="text-gray-500 mb-1">이번 달 총 지출</p>
          <h2 className="text-3xl font-extrabold text-gray-900">
            {totalAmount.toLocaleString()}<span className="text-xl font-medium">원</span>
          </h2>
        </div>

        {/* 인사이트 */}
        {insights && (
          <Card className="shadow-sm border border-blue-100 bg-blue-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-blue-700">
                <TrendingUp className="w-5 h-5"/> 소비 패턴 요약
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-blue-400 mt-0.5" />
                <p><strong>{insights.maxDay.day}일</strong>에 가장 많은 지출(<span className="font-bold">{insights.maxDay.amount.toLocaleString()}원</span>)이 있었어요.</p>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-blue-400 mt-0.5" />
                <p>주로 <strong>{insights.maxTime}</strong> 시간대에 카드를 자주 사용하시네요.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 카테고리 차트 */}
        <div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-gray-400"/>
            어디에 돈을 썼을까?
          </h3>
          <Card className="shadow-card border-gray-100">
            <CardContent className="pt-6">
              {categoryData.length > 0 ? (
                <>
                  <div className="h-64 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomizedLabel}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [`${value.toLocaleString()}원`, '지출']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {categoryData.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="font-medium text-gray-700">{item.name}</span>
                        </div>
                        <span className="font-bold text-gray-900">{item.value.toLocaleString()}원</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-10 text-gray-400">내역이 없습니다.</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* [NEW] 카드별 최다 소비 카테고리 */}
        <div>
           <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-gray-400"/>
            카드별 주요 소비처
          </h3>
          <div className="space-y-3">
            {cardTopCategory.length > 0 ? (
              cardTopCategory.map((item, index) => (
                <Card key={index} className="shadow-sm border-gray-100">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900 mb-1">{item.cardName}</p>
                      <p className="text-sm text-gray-500">
                        주로 <span className="font-bold text-blue-600">{item.category}</span>에 썼어요
                      </p>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-bold text-gray-900">{item.amount.toLocaleString()}원</p>
                       <p className="text-xs text-gray-400">({((item.amount / item.totalCardAmount) * 100).toFixed(0)}%)</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">데이터가 없습니다.</div>
            )}
          </div>
        </div>

        {/* 카드별 차트 */}
        <div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gray-400"/>
            가장 많이 쓴 카드는?
          </h3>
          <Card className="shadow-card border-gray-100">
            <CardContent className="pt-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cardData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={100} 
                      tick={{fontSize: 12, fill: '#4b5563'}} 
                      interval={0}
                    />
                    <Tooltip 
                      cursor={{fill: '#f3f4f6'}}
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                      formatter={(value: number) => [`${value.toLocaleString()}원`, '사용금액']} 
                    />
                    <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={24}>
                      {cardData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#2563eb' : '#93c5fd'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 하단 버튼 */}
        <div className="pt-4">
          <Button 
            variant="outline" 
            className="w-full h-12 text-base font-medium border-gray-300 hover:bg-gray-50"
            onClick={() => navigate('/app/performance')}
          >
            카드 실적 자세히 보기
          </Button>
        </div>

      </div>
    </div>
  );
};

export default SpendingDetail;