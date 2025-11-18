// `POST /api/auth/verify-otp`를 호출하고, 응답에 따라 분기 처리
import { useState } from 'react'; // (1) useState 추가
import { useNavigate, useLocation } from 'react-router-dom'; // (2) useLocation 추가
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast'; // (3) useToast 추가

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation(); // (4) location 훅 사용
  const { toast } = useToast();

  // (5) Login 페이지에서 넘겨받은 휴대폰 번호
  const phoneNumber = location.state?.phoneNumber; 

  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // (6) OTP 6자리가 모두 입력되었을 때 호출될 함수
  const handleOtpComplete = async (value: string) => {
    setOtp(value);
    setIsLoading(true);

    if (!phoneNumber) {
      toast({ title: "오류", description: "휴대폰 번호 정보가 없습니다. 로그인부터 다시 시도하세요.", variant: "destructive" });
      navigate('/login');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:8000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phoneNumber, otp: value })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || '인증에 실패했습니다.');
      }

      // (7) [핵심] 토큰을 localStorage에 저장
      // 이 토큰은 '임시 등록 토큰'이거나 '정식 로그인 토큰'일 수 있습니다.
      localStorage.setItem('token', data.token);

      if (data.is_new_user) {
        // (8) 신규 유저 -> 회원가입 페이지로
        toast({ title: "인증 성공", description: "회원가입을 계속 진행합니다." });
        navigate('/register');
      } else {
        // (9) 기존 유저 -> 로그인 성공
        toast({ title: "로그인 성공", description: "환영합니다!" });
        localStorage.setItem('userLoggedIn', 'true');
        navigate('/app/wallet'); // 메인 앱(월렛)으로 이동
      }

    } catch (error: any) {
      console.error(error);
      toast({ title: "인증 오류", description: error.message || "서버와 통신할 수 없습니다.", variant: "destructive" });
      setIsLoading(false);
      setOtp(''); // OTP 입력 초기화
    }
    // (성공 시에는 페이지 이동하므로 finally 불필요)
  };

  return (
    <div className="app-container">
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/login')} // (10) 뒤로가기
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
            <CardTitle className="text-xl">인증번호 6자리</CardTitle>
            <CardDescription>
              {phoneNumber ? `${phoneNumber}로` : ''} 전송된 인증번호를 입력하세요.
              <br/>
              (개발: 백엔드 콘솔 확인)
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-6">
            <InputOTP 
              maxLength={6} 
              value={otp} // (11) value, onChange, onComplete 바인딩
              onChange={setOtp}
              onComplete={handleOtpComplete}
              disabled={isLoading}
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

            {isLoading && <Loader2 className="mt-4 h-6 w-6 animate-spin text-primary" />}
            
            <Button variant="link" className="text-sm">
              인증번호 다시 받기
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyOtp;