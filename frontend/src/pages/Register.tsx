// `POST /api/auth/complete-registration`를 호출하여 `user_master`에 사용자를 저장
import { useState } from 'react'; // (1) useState 추가
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowLeft, User, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast'; // (2) useToast 추가

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast(); // (3) toast 훅 사용

  // (4) 상태 변수 추가
  const [name, setName] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // (5) API 호출 함수
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({ title: "오류", description: "이름을 입력하세요.", variant: "destructive" });
      return;
    }
    if (!agreedTerms || !agreedPrivacy) {
      toast({ title: "오류", description: "필수 약관에 모두 동의해야 합니다.", variant: "destructive" });
      return;
    }

    // (6) VerifyOtp에서 저장한 임시 토큰 가져오기
    const token = localStorage.getItem('token');
    if (!token) {
      toast({ title: "인증 오류", description: "인증 세션이 만료되었습니다. 로그인부터 다시 시도하세요.", variant: "destructive" });
      navigate('/login');
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/auth/complete-registration', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // (7) [핵심] 임시 토큰을 헤더에 전송
        },
        body: JSON.stringify({
          name: name,
          agreed_terms: agreedTerms,
          agreed_privacy: agreedPrivacy
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || '회원가입에 실패했습니다.');
      }

      // (8) [핵심] 회원가입 성공 시, *새로운* 정식 로그인 토큰을 받아 덮어쓰기
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('userLoggedIn', 'true'); // (9) 로그인 상태로 변경

      toast({ title: "회원가입 성공", description: "CardBenePICK에 오신 것을 환영합니다!" });

      // (10) 다음 단계인 마이데이터 연동 페이지로 이동
      navigate('/link-mydata');

    } catch (error: any) {
      console.error(error);
      toast({ title: "오류", description: error.message || "서버와 통신할 수 없습니다.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/verify-otp')} // (11) 뒤로가기
          className="mr-3"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">회원가입</h1>
      </div>

      {/* Content */}
      <form onSubmit={handleSubmit} className="flex-1 p-6">
        <Card className="shadow-card">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">정보 입력</CardTitle>
            <CardDescription>
              서비스 이용을 위해 이름과 약관 동의가 필요합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 이름 입력 */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                type="text" 
                placeholder="이름 (예: 홍길동)" 
                className="pl-10 h-12" 
                value={name} // (12) value/onChange 바인딩
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            {/* 약관 동의 */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="terms-all" 
                  onCheckedChange={(checked) => {
                    const isChecked = checked === true;
                    setAgreedTerms(isChecked);
                    setAgreedPrivacy(isChecked);
                  }}
                  checked={agreedTerms && agreedPrivacy} // (13) 전체 동의
                />
                <Label htmlFor="terms-all" className="font-semibold">전체 동의</Label>
              </div>
              <hr />
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="terms" 
                  checked={agreedTerms} // (14) 개별 바인딩
                  onCheckedChange={(checked) => setAgreedTerms(checked === true)}
                />
                <Label htmlFor="terms">(필수) 이용약관 동의</Label>
                <Button variant="link" size="sm" className="ml-auto p-0 h-auto" type="button">보기</Button>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="privacy" 
                  checked={agreedPrivacy} // (15) 개별 바인딩
                  onCheckedChange={(checked) => setAgreedPrivacy(checked === true)}
                />
                <Label htmlFor="privacy">(필수) 개인정보 처리방침 동의</Label>
                <Button variant="link" size="sm" className="ml-auto p-0 h-auto" type="button">보기</Button>
              </div>
            </div>
            
            <Button 
              type="submit" // (16) type="submit"
              className="w-full btn-gradient h-11"
              disabled={isLoading || !agreedTerms || !agreedPrivacy} // (17) 로딩 및 동의 여부
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : '가입 완료'}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default Register;