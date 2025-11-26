import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ChevronLeft, ChevronRight, 
  ShoppingBag, Coffee, Bus, Fuel, Utensils, ShoppingCart, Smartphone, Ticket 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  format, parseISO, isSameDay, getDay, getDate, 
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth 
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { fetchWithAuth } from '@/lib/api';
import { cn } from '@/lib/utils';

// --- 아이콘 매핑 ---
const getCategoryIcon = (merchantName: string) => {
  const name = merchantName.toLowerCase();
  const style = "w-5 h-5 text-white";
  
  if (name.includes('스타벅스') || name.includes('카페')) return <div className="bg-green-400 p-2 rounded-full"><Coffee className={style} /></div>;
  if (name.includes('편의점') || name.includes('마트')) return <div className="bg-blue-400 p-2 rounded-full"><ShoppingCart className={style} /></div>;
  if (name.includes('택시') || name.includes('교통') || name.includes('지하철')) return <div className="bg-yellow-400 p-2 rounded-full"><Bus className={style} /></div>;
  if (name.includes('주유')) return <div className="bg-slate-500 p-2 rounded-full"><Fuel className={style} /></div>;
  if (name.includes('식당') || name.includes('음식') || name.includes('버거')) return <div className="bg-orange-400 p-2 rounded-full"><Utensils className={style} /></div>;
  if (name.includes('통신')) return <div className="bg-purple-400 p-2 rounded-full"><Smartphone className={style} /></div>;
  if (name.includes('넷플릭스') || name.includes('영화')) return <div className="bg-red-400 p-2 rounded-full"><Ticket className={style} /></div>;
  
  return <div className="bg-gray-300 p-2 rounded-full"><ShoppingBag className={style} /></div>;
};

// --- 요일 텍스트 ---
const getDayKo = (dateStr: string) => {
  const day = getDay(parseISO(dateStr));
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[day];
};

type Transaction = {
  id: string;
  amount: number;
  merchant: string;
  card_company: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
};

const SpendingCalendar = () => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // 1. 데이터 로드
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;
        const res = await fetchWithAuth(`http://localhost:8000/api/analysis/calendar?year=${year}&month=${month}`);
        if (res.ok) {
          const data = await res.json();
          setTransactions(data);
        }
      } catch (error) {
        console.error("Failed to load transactions", error);
      }
    };
    fetchTransactions();
  }, [currentMonth]);

  // 2. 월 통계 계산
  const totalExpense = transactions.reduce((acc, curr) => acc + curr.amount, 0);
  
  // 3. 내역 뷰용 데이터 그룹화
  const groupedTransactions = useMemo(() => {
    const grouped: Record<string, Transaction[]> = {};
    const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    sorted.forEach(tx => {
      if (!grouped[tx.date]) grouped[tx.date] = [];
      grouped[tx.date].push(tx);
    });
    return grouped;
  }, [transactions]);

  // 4. 달력 뷰용 일별 합계
  const dailyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    transactions.forEach(tx => {
      totals[tx.date] = (totals[tx.date] || 0) + tx.amount;
    });
    return totals;
  }, [transactions]);

  // 5. 선택 날짜 내역
  const selectedDayTransactions = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return transactions.filter(t => t.date === dateStr);
  }, [selectedDate, transactions]);

  // --- 월 이동 ---
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  // --- [핵심] 주 단위 달력 데이터 생성 ---
  const calendarWeeks = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    allDays.forEach((day) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    
    return weeks;
  }, [currentMonth]);

  return (
    <div className="app-container bg-white min-h-screen flex flex-col relative">
      {/* --- Header --- */}
      <div className="px-4 py-3 flex items-center justify-between sticky top-0 bg-white z-20">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)}><ArrowLeft className="w-6 h-6" /></button>
          <h1 className="text-xl font-bold">가계부</h1>
        </div>
      </div>

      {/* --- 상단 월 네비게이션 & 요약 --- */}
      <div className="px-6 pt-2 pb-6 bg-white z-10 shadow-sm relative">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft className="w-5 h-5 text-gray-500" /></button>
          <span className="text-xl font-bold text-gray-900">
            {currentMonth.getMonth() + 1}월
          </span>
          <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-full"><ChevronRight className="w-5 h-5 text-gray-500" /></button>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-end">
            <span className="text-gray-500 text-sm">지출</span>
            <span className="text-xl font-bold text-gray-900">{totalExpense.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-gray-500 text-sm">수입</span>
            <span className="text-sm font-medium text-green-500">0원</span>
          </div>
        </div>
      </div>

      <div className="h-2 bg-gray-50 w-full" />

      {/* --- Main Content --- */}
      <div className="flex-1 overflow-y-auto pb-32"> {/* 하단 탭바 높이만큼 패딩 */}
        
        {/* [VIEW 1] 리스트 모드 (내역) */}
        {viewMode === 'list' && (
          <div className="p-4 space-y-6">
            {Object.keys(groupedTransactions).length > 0 ? (
              Object.entries(groupedTransactions).map(([dateStr, txs]) => {
                const daySum = txs.reduce((acc, curr) => acc + curr.amount, 0);
                const dateObj = parseISO(dateStr);
                
                return (
                  <div key={dateStr}>
                    <div className="flex justify-between items-center mb-3 px-1">
                      <span className="text-sm text-gray-500">
                        {getDate(dateObj)}일 {getDayKo(dateStr)}요일
                      </span>
                      <div className="text-sm">
                        <span className="text-gray-900 font-bold">-{daySum.toLocaleString()}원</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {txs.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getCategoryIcon(tx.merchant)}
                            <div>
                              <div className="font-medium text-gray-900 text-[15px]">{tx.merchant}</div>
                              <div className="text-xs text-gray-400">
                                {tx.card_company} | {tx.time}
                              </div>
                            </div>
                          </div>
                          <div className="font-bold text-gray-900 text-[15px]">
                            -{tx.amount.toLocaleString()}원
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 h-[1px] bg-gray-100" />
                  </div>
                );
              })
            ) : (
              <div className="text-center py-20 text-gray-400">
                이번 달 내역이 없습니다.
              </div>
            )}
          </div>
        )}

        {/* [VIEW 2] 캘린더 모드 (Custom Grid) */}
        {viewMode === 'calendar' && (
          <div className="flex flex-col h-full">
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 text-center py-2 border-b border-gray-100 bg-white sticky top-0 z-10">
              {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
                <span key={i} className={cn("text-xs font-medium", i === 0 ? "text-red-400" : "text-gray-400")}>
                  {day}
                </span>
              ))}
            </div>

            {/* 달력 그리드 (주 단위 렌더링) */}
            <div>
              {calendarWeeks.map((week, weekIndex) => {
                // 주간 합계 계산 (현재 월에 포함된 날짜만)
                const weeklyTotal = week.reduce((sum, day) => {
                  if (!isSameMonth(day, currentMonth)) return sum;
                  const dateKey = format(day, 'yyyy-MM-dd');
                  return sum + (dailyTotals[dateKey] || 0);
                }, 0);

                return (
                  <div key={weekIndex} className="relative">
                    
                    {/* 날짜 행 */}
                    <div className="grid grid-cols-7">
                      {week.map((day, dayIndex) => {
                        const dateKey = format(day, 'yyyy-MM-dd');
                        const dayAmount = dailyTotals[dateKey] || 0;
                        const isSelected = selectedDate && isSameDay(day, selectedDate);
                        const isCurrentMonth = isSameMonth(day, currentMonth);

                        return (
                          <div 
                            key={dayIndex}
                            onClick={() => setSelectedDate(day)}
                            className={cn(
                              "min-h-[85px] p-1 flex flex-col items-center border-b border-r border-gray-50 relative cursor-pointer transition-all",
                              !isCurrentMonth && "bg-gray-50/50",
                              isSelected && "bg-blue-50/80 ring-1 ring-inset ring-blue-200"
                            )}
                          >
                            {/* 날짜 숫자 */}
                            <span className={cn(
                              "text-xs font-medium mb-1 rounded-full w-6 h-6 flex items-center justify-center transition-colors",
                              dayIndex === 0 ? "text-red-400" : "text-gray-700",
                              isSelected && "bg-blue-500 text-white shadow-sm",
                              !isCurrentMonth && "text-gray-300"
                            )}>
                              {getDate(day)}
                            </span>

                            {/* 일별 지출액 */}
                            {dayAmount > 0 && isCurrentMonth && (
                              <span className="text-[10px] font-bold text-blue-600 tracking-tight mt-1">
                                -{(dayAmount / 10000).toFixed(0) === '0' ? dayAmount.toLocaleString() : `${(dayAmount/10000).toFixed(1)}만`}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* 🔥 [수정됨] 주간 소비 요약 (조건 제거: 0원이어도 표시) */}
                    <div className="w-full bg-[#F9FAFB] py-1.5 px-4 flex justify-end items-center border-b border-gray-100">
                      <span className="text-xs text-gray-400 mr-2 font-medium">
                        {weekIndex + 1}주 합계
                      </span>
                      <span className={cn("text-sm font-bold", weeklyTotal > 0 ? "text-gray-800" : "text-gray-300")}>
                        -{weeklyTotal.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 선택 날짜 상세 리스트 */}
            <div className="p-4 bg-white border-t border-gray-100 min-h-[200px]">
              {selectedDate ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 flex justify-between items-center">
                    <span>{format(selectedDate, 'M월 d일 EEEE', { locale: ko })}</span>
                    {/* 상세 헤더는 지출이 0원이면 굳이 0원이라고 크게 안 보여줘도 됨 (깔끔하게) */}
                    {(dailyTotals[format(selectedDate, 'yyyy-MM-dd')] || 0) > 0 && (
                      <span className="text-blue-600 font-bold">
                        -{dailyTotals[format(selectedDate, 'yyyy-MM-dd')].toLocaleString()}원
                      </span>
                    )}
                  </h3>
                  
                  {selectedDayTransactions.length > 0 ? (
                    selectedDayTransactions.map(tx => (
                      <Card key={tx.id} className="shadow-sm border-none bg-gray-50 hover:bg-gray-100 transition-colors">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getCategoryIcon(tx.merchant)}
                            <div>
                              <p className="font-bold text-gray-900 text-sm">{tx.merchant}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{tx.time} | {tx.card_company}</p>
                            </div>
                          </div>
                          <p className="font-bold text-gray-900 text-sm">-{tx.amount.toLocaleString()}원</p>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-lg">
                      내역이 없습니다.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">날짜를 선택해주세요.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* --- 하단 플로팅 탭 --- */}
      <div className="fixed bottom-24 left-0 right-0 flex justify-center z-30 pointer-events-none">
        <div className="bg-gray-900/90 backdrop-blur-sm text-white rounded-full p-1.5 flex shadow-xl items-center pointer-events-auto transform hover:scale-105 transition-transform">
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-bold transition-all",
              viewMode === 'list' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-white"
            )}
          >
            내역
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-bold transition-all",
              viewMode === 'calendar' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-white"
            )}
          >
            달력
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpendingCalendar;