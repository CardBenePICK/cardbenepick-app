import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Loader2, CheckCircle, Beaker, Wallet as WalletIcon } from 'lucide-react';
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
import { Input } from '@/components/ui/input'; 
import { Label } from '@/components/ui/label'; 
import { cn } from '@/lib/utils';
import { useCardStore } from '@/store/useCardStore';
import { useToast } from '@/hooks/use-toast';

// [유지] 이미지 컴포넌트
const AutoOrientedCardImage = ({ src, alt, className }: { src: string, alt: string, className?: string }) => {
  const [isPortrait, setIsLandscape] = useState(false);
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalHeight > naturalWidth) setIsLandscape(true);
  };
  return (
    <img src={src} alt={alt} onLoad={handleImageLoad}
      className={cn(className, "transition-transform duration-300", isPortrait ? "-rotate-90 scale-[1.6] object-contain" : "object-cover")}
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

  const incomingPayment = location.state?.payment; 
  const [merchant, setMerchant] = useState<string>(incomingPayment?.merchant || '');
  const [amount, setAmount] = useState<string>(incomingPayment?.amount ? String(incomingPayment.amount) : '');

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const carouselItems = [
    ...assets.map(asset => ({
      id: asset.asset_id.toString(),
      name: asset.external_account_name || asset.institution_name,
      cardImage: asset.card_image_url || 'http://localhost:8080/placeholder.svg',
      type: 'card',
      originalAsset: asset
    })),
    { id: 'add', name: '카드 추가', cardImage: '', type: 'add', originalAsset: null }
  ];

  // 테스트용 함수
  const handleSimulateChatbot = () => {
    if (assets.length === 0) return;
    const targetCardId = assets[0].asset_id.toString(); 
    navigate('/app/wallet', { 
        state: { 
            recommendedCardId: targetCardId,
            payment: { merchant: '테스트 가맹점', amount: 8500 } 
        } 
    });
  };

  useEffect(() => {
    if (!api) return;
    const recommendedCardId = location.state?.recommendedCardId;
    
    if (recommendedCardId) {
      const targetIndex = carouselItems.findIndex(item => item.id === recommendedCardId);
      if (targetIndex !== -1) {
        api.scrollTo(targetIndex); 
        setActiveIndex(targetIndex);
      }
      if (location.state?.payment) {
          setMerchant(location.state.payment.merchant);
          setAmount(String(location.state.payment.amount));
          setIsModalOpen(true); 
      }
    } else {
      setActiveIndex(api.selectedScrollSnap());
    }

    const onSelect = () => {
      setActiveIndex(api.selectedScrollSnap());
    };
    api.on("select", onSelect);
    return () => { api.off("select", onSelect); };
  }, [api, location.state, navigate, assets]);

  const handlePayment = async () => {
    const currentItem = carouselItems[activeIndex];
    if (!currentItem.originalAsset) return;

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
                amount: parseInt(amount),
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
                setPaymentStatus('idle');
                setIsModalOpen(false);
                if (!incomingPayment) {
                    setMerchant('');
                    setAmount('');
                }
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
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Header */}
      <div className="flex items-center p-4 border-b bg-white justify-between relative">
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground absolute left-4" onClick={handleSimulateChatbot}>
            <Beaker className="w-4 h-4 mr-1" /> Test
        </Button>
        <h1 className="text-lg font-semibold flex-1 text-center">내 지갑</h1>
        <div className="w-12" /> 
      </div>

      {/* --- 카드 캐러셀 --- */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 space-y-8 overflow-hidden">
        
        {isLoading ? (
            <div className="flex flex-col items-center animate-pulse">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">카드를 불러오는 중...</p>
            </div>
        ) : (
        <Carousel setApi={setApi} className="w-full max-w-xs perspective-1000" opts={{ loop: false, align: "center" }}>
          <CarouselContent>
            {carouselItems.map((card) => (
              <CarouselItem key={card.id} >
                {card.id === 'add' ? (
                  <div onClick={() => navigate('/app/wallet/add')} className="cursor-pointer">
                    <Card className="shadow-sm border-2 border-dashed border-slate-300 bg-white/50 flex items-center justify-center hover:bg-slate-100 transition-colors" style={{ aspectRatio: '85.6 / 53.98' }}>
                      <div className="flex flex-col items-center text-slate-400">
                        <Plus className="w-10 h-10 mb-2" />
                        <span className="text-sm font-medium">카드 추가</span>
                      </div>
                    </Card>
                  </div>
                ) : (
                  <div className="p-1">
                    <Card className="shadow-elevated overflow-hidden rounded-lg bg-white flex items-center justify-center" style={{ aspectRatio: '85.6 / 53.98' }}>
                       <AutoOrientedCardImage src={card.cardImage} alt={card.name} className="w-full h-full" />
                    </Card>
                  </div>
                )}
              </CarouselItem>
            ))}
          </CarouselContent>
          
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

        <div className="flex justify-center gap-2">
          {carouselItems.map((_, index) => (
            <div key={index} className={cn("w-2 h-2 rounded-full transition-all duration-300", index === activeIndex ? "w-4 bg-primary" : "bg-slate-300")} />
          ))}
        </div>

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
                        <AlertDialogTitle className="text-center">
                            {incomingPayment ? "결제 확인" : "결제 정보 입력"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-center">
                           {incomingPayment ? "아래 내용으로 결제하시겠습니까?" : "결제할 가맹점과 금액을 입력해주세요."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    
                    {/* [핵심 변경] incomingPayment 여부에 따라 UI 분기 */}
                    <div className="py-6">
                        {incomingPayment ? (
                            // 1. 외부 변수가 있을 때: 읽기 전용 텍스트 표시
                            <div className="text-center space-y-2">
                                <p className="text-xl font-bold text-slate-900">{merchant}</p>
                                <div className="text-3xl font-black text-primary tracking-tight">
                                    {parseInt(amount || '0').toLocaleString()}
                                    <span className="text-lg font-medium text-muted-foreground ml-1">원</span>
                                </div>
                            </div>
                        ) : (
                            // 2. 외부 변수가 없을 때: 입력 폼 표시 (기존)
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="merchant">가맹점</Label>
                                    <Input id="merchant" placeholder="예: 스타벅스" value={merchant} onChange={(e) => setMerchant(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="amount">금액</Label>
                                    <Input id="amount" type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
                                </div>
                            </div>
                        )}
                    </div>

                    <AlertDialogFooter className="flex-row space-x-2 sm:space-x-2">
                        <AlertDialogCancel className="flex-1 h-12 m-0">취소</AlertDialogCancel>
                        <Button onClick={handlePayment} className="flex-1 h-12 btn-gradient m-0">승인</Button>
                    </AlertDialogFooter>
                    </>
                )}
                
                {/* 3D 애니메이션 영역 (기존 유지) */}
                {(paymentStatus === 'activating' || paymentStatus === 'activated') && (
                    <div className="flex flex-col items-center justify-center min-h-[300px] space-y-6 perspective-1000">
                    <div className={cn("relative w-32 rounded-lg shadow-2xl transform-style-3d transition-all duration-700", paymentStatus === 'activating' && "animate-card-stand-up", paymentStatus === 'activated' && "scale-110 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]")} style={{ aspectRatio: '53.98 / 85.6' }}>
                        <img src={getActiveItem().cardImage} alt={getActiveItem().name} className="w-full h-full object-cover rounded-lg -rotate-90 scale-[1.6]" />
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
            <Button className="w-full btn-gradient h-12 text-lg font-bold shadow-lg" onClick={() => navigate('/app/wallet/add')}>
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