import { useState, useEffect } from 'react';
// --- [수정됨] ---
import { useNavigate, Link, useLocation } from 'react-router-dom';
// --- [수정 완료] ---
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Loader2, CheckCircle } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { sampleCards } from '@/data/mockData';

// 목업 데이터 수정 (실제 카드만)
const mockCards = [
  { ...sampleCards[0], cardImage: '/images/13card.png' },
  { ...sampleCards[1], cardImage: '/images/51card.png' },
];

// '카드 추가'용 더미 객체 생성
const addCardSlot = {
  id: 'add',
  name: '카드 추가',
  cardImage: '',
};

// 캐러셀에 표시할 실제 목록 (기존 카드 + '추가' 슬롯)
const carouselItems = [...mockCards, addCardSlot];

const Wallet = () => {
  const navigate = useNavigate();
  // --- [수정됨] ---
  const location = useLocation(); // location 객체 가져오기
  // --- [수정 완료] ---
  
  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'activating' | 'activated'>('idle');

  // --- [수정됨] ---
  useEffect(() => {
    if (!api) return;

    // 1. 챗봇에서 state를 넘겼는지 확인 (recommendedCardId가 존재하는지)
    const cameFromChat = location.state?.recommendedCardId;
    
    if (cameFromChat) {
      // 2. 챗봇에서 왔다면, 무조건 두 번째 카드(인덱스 1)로 스크롤합니다.
      const targetIndex = 1; 

      api.scrollTo(targetIndex); 
      setActiveIndex(targetIndex);
        
      // 3. 스크롤 후, location state를 초기화합니다.
      navigate(location.pathname, { replace: true, state: {} });
      
    } else {
      // 4. state가 없으면(일반적인 월렛 방문) 기본 인덱스를 설정합니다.
      setActiveIndex(api.selectedScrollSnap());
    }

    // 5. 사용자가 직접 스크롤할 때 activeIndex를 업데이트하는 리스너를 등록합니다.
    const onSelect = () => {
      setActiveIndex(api.selectedScrollSnap());
    };
    api.on("select", onSelect);

    // 6. 클린업
    return () => {
      api.off("select", onSelect);
    };

  }, [api, location.state, navigate, location.pathname]); // 의존성 배열 수정
  // --- [수정 완료] ---

  const handlePayment = () => {
    // 결제 로직
    setPaymentStatus('activating'); 
    setTimeout(() => {
      setPaymentStatus('activated'); 
      setTimeout(() => {
        setIsModalOpen(false); // 결제 완료 후 1.5초 뒤 팝업 닫기
      }, 1500);
    }, 2000);
  };

  // 모달이 닫힐 때(취소 또는 외부 클릭) 상태 초기화
  const onModalOpenChange = (open: boolean) => {
    if (!open) {
      setPaymentStatus('idle');
    }
    setIsModalOpen(open);
  }

  // 현재 활성화된 아이템 정보 가져오기
  const getActiveItem = () => carouselItems[activeIndex] || carouselItems[0];
  const isAddCardActive = getActiveItem().id === 'add';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <h1 className="text-lg font-semibold flex-1 text-center">월렛</h1>
      </div>

      {/* --- 카드 캐러셀 --- */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 space-y-8 overflow-hidden">
        
        <Carousel 
          setApi={setApi} 
          className="w-full max-w-xs" 
          opts={{
            loop: false, // '카드 추가' 슬롯이 마지막에 고정되도록 loop 비활성화
            align: "start",
          }}
        >
          <CarouselContent>
            {carouselItems.map((card) => (
              <CarouselItem key={card.id}>
                {card.id === 'add' ? (
                  // '카드 추가' 슬롯 렌더링
                  <Link to="/app/wallet/add">
                    <Card 
                      className="shadow-none border-2 border-dashed border-muted-foreground/30 bg-transparent flex items-center justify-center"
                      style={{
                        aspectRatio: '85.6 / 53.98' // 가로 카드 비율
                      }}
                    >
                      <div className="flex flex-col items-center text-muted-foreground/70">
                        <Plus className="w-10 h-10" />
                        <span className="text-sm font-medium">카드 추가</span>
                      </div>
                    </Card>
                  </Link>
                ) : (
                  // 일반 카드 렌더링 (눕혀진 카드)
                  <Card 
                    className="shadow-elevated overflow-hidden rounded-lg bg-white flex items-center justify-center"
                    style={{
                      aspectRatio: '85.6 / 53.98' // 가로 카드 비율
                    }}
                  >
                    <img 
                      src={card.cardImage} 
                      alt={card.name} 
                      className="w-full h-full object-contain -rotate-90 scale-[1.15]"
                    />
                  </Card>
                )}
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* 캐러셀 인디케이터 (점) */}
        <div className="flex justify-center gap-2">
          {carouselItems.map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === activeIndex ? "w-4 bg-primary" : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>

        {/* '카드 추가' 슬롯이 활성화되면 '결제하기' 버튼 숨기기 */}
        {!isAddCardActive && (
          <AlertDialog open={isModalOpen} onOpenChange={onModalOpenChange}>
            <AlertDialogTrigger asChild>
              <Button className="w-full max-w-xs mx-auto btn-gradient h-12 text-lg font-medium shadow-lg">
                결제하기
              </Button>
            </AlertDialogTrigger>
            
            <AlertDialogContent className="max-w-[300px]">
              {paymentStatus === 'idle' && (
                <>
                  <AlertDialogHeader>
                    <AlertDialogTitle>결제하시겠습니까?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {getActiveItem().name}(으)로 1,000원(테스트)을 결제합니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    
                    {/* --- [수정됨] --- */}
                    {/* <AlertDialogAction>은 클릭 시 팝업을 닫아버리므로,
                        일반 <Button>으로 교체해야 상태가 유지됩니다. */}
                    <Button onClick={handlePayment} className="btn-gradient">
                      결제
                    </Button>
                    {/* --- [수정 완료] --- */}
                    
                  </AlertDialogFooter>
                </>
              )}
              
              {(paymentStatus === 'activating' || paymentStatus === 'activated') && (
                <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4 perspective-1000">
                  <div 
                    className={cn(
                      "relative w-48 rounded-lg overflow-hidden shadow-elevated transform-style-3d",
                      "animate-card-stand-up", 
                      paymentStatus === 'activated' && "animate-card-activated"
                    )}
                    style={{ aspectRatio: '53.98 / 85.6' }}
                  >
                    <img
                      src={getActiveItem().cardImage}
                      alt={getActiveItem().name}
                      className="w-full h-full object-cover backface-hidden"
                    />
                  </div>
                  {paymentStatus === 'activating' && (
                    <div className="flex items-center space-x-2 text-muted-foreground pt-4">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>결제 중...</span>
                    </div>
                  )}
                  {paymentStatus === 'activated' && (
                    <div className="flex items-center space-x-2 text-success font-semibold pt-4">
                      <CheckCircle className="w-5 h-5" />
                      <span>결제 완료!</span>
                    </div>
                  )}
                </div>
              )}
            </AlertDialogContent>
          </AlertDialog>
        )}
        
        {/* '카드 추가' 슬롯이 활성화되면 '카드 등록' 버튼을 대신 표시 */}
        {isAddCardActive && (
            <Button 
            className="w-full max-w-xs mx-auto btn-gradient h-12 text-lg font-medium shadow-lg"
            onClick={() => navigate('/app/wallet/add')}
          >
            카드 등록하기
          </Button>
        )}
      </div>
    </div>
  );
};

export default Wallet;