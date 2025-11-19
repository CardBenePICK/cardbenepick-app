import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"; 
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const RegisterCards = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [password, setPassword] = useState('');

  // 입력값 서식 자동 적용 (카드 번호)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // 숫자만
    let formattedValue = '';
    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) formattedValue += ' ';
      formattedValue += value[i];
    }
    setCardNumber(formattedValue.substring(0, 19)); // 0000 0000 0000 0000
  };

  // 입력값 서식 자동 적용 (유효기간)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // 숫자만
    let formattedValue = value;
    if (value.length > 2) {
      formattedValue = value.substring(0, 2) + '/' + value.substring(2);
    }
    setExpiry(formattedValue.substring(0, 5)); // MM/YY
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 간단한 유효성 검사
    if (cardNumber.length < 19 || expiry.length < 5 || cvc.length < 3 || password.length < 2) {
      toast({
        title: "입력 오류",
        description: "모든 정보를 올바르게 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    // 본인 확인 페이지로 이동
    navigate('/app/wallet/verify');
  };

  return (
    <div className="app-container">
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/app/wallet')}
          className="mr-3"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">카드 등록</h1>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <Card className="shadow-card">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">카드 정보 입력</CardTitle>
            <CardDescription>
              등록할 카드 정보를 입력해주세요.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 카드 번호 */}
              <div className="space-y-2">
                <Label htmlFor="cardNumber">카드 번호</Label>
                <Input
                  id="cardNumber"
                  type="tel"
                  placeholder="0000 0000 0000 0000"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  maxLength={19}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* 유효기간 */}
                <div className="space-y-2">
                  <Label htmlFor="expiry">유효기간</Label>
                  <Input
                    id="expiry"
                    type="tel"
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={handleExpiryChange}
                    maxLength={5}
                  />
                </div>
                {/* CVC */}
                <div className="space-y-2">
                  <Label htmlFor="cvc">CVC</Label>
                  <Input
                    id="cvc"
                    type="password"
                    placeholder="●●●"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
                    maxLength={3}
                  />
                </div>
              </div>

              {/* [수정됨] 카드 비밀번호 (앞 2자리) */}
              <div className="space-y-2">
                <Label htmlFor="password">카드 비밀번호 (앞 2자리)</Label>
                <div className="flex justify-center">
                  <InputOTP 
                    maxLength={2} 
                    value={password} 
                    onChange={(value) => setPassword(value)}
                    // password={true} 속성 제거 (컴포넌트가 알아서 마스킹)
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full btn-gradient h-11"
              >
                다음
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterCards;