import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Loader2, CheckCircle, CreditCard } from 'lucide-react';
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
import { useCardStore, Asset } from '@/store/useCardStore'; // [변경] Store 임포트
import { useToast } from '@/hooks/use-toast'; // [변경] Toast 임포트

const Wallet = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // [변경] 스토어에서 데이터 가져오기
  const { assets, fetchAssets, isLoading } = useCardStore();
  
  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'activating' | 'activated'>('idle');

  // [신규] 결제 정보 입력 상태 (UI는 그대로 두고 변수만 추가)
  const [amount, setAmount] = useState(5000); // 기본값 5,000원
  const [merchant, setMerchant] = useState('스타벅스'); // 기본값

  // [변경] 초기 데이터 로드
  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // [변경] 캐러셀 아이템 구성 (실제 자산 + 카드 추가 슬롯)
  const carouselItems = [
    ...assets.map(asset => ({
      id: asset.asset_id.toString(),
      name: asset.external_account_name || asset.institution_name,
      cardImage: asset.card_image_url || 'http://localhost:8080/placeholder.svg', // 이미지 URL
      type: 'card',
      originalAsset: asset // 실제 결제 시 사용하기 위해 원본 객체 저장
    })),
    {
      id: 'add',
      name: '카드 추가',
      cardImage: '',
      type: 'add',
      originalAsset: null
    }
  ];

  useEffect(() => {
    if (!api) return;

    // 1. 챗봇 등 외부에서 특정 카드를 지정해서 들어온 경우
    const recommendedCardId = location.state?.recommendedCardId;
    
    if (recommendedCardId) {
      // 해당 카드의 인덱스 찾기
      const targetIndex = carouselItems.findIndex(item => item.id === recommendedCardId);
      if (targetIndex !== -1) {
        api.scrollTo(targetIndex); 
        setActiveIndex(targetIndex);
      }
      // state 초기화
      navigate(location.pathname, { replace: true, state: {} });
      
    } else {
      setActiveIndex(api.selectedScrollSnap());
    }

    const onSelect = () => {
      setActiveIndex(api.selectedScrollSnap());
    };
    api.on("select", onSelect);

    return () => {
      api.off("select", onSelect);
    };

  }, [api, location.state, navigate, location.pathname, assets]); // assets 의존성 추가

  // [변경] 실제 결제 API 호출 로직
  const handlePayment = async () => {
    const currentItem = carouselItems[activeIndex];
    if (!currentItem.originalAsset) return; // 예외 처리

    // 1. 애니메이션 시작 (카드 세우기)
    setPaymentStatus('activating'); 

    try {
        // 2. 실제 API 호출 (비동기)
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8080/api/transactions/pay', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                user_asset_id: currentItem.originalAsset.asset_id,
                amount: amount, // 현재는 고정값(5000), 추후 입력값으로 대체
                merchant_name: merchant
            })
        });

        if (!response.ok) throw new Error('승인 거절');

        const result = await response.json();

        // 3. API 성공 시 애니메이션 완료 상태로 전환 (최소 1초 딜레이를 줘서 애니메이션 보여줌)
        setTimeout(() => {
            setPaymentStatus('activated');
            
            toast({
                title: "결제 성공",
                description: `${result.merchant}에서 ${result.amount.toLocaleString()}원 결제되었습니다.`
            });

            // 4. 팝업 닫기
            setTimeout(() => {
                setIsModalOpen(false);
            }, 1500);
        }, 1000);

    } catch (error) {
        console.error(error);
        toast({ title: "결제 실패", description: "결제를 처리할 수 없습니다.", variant: "destructive" });
        setPaymentStatus('idle'); // 에러 시 초기화
        setIsModalOpen(false);
    }
  };

  // 모달이 닫힐 때 상태 초기화
  const onModalOpenChange = (open: boolean) => {
    if (!open) {
      setPaymentStatus('idle');
    }
    setIsModalOpen(open);
  }

  // 현재 활성화된 아이템 정보 가져오기
  const activeItem = carouselItems[activeIndex] || carouselItems[0];
  const isAddCardActive = activeItem.id === 'add';

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="flex items-center p-4 border-b bg-white">
        <h1 className="text-lg font-semibold flex-1 text-center">내 지갑</h1>
      </div>

      {/* --- 카드 캐러셀 --- */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 space-y-8 overflow-hidden">
        
        {isLoading ? (
            <div className="flex flex-col items-center animate-pulse">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">카드를 불러오는 중...</p>
            </div>
        ) : (
        <Carousel 
          setApi={setApi} 
          // className="w-full max-w-xs perspective-1000" 
          className="w-full max-w-xs perspective-1000" 
          opts={{
            loop: false,
            align: "center",
          }}
        >
          <CarouselContent>
            {carouselItems.map((card) => (
              <CarouselItem key={card.id} >
                {card.id === 'add' ? (
                  // '카드 추가' 슬롯
                  <div onClick={() => navigate('/app/wallet/add')} className="cursor-pointer">
                    <Card 
                      className="shadow-sm border-2 border-dashed border-slate-300 bg-white/50 flex items-center justify-center hover:bg-slate-100 transition-colors"
                      // style={{ aspectRatio: '85.6 / 53.98' }}
                    >
                      <div className="flex flex-col items-center text-slate-400">
                        <Plus className="w-10 h-10 mb-2" />
                        <span className="text-sm font-medium">카드 추가</span>
                      </div>
                    </Card>
                  </div>
                ) : (
                  // 일반 카드 (DB 데이터)
                  <div className="p-1">
                    <Card 
                    // className="shadow-elevated overflow-hidden rounded-lg bg-white flex items-center justify-center"
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
                  </div>
                )}
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {/* 이름 표시 */}
          <div className="text-center mt-6 space-y-1 h-12">
            {!isAddCardActive && (
                <>
                    <h3 className="text-lg font-bold text-slate-800">{activeItem.name}</h3>
                    <p className="text-xs text-slate-500">{activeItem.originalAsset?.institution_name}</p>
                </>
            )}
          </div>
        </Carousel>
        )}

        {/* 캐러셀 인디케이터 */}
        <div className="flex justify-center gap-2">
          {carouselItems.map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === activeIndex ? "w-4 bg-primary" : "bg-slate-300"
              )}
            />
          ))}
        </div>

        {/* 버튼 영역 */}
        <div className="w-full max-w-xs">
            {!isAddCardActive ? (
            <AlertDialog open={isModalOpen} onOpenChange={onModalOpenChange}>
                <AlertDialogTrigger asChild>
                <Button className="w-full btn-gradient h-12 text-lg font-bold shadow-lg transition-transform active:scale-95">
                    결제하기
                </Button>
                </AlertDialogTrigger>
                
                <AlertDialogContent className="max-w-[320px] rounded-2xl">
                {paymentStatus === 'idle' && (
                    <>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-center">결제 승인</AlertDialogTitle>
                        <AlertDialogDescription className="text-center">
                        <span className="font-bold text-slate-900">{merchant}</span>에서<br/>
                        <span className="text-lg font-bold text-primary">{amount.toLocaleString()}원</span>을 결제합니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    
                    {/* 카드 미리보기 (작게) */}
                    <div className="flex justify-center py-4">
                        <img src={activeItem.cardImage} className="h-16 object-contain" alt="card" />
                    </div>

                    <AlertDialogFooter className="flex-row space-x-2 sm:space-x-2">
                        <AlertDialogCancel className="flex-1 h-12 m-0">취소</AlertDialogCancel>
                        <Button onClick={handlePayment} className="flex-1 h-12 btn-gradient m-0">
                        승인
                        </Button>
                    </AlertDialogFooter>
                    </>
                )}
                
                {(paymentStatus === 'activating' || paymentStatus === 'activated') && (
                    <div className="flex flex-col items-center justify-center min-h-[300px] space-y-6 perspective-1000">
                    {/* 3D 애니메이션용 카드 컨테이너 */}
                    <div 
                        className={cn(
                        "relative w-32 rounded-lg shadow-2xl transform-style-3d transition-all duration-700",
                        // activating: 카드가 서서히 일어섬 (rotateX)
                        paymentStatus === 'activating' && "animate-card-stand-up", 
                        // activated: 결제 완료 시 반짝임 효과 등
                        paymentStatus === 'activated' && "scale-110 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                        )}
                        style={{ aspectRatio: '53.98 / 85.6' }} // 세로 비율
                    >
                        <img
                        src={activeItem.cardImage}
                        alt={activeItem.name}
                        className="w-full h-full object-cover rounded-lg -rotate-90 scale-[1.6]" // 세로로 보여주기 위해 회전
                        />
                    </div>

                    {paymentStatus === 'activating' && (
                        <div className="flex flex-col items-center space-y-2 text-muted-foreground animate-pulse">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span className="text-sm font-medium">승인 요청 중...</span>
                        </div>
                    )}
                    {paymentStatus === 'activated' && (
                        <div className="flex flex-col items-center space-y-2 text-green-600 animate-in zoom-in">
                        <CheckCircle className="w-8 h-8" />
                        <span className="text-lg font-bold">결제 완료!</span>
                        </div>
                    )}
                    </div>
                )}
                </AlertDialogContent>
            </AlertDialog>
            ) : (
             // 카드 추가 버튼
            <Button 
                className="w-full btn-gradient h-12 text-lg font-bold shadow-lg"
                onClick={() => navigate('/app/wallet/add')}
            >
                <Plus className="mr-2 w-5 h-5" />
                카드 등록하기
            </Button>
            )}
        </div>
      </div>
    </div>
  );
};

export default Wallet;