// `'다음'` 버튼 클릭 시 `POST /api/auth/send-otp`를 호출
import { useState } from 'react'; // (1) useState 추가
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Phone, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast'; // (2) useToast 추가

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast(); // (3) toast 훅 사용

  // (4) 상태 변수 추가
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // (5) API 호출 함수
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // (간단한 유효성 검사)
    if (phoneNumber.length < 10) {
      toast({ title: "오류", description: "올바른 휴대폰 번호를 입력하세요.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phoneNumber })
      });

      if (!response.ok) {
        throw new Error('OTP 발송에 실패했습니다.');
      }

      // (개발용) 백엔드 콘솔에 찍힌 OTP 확인하라고 안내
      toast({
        title: "인증번호 발송됨",
        description: "백엔드 콘솔(터미널)에서 인증번호(OTP)를 확인하세요.",
      });

      // (6) 성공 시, VerifyOtp 페이지로 휴대폰 번호와 함께 이동
      navigate('/verify-otp', { state: { phoneNumber: phoneNumber } });

    } catch (error) {
      console.error(error);
      toast({ title: "오류", description: "서버와 통신할 수 없습니다.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryout = () => {
    navigate('/survey'); // 설문조사 페이지로 이동
  };

  return (
    <div className="app-container">
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/')}
          className="mr-3"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">로그인</h1>
      </div>

      {/* Content */}
      <form onSubmit={handleSubmit} className="flex-1 p-6">
        <Card className="shadow-card">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">휴대폰 번호 인증</CardTitle>
            <CardDescription>
              본인 확인을 위해 휴대폰 번호를 입력하세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                type="tel" 
                placeholder="010-1234-5678" 
                className="pl-10 h-12"
                value={phoneNumber} // (7) value 바인딩
                onChange={(e) => setPhoneNumber(e.target.value)} // (8) onChange 바인딩
              />
            </div>
            
            <Button 
              type="submit" // (9) type="submit"
              className="w-full btn-gradient h-11"
              disabled={isLoading} // (10) 로딩 상태
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : '인증번호 발송'}
            </Button>

            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                또는
              </span>
            </div>

            <Button 
              type="button" 
              variant="outline"
              className="w-full h-11"
              onClick={handleTryout}
            >
              회원가입 없이 체험하기
            </Button>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                이미 계정이 있으신가요?
              </p>
              <p className="text-xs text-muted-foreground">
                휴대폰 번호로 로그인 및 회원가입이 진행됩니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default Login;