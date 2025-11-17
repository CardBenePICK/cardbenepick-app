import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const phone = location.state?.phone;

  const [name, setName] = useState('');
  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 전화번호 정보가 없으면 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!phone) {
      navigate('/login');
    }
  }, [phone, navigate]);


  const handleAgreeAll = (checked: boolean) => {
    setAgreeAll(checked);
    setAgreeTerms(checked);
    setAgreePrivacy(checked);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreeTerms || !agreePrivacy) {
      toast({
        title: "약관 동의 필요",
        description: "필수 약관에 동의해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!name.trim()) {
      toast({
        title: "이름 입력 필요",
        description: "이름을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // 회원가입 처리 시뮬레이션
    setTimeout(() => {
      toast({
        title: "회원가입 성공",
        description: `${name}님, 환영합니다. 마이데이터 연동을 시작합니다.`,
      });
      setIsLoading(false);
      // 마이데이터 연동 페이지로 이동
      navigate('/link-mydata');
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
          onClick={() => navigate('/verify-otp', { state: { phone } })}
          className="mr-3"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">회원가입</h1>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <Card className="shadow-card">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">정보 입력</CardTitle>
            <CardDescription>
              서비스 이용을 위해 이름과 약관 동의가 필요합니다.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="이름을 입력하세요"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="agreeAll" 
                    checked={agreeAll} 
                    onCheckedChange={(checked) => handleAgreeAll(checked as boolean)}
                  />
                  <Label htmlFor="agreeAll" className="font-semibold cursor-pointer">전체 동의</Label>
                </div>
                <div className="pl-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="agreeTerms" 
                        checked={agreeTerms} 
                        onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                      />
                      <Label htmlFor="agreeTerms" className="cursor-pointer">이용약관 동의 (필수)</Label>
                    </div>
                    <Link to="#" className="text-xs text-muted-foreground underline">보기</Link>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="agreePrivacy" 
                        checked={agreePrivacy} 
                        onCheckedChange={(checked) => setAgreePrivacy(checked as boolean)}
                      />
                      <Label htmlFor="agreePrivacy" className="cursor-pointer">개인정보 처리방침 동의 (필수)</Label>
                    </div>
                    <Link to="#" className="text-xs text-muted-foreground underline">보기</Link>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full btn-gradient h-11"
                disabled={isLoading || !agreeTerms || !agreePrivacy}
              >
                {isLoading ? "가입 중..." : "다음"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;