import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { useCardStore } from '@/store/useCardStore';
import { useToast } from '@/hooks/use-toast';

// [신규] 이미지 비율을 감지하여 자동으로 회전시키는 컴포넌트
const AutoOrientedCardImage = ({ src, alt, className }: { src: string, alt: string, className?: string }) => {
  const [isPortrait, setIsLandscape] = useState(false);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    // 가로가 세로보다 길면 '가로형 카드'로 판단 -> 회전 필요
    if (naturalHeight >naturalWidth) {
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
          ? "-rotate-90 scale-[1.6] object-contain" // 비율 유지하며 회전 + 확대
          : "object-cover"
      )}
    />
  );
};

// [신규] 결제 애니메이션용: 가로형 이미지를 세로로 세움 (기존과 반대 로직)
const VerticalCardImage = ({ src, alt, className }: { src: string, alt: string, className?: string }) => {
  const [isPortrait, setIsLandscape] = useState(false);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    // 가로가 더 길면(Landscape) -> 세로 프레임에 맞게 세움
    if (naturalWidth > naturalHeight) {
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
          ? "-rotate-90 scale-[1.6] object-contain" // 비율 유지하며 회전 + 확대
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

  const [amount, setAmount] = useState(5000);
  const [merchant, setMerchant] = useState('스타벅스');

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // 캐러셀 아이템 구성
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

  }, [api, location.state, navigate, location.pathname, assets]);

  const handlePayment = async () => {
    const currentItem = carouselItems[activeIndex];
    if (!currentItem.originalAsset) return;

    setPaymentStatus('activating'); 

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8080/api/transactions/pay', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                user_asset_id: currentItem.originalAsset.asset_id,
                amount: amount,
                merchant_name: merchant
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
            }, 1500);
        }, 1000);

    } catch (error) {
        console.error(error);
        toast({ title: "결제 실패", description: "결제를 처리할 수 없습니다.", variant: "destructive" });
        setPaymentStatus('idle');
        setIsModalOpen(false);
    }
  };

  const onModalOpenChange = (open: boolean) => {
    if (!open) {
      setPaymentStatus('idle');
    }
    setIsModalOpen(open);
  }

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
          className="w-full max-w-xs perspective-1000" 
          opts={{
            loop: false,
            align: "center",
          }}
        >
          <CarouselContent>
            {carouselItems.map((card) => (
              <CarouselItem key={card.id} className="basis-full">
                {card.id === 'add' ? (
                  // '카드 추가' 슬롯 (세로 비율로 변경)
                  <div onClick={() => navigate('/app/wallet/add')} className="cursor-pointer">
                    <Card 
                      className="shadow-sm border-2 border-dashed border-slate-300 bg-white/50 flex items-center justify-center hover:bg-slate-100 transition-colors"
                      style={{ aspectRatio: '85.6 / 53.98' }} // [변경] 가로 비율 적용
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
                        className="border-0 shadow-xl rounded-xl bg-transparent overflow-hidden flex items-center justify-center relative transform transition-transform duration-300"
                        style={{ aspectRatio: '85.6 / 53.98' }} // [변경] 세로 비율 적용 (Portrait)
                    >
                        {/* [변경] 자동 회전 이미지 컴포넌트 적용 */}
                        <AutoOrientedCardImage 
                            src={card.cardImage} 
                            alt={card.name}
                            className="w-full h-full object-contain"
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
                      {/* [수정] h-24 제거하고, style에 aspect-ratio 적용 */}
                      <div 
                        className="w-20 rounded-lg overflow-hidden shadow-sm relative" // w-16은 너무 작아서 w-20으로 살짝 키움
                        style={{ aspectRatio: '53.98 / 85.6' }} // 실제 카드 세로 비율 고정
                      >
                        <VerticalCardImage 
                          src={activeItem.cardImage} 
                          alt="card"
                          className="w-full h-full"
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
                        "relative w-32 rounded-lg shadow-2xl transform-style-3d transition-all duration-700 overflow-hidden",
                        paymentStatus === 'activating' && "animate-card-stand-up", 
                        paymentStatus === 'activated' && "scale-110 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                        )}
                        // [중요] 컨테이너를 세로 비율(Portrait)로 설정
                        style={{ aspectRatio: '53.98 / 85.6' }} 
                    >
                        {/* [변경] 애니메이션에서는 VerticalCardImage 사용 (가로 카드를 세워서 보여줌) */}
                        <VerticalCardImage 
                            src={activeItem.cardImage} 
                            alt={activeItem.name}
                            className="w-full h-full"
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