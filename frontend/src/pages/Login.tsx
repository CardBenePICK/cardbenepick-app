import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^(010[0-9]{8})$/.test(phone)) {
      toast({
        title: "입력 오류",
        description: "올바른 휴대폰 번호(01012345678)를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // 인증번호 발송 시뮬레이션
    setTimeout(() => {
      toast({
        title: "인증번호 발송",
        description: `${phone}으로 인증번호가 발송되었습니다. (테스트: 123456)`,
      });
      setIsLoading(false);
      // 인증번호 입력 페이지로 전화번호와 함께 이동
      navigate('/verify-otp', { state: { phone } });
    }, 1000);
  };

  // --- [수정됨] ---
  const handleTryout = () => {
    navigate('/survey'); // 설문조사 페이지로 이동
  };
  // --- [수정 완료] ---

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
        <h1 className="text-lg font-semibold">시작하기</h1>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <Card className="shadow-card">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">휴대폰 번호 인증</CardTitle>
            <CardDescription>
              서비스 이용을 위해 본인인증을 진행합니다.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">휴대폰 번호</Label>
                <div className="relative">
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="'-' 없이 01012345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    maxLength={11}
                  />
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full btn-gradient h-11"
                disabled={isLoading}
              >
                {isLoading ? "발송 중..." : "인증번호 발송"}
              </Button>

              {/* --- [수정됨] --- */}
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
              {/* --- [수정 완료] --- */}

            </form>

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
      </div>
    </div>
  );
};

export default Login;