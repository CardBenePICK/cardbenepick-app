import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const phone = location.state?.phone;
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 전화번호 정보가 없으면 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!phone) {
      navigate('/login');
    }
  }, [phone, navigate]);


  const handleVerifyOtp = () => {
    setIsLoading(true);

    // OTP 인증 시뮬레이션
    setTimeout(() => {
      if (otp === '123456') { // 테스트용 인증번호
        toast({
          title: "인증 성공",
          description: "휴대폰 인증이 완료되었습니다.",
        });

        // --- 로그인 상태 저장 ---
        localStorage.setItem('userLoggedIn', 'true');
        // ---------------------

        // 신규 / 기존 유저 분기 시뮬레이션
        const isNewUser = true; // DB 조회 결과에 따라 변경

        if (isNewUser) {
          // 신규 유저 -> 이름, 약관 동의 페이지로
          navigate('/register', { state: { phone } });
        } else {
          // 기존 유저 -> 메인 대시보드로
          navigate('/app/wallet'); // 시작점을 '월렛'으로 변경
        }
      } else {
        toast({
          title: "인증 실패",
          description: "인증번호가 올바르지 않습니다.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 1000);
  };

  if (!phone) {
    return null; // 리다이렉트 중 렌더링 방지
  }

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
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">인증번호 6자리</CardTitle>
            <CardDescription>
              {phone}로 전송된 인증번호를 입력해주세요.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleVerifyOtp(); }} className="space-y-6">
              <div className="flex justify-center">
                <InputOTP 
                  maxLength={6} 
                  value={otp} 
                  onChange={(value) => setOtp(value)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <div className="space-y-2">
                <Button 
                  type="submit" 
                  className="w-full btn-gradient h-11"
                  disabled={isLoading || otp.length < 6}
                >
                  {isLoading ? "인증 중..." : "인증 완료"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  className="w-full"
                  disabled={isLoading}
                >
                  인증번호 재전송
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyOtp;