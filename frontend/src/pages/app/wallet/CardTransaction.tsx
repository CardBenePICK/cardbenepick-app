import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, ChevronLeft, ChevronRight, 
  SearchX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  format, subMonths, addMonths, parseISO, isSameMonth, isFuture 
} from 'date-fns';
import { ko } from 'date-fns/locale';

import { transactionApi, TransactionItem } from '@/api/transaction';
import { useCardStore } from '@/store/useCardStore';
import { IMAGE_BASE_URL, PLACEHOLDER_IMAGE_URL } from '@/lib/constants';
import { cn } from '@/lib/utils';

// 거래 내역 아이템 확장 타입 (할인 금액 포함)
interface ExtendedTransactionItem extends TransactionItem {
  discount_amount?: number;
}

const CardTransaction = () => {
  const navigate = useNavigate();
  const { cardId } = useParams<{ cardId: string }>();
  const location = useLocation();
  const { assets } = useCardStore();

  const [currentDate, setCurrentDate] = useState(new Date());

  // 1. 카드 정보 찾기
  const cardInfo = useMemo(() => {
    const fromState = location.state?.cardInfo;
    if (fromState) return fromState;
    if (assets.length > 0) {
      return assets.find(a => a.asset_id.toString() === cardId);
    }
    return null;
  }, [assets, cardId, location.state]);

  // 2. API 데이터 호출
  const { data: transactions = [], isLoading, isError, error } = useQuery({
    queryKey: ['cardHistory', cardId, format(currentDate, 'yyyy-MM')],
    queryFn: () => transactionApi.getCardHistory(
      Number(cardId),
      currentDate.getFullYear(),
      currentDate.getMonth() + 1
    ),
    enabled: !!cardId,
  });

  // [디버깅 로그]
  useEffect(() => {
    if (transactions) {
        console.log(`[CardTransaction] ✅ 데이터 수신 완료 (${transactions.length}건)`);
    }
  }, [transactions]);


  // 3. 통계 계산 및 날짜별 그룹화
  const { totalAmount, totalBenefit, groupedTransactions } = useMemo(() => {
    let amountSum = 0;
    let benefitSum = 0;
    
    // 최신순 정렬
    const sortedList = [...transactions].sort((a, b) => 
      new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
    );

    // 통계 계산
    sortedList.forEach((tx: ExtendedTransactionItem) => {
        // if (tx.transaction_type !== 'cancel') {
        //     amountSum += tx.amount_krw;
        //     benefitSum += (tx.discount_amount || 0);
        // }
    });

    // 날짜별 그룹화
    const grouped: Record<string, ExtendedTransactionItem[]> = {};
    sortedList.forEach(tx => {
        const dateKey = tx.transaction_date.split('T')[0]; // YYYY-MM-DD
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(tx);
    });

    return { 
      totalAmount: amountSum, 
      totalBenefit: benefitSum,
      groupedTransactions: grouped
    };
  }, [transactions]);

  const handlePrevMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));
  
  const nextMonthDate = addMonths(currentDate, 1);
  const isNextBtnDisabled = nextMonthDate > new Date();

  // [수정] 이미지 확장자 처리 로직
  // 기본적으로 .png를 시도하고, onError에서 다른 확장자를 시도합니다.
  // 상태를 사용하여 현재 시도 중인 이미지 URL을 관리합니다.
  const [currentImageSrc, setCurrentImageSrc] = useState<string>('');

  useEffect(() => {
    if (cardId) {
        // 초기값: .png로 설정
        setCurrentImageSrc(`${IMAGE_BASE_URL}/${cardId}card.png`);
    }
  }, [cardId]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    const currentSrc = target.src;

    // .png 실패 시 -> .jpg 시도
    if (currentSrc.endsWith('.png')) {
        setCurrentImageSrc(`${IMAGE_BASE_URL}/${cardId}card.jpg`);
    } 
    // .jpg 실패 시 -> .gif 시도
    else if (currentSrc.endsWith('.jpg')) {
        setCurrentImageSrc(`${IMAGE_BASE_URL}/${cardId}card.gif`);
    }
    // .gif 실패 시 -> placeholder로 대체
    else if (currentSrc.endsWith('.gif')) {
        target.src = PLACEHOLDER_IMAGE_URL;
        // 무한 루프 방지를 위해 onError 핸들러 제거 (선택사항)
        target.onerror = null; 
    } else {
        // 그 외 실패 시 바로 placeholder
        target.src = PLACEHOLDER_IMAGE_URL;
    }
  };


  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center p-4 bg-white sticky top-0 z-10 border-b border-gray-50">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2">
          <ArrowLeft className="w-6 h-6 text-gray-800" />
        </Button>
        <h1 className="text-lg font-bold text-gray-900">카드 이용 내역</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-8 scrollbar-hide">
        {/* --- 상단 카드 정보 & 월별 요약 --- */}
        <div className="bg-white pb-8 pt-2 flex flex-col items-center border-b-[10px] border-gray-50 z-0 mb-2">
            
            <div className="w-32 h-auto my-6 shadow-lg rounded-lg transform transition-transform hover:scale-105 duration-300">
                <img 
                    src={currentImageSrc || PLACEHOLDER_IMAGE_URL} // 상태값 사용
                    alt={cardInfo?.external_account_name || "카드"} 
                    className="w-full h-full object-contain rounded-lg"
                    onError={handleImageError} // 에러 핸들러 연결
                />
            </div>
            
            <div className="flex items-center justify-center space-x-8 mb-6">
                <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-colors">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <span className="text-xl font-extrabold text-gray-900 tracking-tight">
                    {format(currentDate, 'yyyy년 M월', { locale: ko })}
                </span>
                <button 
                    onClick={handleNextMonth} 
                    disabled={isNextBtnDisabled}
                    className={cn("p-2 rounded-full transition-colors", isNextBtnDisabled ? "text-gray-200 cursor-not-allowed" : "text-gray-400 hover:bg-gray-50 hover:text-gray-900")}
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>

            <div className="text-center w-full px-8 space-y-1">
                <h2 className="text-sm font-medium text-gray-500 mb-4">
                    {cardInfo?.external_account_name || cardInfo?.institution_name || '내 카드'}
                </h2>
                
                <div className="flex justify-between items-center w-full max-w-[280px] mx-auto py-2">
                    <div className="text-center">
                        <p className="text-[11px] text-gray-400 mb-1">이번 달 사용 금액</p>
                        <p className="text-lg font-bold text-gray-900">
                            {isLoading ? <Skeleton className="h-6 w-20 mx-auto" /> : `${totalAmount.toLocaleString()}원`}
                        </p>
                    </div>
                    <div className="h-8 w-[1px] bg-gray-100"></div>
                    <div className="text-center">
                        <p className="text-[11px] text-gray-400 mb-1">받은 혜택</p>
                        <p className="text-lg font-bold text-[#45B7D1]">
                            {isLoading ? <Skeleton className="h-6 w-20 mx-auto" /> : `${totalBenefit.toLocaleString()}원`}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* --- 거래 내역 리스트 --- */}
        <div className="px-0">
            {isLoading ? (
                // Loading Skeletons
                <div className="px-5 py-4 space-y-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-3">
                            <Skeleton className="w-20 h-4 bg-gray-100" />
                            <div className="flex justify-between">
                                <div className="space-y-1">
                                    <Skeleton className="w-32 h-5 bg-gray-100" />
                                    <Skeleton className="w-16 h-3 bg-gray-50" />
                                </div>
                                <Skeleton className="w-24 h-5 bg-gray-100" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : Object.keys(groupedTransactions).length > 0 ? (
                Object.entries(groupedTransactions).map(([dateStr, txs]) => {
                    const dateObj = parseISO(dateStr);
                    return (
                        <div key={dateStr} className="mb-6">
                            {/* 날짜 헤더 */}
                            <div className="px-5 pb-2 sticky top-0 bg-white/95 backdrop-blur-sm z-10 pt-4 border-b border-gray-50">
                                <span className="text-sm font-bold text-gray-400">
                                    {format(dateObj, 'M월 d일')}
                                </span>
                            </div>

                            {/* 해당 날짜 내역들 */}
                            <div className="flex flex-col">
                                {txs.map((tx) => {
                                    const txTime = parseISO(tx.transaction_date);
                                    const isCancel = false;

                                    return (
                                        <div 
                                            key={tx.id} 
                                            className="flex items-start justify-between px-5 py-4 active:bg-gray-50 active:scale-[0.99] transition-all duration-200 cursor-pointer border-b border-gray-50 last:border-none"
                                        >
                                            <div className="flex flex-col gap-0.5">
                                                {/* 가맹점 이름 */}
                                                <span className={cn("text-[15px] font-bold text-gray-900", isCancel && "text-gray-400 line-through")}>
                                                    {tx.merchant_name}
                                                </span>
                                                {/* 시간 (요청하신 색상 적용) */}
                                                <span className="text-[11px] font-medium text-[#45B7D1]">
                                                    {format(txTime, 'HH:mm')}
                                                    {isCancel && <span className="text-red-400 ml-1">취소</span>}
                                                </span>
                                            </div>

                                            <div className="flex flex-col items-end gap-0.5">
                                                {/* 결제 금액 */}
                                                <span className={cn("text-[15px] font-bold", isCancel ? "text-gray-400 line-through" : "text-gray-900")}>
                                                    {tx.amount_krw.toLocaleString()}원
                                                </span>
                                                {/* 할인 금액 (혜택) */}
                                                {!isCancel && tx.discount_amount && tx.discount_amount > 0 ? (
                                                    <span className="text-[11px] font-bold text-[#45B7D1]">
                                                        {tx.discount_amount.toLocaleString()}원 할인
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className="flex flex-col items-center justify-center py-24 text-gray-300">
                    <SearchX className="w-12 h-12 mb-3 opacity-30" />
                    <p className="text-sm">이번 달 거래 내역이 없습니다.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default CardTransaction;