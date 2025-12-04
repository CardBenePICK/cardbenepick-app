import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, ChevronLeft, ChevronRight, 
  ShoppingBag, Coffee, Bus, Fuel, Utensils, ShoppingCart, Smartphone, Ticket, Loader2, CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  format, parseISO, isSameDay, getDay, getDate, 
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isToday, subMonths, addMonths
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// [변경] transactionApi 사용
import { transactionApi, TransactionItem } from '@/api/transaction';
import { useCardStore } from '@/store/useCardStore';

// --- 아이콘 매핑 ---
const getCategoryIcon = (merchantName: string) => {
  const name = merchantName.toLowerCase();
  const style = "w-5 h-5 text-white";
  
  if (name.includes('스타벅스') || name.includes('카페')) return <div className="bg-green-500 p-2.5 rounded-full shadow-sm"><Coffee className={style} /></div>;
  if (name.includes('편의점') || name.includes('마트')) return <div className="bg-blue-500 p-2.5 rounded-full shadow-sm"><ShoppingCart className={style} /></div>;
  if (name.includes('택시') || name.includes('교통') || name.includes('지하철')) return <div className="bg-yellow-500 p-2.5 rounded-full shadow-sm"><Bus className={style} /></div>;
  if (name.includes('주유')) return <div className="bg-slate-600 p-2.5 rounded-full shadow-sm"><Fuel className={style} /></div>;
  if (name.includes('식당') || name.includes('음식') || name.includes('버거')) return <div className="bg-orange-500 p-2.5 rounded-full shadow-sm"><Utensils className={style} /></div>;
  if (name.includes('통신')) return <div className="bg-purple-500 p-2.5 rounded-full shadow-sm"><Smartphone className={style} /></div>;
  if (name.includes('넷플릭스') || name.includes('영화')) return <div className="bg-red-500 p-2.5 rounded-full shadow-sm"><Ticket className={style} /></div>;
  
  return <div className="bg-gray-400 p-2.5 rounded-full shadow-sm"><ShoppingBag className={style} /></div>;
};

// --- 요일 텍스트 ---
const getDayKo = (dateStr: string) => {
  const day = getDay(parseISO(dateStr));
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[day];
};

const CardTransaction = () => {
  const navigate = useNavigate();
  // URL 파라미터에서 card_id(assetId)를 가져옵니다. (예: 13)
  const { assetId } = useParams<{ assetId: string }>(); 
  const location = useLocation();
  const { assets } = useCardStore();

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // 1. 카드 정보 찾기 (헤더 표시용)
  const cardInfo = useMemo(() => {
    const fromState = location.state?.cardInfo;
    if (fromState) return fromState;
    if (assets.length > 0) {
        return assets.find(a => a.asset_id.toString() === assetId);
    }
    return null;
  }, [assets, assetId, location.state]);

  // 2. [변경] 백엔드 API를 사용하여 해당 카드의 내역만 가져오기
  const { 
    data: transactions = [], 
    isLoading 
  } = useQuery({
    queryKey: ['cardHistory', assetId, currentMonth.getFullYear(), currentMonth.getMonth()],
    queryFn: () => transactionApi.getCardHistory(
        assetId!, // URL의 assetId (예: "13")
        currentMonth.getFullYear(), 
        currentMonth.getMonth() + 1
    ),
    enabled: !!assetId, // assetId가 있을 때만 호출
  });

  // 3. 데이터 포맷팅 (UI 렌더링용)
  // 백엔드에서 이미 필터링되었으므로 추가 필터링 없이 변환만 수행
  const formattedTransactions = useMemo(() => {
    return transactions.map((tx: TransactionItem) => {
        const dateObj = new Date(tx.transaction_date);
        return {
          id: tx.transaction_id || tx.id.toString(),
          amount: tx.amount_krw,
          merchant: tx.merchant_name,
          // 카드 정보가 있으면 사용, 없으면 API 데이터 사용
          card_company: cardInfo?.institution_name || tx.card_company || '카드', 
          date: tx.transaction_date.split('T')[0],
          time: dateObj.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
        };
      });
  }, [transactions, cardInfo]);

  const totalExpense = useMemo(() => formattedTransactions.reduce((acc, curr) => acc + curr.amount, 0), [formattedTransactions]);
  
  const groupedTransactions = useMemo(() => {
    const grouped: Record<string, typeof formattedTransactions> = {};
    const sorted = [...formattedTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    sorted.forEach(tx => {
      if (!grouped[tx.date]) grouped[tx.date] = [];
      grouped[tx.date].push(tx);
    });
    return grouped;
  }, [formattedTransactions]);

  const dailyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    formattedTransactions.forEach(tx => {
      totals[tx.date] = (totals[tx.date] || 0) + tx.amount;
    });
    return totals;
  }, [formattedTransactions]);

  const selectedDayTransactions = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return formattedTransactions.filter(t => t.date === dateStr);
  }, [selectedDate, formattedTransactions]);

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-gray-500 text-sm">내역을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white w-full"> 
      {/* Header */}
      <div className="flex items-center p-4 bg-white sticky top-0 z-30 border-b border-gray-50">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-3 hover:bg-gray-50">
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </Button>
        <div className="flex flex-col">
            <h1 className="text-lg font-bold text-gray-900 leading-none">
                {cardInfo?.external_account_name || '카드 내역'}
            </h1>
            <span className="text-xs text-gray-500 mt-1">
                {cardInfo?.institution_name}
            </span>
        </div>
      </div>

      {/* Month & Summary */}
      <div className="px-6 pb-2 bg-white z-20 pt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1">
            <span className="text-2xl font-extrabold text-gray-900 mr-2">
              {currentMonth.getMonth() + 1}월
            </span>
            <div className="flex bg-gray-100 rounded-full p-0.5">
              <button onClick={prevMonth} className="p-1 hover:bg-white rounded-full transition-all shadow-sm"><ChevronLeft className="w-4 h-4 text-gray-600" /></button>
              <button onClick={nextMonth} className="p-1 hover:bg-white rounded-full transition-all shadow-sm"><ChevronRight className="w-4 h-4 text-gray-600" /></button>
            </div>
          </div>
          <div className="text-right">
             <p className="text-xs text-gray-500 font-medium mb-0.5">이번 달 지출</p>
             <p className="text-lg font-bold text-gray-900">{totalExpense.toLocaleString()}원</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-32">
        {/* List View */}
        {viewMode === 'list' && (
          <div className="animate-in fade-in duration-300">
            {Object.keys(groupedTransactions).length > 0 ? (
              Object.entries(groupedTransactions).map(([dateStr, txs]) => {
                const daySum = txs.reduce((acc, curr) => acc + curr.amount, 0);
                const dateObj = parseISO(dateStr);
                return (
                  <div key={dateStr} className="mb-2">
                    <div className="flex justify-between items-center px-6 py-4 bg-gray-50/50 border-t border-b border-gray-100">
                      <span className="text-sm font-semibold text-gray-600">
                        {getDate(dateObj)}일 {getDayKo(dateStr)}요일
                      </span>
                      <span className="text-sm font-bold text-gray-900">-{daySum.toLocaleString()}원</span>
                    </div>
                    <div className="px-6">
                      {txs.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-none">
                          <div className="flex items-center gap-4">
                            {getCategoryIcon(tx.merchant)}
                            <div>
                              <div className="font-bold text-gray-900 text-[16px]">{tx.merchant}</div>
                              <div className="text-xs text-gray-400 mt-0.5">{tx.time}</div>
                            </div>
                          </div>
                          <div className="font-bold text-gray-900 text-[16px]">-{tx.amount.toLocaleString()}원</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <ShoppingBag className="w-12 h-12 mb-4 opacity-20" />
                <p>이번 달 내역이 없습니다.</p>
              </div>
            )}
          </div>
        )}

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="flex flex-col h-full animate-in fade-in duration-300">
            <div className="grid grid-cols-7 text-center py-2 bg-white mb-2 border-b border-gray-100">
              {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
                <span key={i} className={cn("text-xs font-normal", i === 0 ? "text-red-500" : "text-gray-400")}>{day}</span>
              ))}
            </div>
            <div className="flex flex-col">
              {calendarWeeks.map((week, weekIndex) => {
                const weeklyTotal = week.reduce((sum, day) => {
                  if (!isSameMonth(day, currentMonth)) return sum;
                  const dateKey = format(day, 'yyyy-MM-dd');
                  return sum + (dailyTotals[dateKey] || 0);
                }, 0);
                return (
                  <div key={weekIndex} className="mb-2">
                    <div className="grid grid-cols-7">
                      {week.map((day, dayIndex) => {
                        const dateKey = format(day, 'yyyy-MM-dd');
                        const dayAmount = dailyTotals[dateKey] || 0;
                        const isSelected = selectedDate && isSameDay(day, selectedDate);
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isTodayDate = isToday(day);
                        return (
                          <div key={dayIndex} onClick={() => setSelectedDate(day)}
                            className={cn("min-h-[70px] flex flex-col items-center justify-start pt-2 pb-1 relative cursor-pointer rounded-lg transition-all mx-0.5", isSelected ? "bg-blue-50" : "hover:bg-gray-50")}>
                            <span className={cn("text-sm w-7 h-7 flex items-center justify-center rounded-full mb-1", isTodayDate ? "bg-slate-800 text-white font-bold" : isSelected ? "text-blue-600 font-bold" : dayIndex === 0 ? "text-red-500" : "text-gray-700", !isCurrentMonth && "text-gray-300")}>
                              {getDate(day)}
                            </span>
                            {dayAmount > 0 && isCurrentMonth && (
                              <span className={cn("text-[10px] font-bold tracking-tight text-blue-600", !isCurrentMonth && "opacity-30")}>
                                -{dayAmount >= 10000 ? `${(dayAmount/10000).toFixed(0)}만` : `${(dayAmount/1000).toFixed(0)}천`}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="w-full bg-gray-50 py-2 px-4 flex justify-end items-center mt-1 mb-2">
                      <span className="text-xs text-gray-500 mr-2">{weekIndex + 1}주 합계</span>
                      <span className={cn("text-sm font-bold", weeklyTotal > 0 ? "text-gray-900" : "text-gray-300")}>-{weeklyTotal.toLocaleString()}원</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom List */}
            <div className="px-6 py-4 bg-white min-h-[200px] border-t-8 border-gray-50 mt-2">
              {selectedDate ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center pb-4 mb-2 border-b border-gray-100">
                    <h3 className="text-base font-bold text-gray-900">{format(selectedDate, 'd일 EEEE', { locale: ko })}</h3>
                    {(dailyTotals[format(selectedDate, 'yyyy-MM-dd')] || 0) > 0 && (
                      <span className="text-blue-600 font-bold text-lg">-{dailyTotals[format(selectedDate, 'yyyy-MM-dd')].toLocaleString()}원</span>
                    )}
                  </div>
                  {selectedDayTransactions.length > 0 ? (
                    selectedDayTransactions.map(tx => (
                      <div key={tx.id} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-none">
                        <div className="flex items-center gap-4">
                          {getCategoryIcon(tx.merchant)}
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{tx.merchant}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{tx.time}</p>
                          </div>
                        </div>
                        <p className="font-bold text-gray-900 text-sm">-{tx.amount.toLocaleString()}원</p>
                      </div>
                    ))
                  ) : (<div className="text-center py-8 text-gray-400 text-sm">지출 내역이 없습니다.</div>)}
                </div>
              ) : (<div className="text-center py-8 text-gray-400">날짜를 선택해주세요.</div>)}
            </div>
          </div>
        )}
      </div>

      {/* Floating Tab */}
      <div className="fixed bottom-20 left-0 right-0 flex justify-center z-30 pointer-events-none">
        <div className="bg-slate-800 text-white rounded-full p-1.5 flex shadow-2xl items-center pointer-events-auto transform transition-transform hover:scale-105">
          <button onClick={() => setViewMode('list')} className={cn("px-6 py-2.5 rounded-full text-sm font-bold transition-all", viewMode === 'list' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-white")}>내역</button>
          <button onClick={() => setViewMode('calendar')} className={cn("px-6 py-2.5 rounded-full text-sm font-bold transition-all", viewMode === 'calendar' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-white")}>달력</button>
        </div>
      </div>
    </div>
  );
};

export default CardTransaction;