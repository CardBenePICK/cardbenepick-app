import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCardStore } from '@/store/useCardStore'; // Store 임포트

const VerifyCard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { fetchAssets } = useCardStore(); // 목록 갱신 함수

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const cardData = location.state?.cardData;

  useEffect(() => {
    if (!cardData) {
      toast({ title: "오류", description: "잘못된 접근입니다.", variant: "destructive" });
      navigate('/app/wallet/add');
    }
  }, [cardData, navigate, toast]);

  const handleRegister = async () => {
    setStatus('loading');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/assets/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        // 백엔드 CardRegisterRequest 스키마에 맞춰 전송
        body: JSON.stringify({
          card_number: cardData.card_number,
          cvc: cardData.cvc,
          expiry_date: cardData.expiry_date,
          password_2digit: cardData.password_2digit,
          card_product_id: cardData.card_product_id
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '등록에 실패했습니다.');
      }

      // 성공 처리
      await fetchAssets(); // 전역 스토어 갱신 (월렛 화면에 바로 뜨게 함)
      
      setStatus('success');
      setTimeout(() => {
        navigate('/app/wallet');
      }, 1500); // 1.5초 후 이동

    } catch (error: any) {
      console.error(error);
      setStatus('error');
      toast({ title: "등록 실패", description: error.message, variant: "destructive" });
    }
  };

  if (!cardData) return null;

  return (
    <div className="app-container flex flex-col h-screen items-center justify-center p-6 bg-background">
      
      {/* 상태별 UI 분기 */}
      {status === 'loading' ? (
        <div className="text-center space-y-4 animate-pulse">
          <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
          <h2 className="text-xl font-semibold">카드 정보를 확인하고 있습니다...</h2>
          <p className="text-muted-foreground">잠시만 기다려주세요.</p>
        </div>
      ) : status === 'success' ? (
        <div className="text-center space-y-4 animate-in zoom-in duration-300">
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold">등록 완료!</h2>
          <p className="text-muted-foreground">내 지갑에 카드가 추가되었습니다.</p>
        </div>
      ) : (
        // 기본 확인 화면 (Idle / Error)
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">이 카드를 등록할까요?</h1>
            <p className="text-muted-foreground">입력하신 정보를 확인해주세요.</p>
          </div>

          <Card className="border-2 border-primary/20 shadow-lg">
            <CardContent className="pt-6 flex flex-col items-center space-y-4">
              {/* 카드 이미지 */}
              <img 
                src={cardData.image_url} 
                alt="Card" 
                className="h-32 object-contain drop-shadow-md"
                onError={(e) => e.currentTarget.src = "/placeholder.svg"}
              />
              
              <div className="text-center w-full space-y-1">
                <p className="text-sm text-muted-foreground">{cardData.company_name}</p>
                <p className="text-lg font-bold truncate px-4">{cardData.product_name}</p>
                <p className="font-mono text-lg mt-2 tracking-wider">
                  {cardData.card_number.slice(0, 4)} **** **** {cardData.card_number.slice(12)}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button 
              className="w-full btn-gradient h-12 text-lg"
              onClick={handleRegister}
            >
              등록하기
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-12"
              onClick={() => navigate(-1)}
            >
              다시 입력하기
            </Button>
          </div>
          
          {status === 'error' && (
             <div className="flex items-center justify-center text-destructive text-sm font-medium">
                <AlertCircle className="w-4 h-4 mr-2" />
                등록 중 오류가 발생했습니다. 다시 시도해주세요.
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VerifyCard;