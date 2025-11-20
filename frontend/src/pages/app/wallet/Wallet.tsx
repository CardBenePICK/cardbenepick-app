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
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input'; // [추가] 입력 필드
import { Label } from '@/components/ui/label'; // [추가] 라벨
import { cn } from '@/lib/utils';
import { useCardStore, Asset } from '@/store/useCardStore'; // Store 임포트
import { useToast } from '@/hooks/use-toast'; // Toast 임포트

// [기존 유지] 이미지 비율 감지 컴포넌트
const AutoOrientedCardImage = ({ src, alt, className }: { src: string, alt: string, className?: string }) => {
  const [isPortrait, setIsLandscape] = useState(false);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalHeight > naturalWidth) {
      setIsLandscape(true);
    }
  };

  return (
    <img
      src={src}
      alt={alt}
      onLoad={handleImageLoad}
      className={cn(
        className,
        "transition-transform duration-300",
        isPortrait 
          ? "-rotate-90 scale-[1.6] object-contain" 
          : "object-cover"
      )}
    />
  );
};

const Wallet = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const { assets, fetchAssets, isLoading } = useCardStore();
  
  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'activating' | 'activated'>('idle');

  // ------------------------------------------------------------------
  // [수정] 결제 정보 상태 관리
  // ------------------------------------------------------------------
  const incomingPayment = location.state?.payment; 

  // 초기값: 외부 값이 있으면 그 값으로, 없으면 빈 값(사용자 입력 유도)
  const [merchant, setMerchant] = useState<string>(incomingPayment?.merchant || '');
  const [amount, setAmount] = useState<string>(incomingPayment?.amount ? String(incomingPayment.amount) : '');

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // 캐러셀 아이템 구성 (기존 유지)
  const carouselItems = [
    ...assets.map(asset => ({
      id: asset.asset_id.toString(),
      name: asset.external_account_name || asset.institution_name,
      cardImage: asset.card_image_url || 'http://localhost:8080/placeholder.svg', 
      type: 'card',
      originalAsset: asset 
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

    const recommendedCardId = location.state?.recommendedCardId;
    
    if (recommendedCardId) {
      const targetIndex = carouselItems.findIndex(item => item.id === recommendedCardId);
      if (targetIndex !== -1) {
        api.scrollTo(targetIndex); 
        setActiveIndex(targetIndex);
      }
      
      // [추가] 결제 정보가 함께 들어왔다면 모달을 자동으로 열어줌
      if (incomingPayment) {
        setIsModalOpen(true);
      }
      
      // navigate(location.pathname, { replace: true, state: {} }); // 필요 시 주석 해제
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

  }, [api, location.state, navigate, location.pathname, assets]);

  const handlePayment = async () => {
    const currentItem = carouselItems[activeIndex];
    if (!currentItem.originalAsset) return;

    // [추가] 입력값 검증
    if (!amount || !merchant) {
        toast({ title: "입력 확인", description: "가맹점과 금액을 입력해주세요.", variant: "destructive" });
        return;
    }

    setPaymentStatus('activating'); 

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8000/api/transactions/pay', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                user_asset_id: currentItem.originalAsset.asset_id,
                amount: parseInt(amount), // [수정] 입력받은 금액 사용
                merchant_name: merchant   // [수정] 입력받은 가맹점 사용
            })
        });

        if (!response.ok) throw new Error('승인 거절');

        const result = await response.json();

        setTimeout(() => {
            setPaymentStatus('activated');
            
            toast({
                title: "결제 성공",
                description: `${result.merchant}에서 ${result.amount.toLocaleString()}원 결제되었습니다.`
            });

            setTimeout(() => {
                setIsModalOpen(false);
                // 모달 닫힌 후 입력값 초기화 (선택사항)
                if (!incomingPayment) {
                    setMerchant('');
                    setAmount('');
                }
            }, 1500);
        }, 1000);

    } catch (error) {
        console.error(error);
        toast({ title: "결제 실패", description: "결제를 처리할 수 없습니다.", variant: "destructive" });
        setPaymentStatus('idle'); // 에러 시 초기화
        setIsModalOpen(false);
    }
  };

  const onModalOpenChange = (open: boolean) => {
    if (!open) {
      setPaymentStatus('idle');
      // 모달 닫을 때 외부 값이 없었다면 초기화
      if (!incomingPayment) {
        setMerchant('');
        setAmount('');
      }
    }
    setIsModalOpen(open);
  }

  const getActiveItem = () => carouselItems[activeIndex] || carouselItems[0];
  const isAddCardActive = getActiveItem().id === 'add';

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
                      style={{ aspectRatio: '85.6 / 53.98' }}
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
                    className="shadow-elevated overflow-hidden rounded-lg bg-white flex items-center justify-center"
                    style={{
                      aspectRatio: '85.6 / 53.98' // 가로 카드 비율 (유지)
                    }}
                  >
                    {/* [유지] 기존 이미지 컴포넌트 사용 */}
                    <AutoOrientedCardImage 
                      src={card.cardImage} 
                      alt={card.name} 
                      className="w-full h-full"
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
                    <h3 className="text-lg font-bold text-slate-800">{getActiveItem().name}</h3>
                    <p className="text-xs text-slate-500">{getActiveItem().originalAsset?.institution_name}</p>
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
                        <AlertDialogTitle className="text-center">결제 정보 입력</AlertDialogTitle>
                        <AlertDialogDescription className="text-center">
                           결제할 가맹점과 금액을 확인해주세요.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    
                    {/* [추가] 입력 필드 영역 (모달 내부) */}
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="merchant">가맹점</Label>
                            <Input 
                                id="merchant" 
                                placeholder="예: 스타벅스" 
                                value={merchant}
                                onChange={(e) => setMerchant(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount">금액</Label>
                            <Input 
                                id="amount" 
                                type="number" 
                                placeholder="0" 
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
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
                        paymentStatus === 'activating' && "animate-card-stand-up", 
                        paymentStatus === 'activated' && "scale-110 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                        )}
                        style={{ aspectRatio: '53.98 / 85.6' }} 
                    >
                        {/* [유지] 애니메이션 카드 이미지 스타일 */}
                        <img
                        src={getActiveItem().cardImage}
                        alt={getActiveItem().name}
                        className="w-full h-full object-cover rounded-lg -rotate-90 scale-[1.6]" 
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