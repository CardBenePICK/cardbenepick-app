import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from '@/hooks/use-toast';

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Login 페이지에서 전달받은 state
  const phoneNumber = location.state?.phoneNumber;
  const telecom = location.state?.telecom; // [추가] telecom 수신

  // phoneNumber가 없으면 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!phoneNumber) {
      toast({
        title: "잘못된 접근",
        description: "휴대폰 번호 입력부터 다시 시도해주세요.",
        variant: "destructive",
      });
      navigate('/login');
    }
  }, [phoneNumber, navigate, toast]);

  const handleOtpComplete = async (completedOtp: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phoneNumber, otp: completedOtp })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'OTP 검증에 실패했습니다.' }));
        throw new Error(errorData.detail || 'OTP가 올바르지 않습니다.');
      }

      const data = await response.json();
      
      localStorage.setItem('token', data.token); // 임시 토큰 또는 정식 토큰 저장
      toast({ title: "인증 성공", description: data.is_new_user ? "회원가입을 계속 진행합니다." : "로그인되었습니다." });

      if (data.is_new_user) {
        // [수정] 신규 유저일 경우, telecom 정보를 Register 페이지로 전달
        navigate('/register', { state: { telecom: telecom } });
      } else {
        localStorage.setItem('userLoggedIn', 'true');
        navigate('/app/wallet'); // 기존 유저는 메인 페이지로
      }

    } catch (error: any) {
      console.error(error);
      toast({ title: "인증 실패", description: error.message || "서버 오류", variant: "destructive" });
      setIsLoading(false);
      setOtp(''); // OTP 초기화
    }
    // 'isLoading'은 성공 시 페이지 이동으로 자동 해제되므로 finally 불필요
  };

  return (
    <div className="app-container">
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/login')}
          className="mr-3"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">인증번호 입력</h1>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <Card className="shadow-card">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">인증번호 입력</CardTitle>
            <CardDescription>
              {phoneNumber}로 전송된 6자리<br />
              인증번호를 입력해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <InputOTP 
              maxLength={6} 
              value={otp}
              onChange={(value) => setOtp(value)}
              onComplete={handleOtpComplete}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>

            {isLoading && (
              <div className="flex items-center mt-4 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                인증 중입니다...
              </div>
            )}

            <Button variant="link" size="sm" className="mt-6 text-sm">
              인증번호를 받지 못했나요?
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyOtp;