import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowLeft, User, Loader2, Cake, Users, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
// [추가] Store 임포트
import { useUserStore } from '@/store/useUserStore';

const genderOptions = [
  { value: "M", label: "남성" },
  { value: "F", label: "여성" },
];

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // [추가] Store Actions
  const { login } = useUserStore();

  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [gender, setGender] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const telecom = location.state?.telecom;

  useEffect(() => {
    if (!telecom) {
      toast({
        title: "세션 오류",
        description: "인증 정보가 유실되었습니다. 로그인부터 다시 시도해주세요.",
        variant: "destructive",
      });
      navigate('/login');
    }
  }, [telecom, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !birthDate || !gender || !agreedTerms || !agreedPrivacy) {
      toast({ title: "오류", description: "모든 정보를 입력하고 약관에 동의해주세요.", variant: "destructive" });
      return;
    }

    const tempToken = localStorage.getItem('token');
    if (!tempToken) {
      toast({ title: "인증 오류", description: "인증 세션이 만료되었습니다.", variant: "destructive" });
      navigate('/login');
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/auth/complete-registration', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`
        },
        body: JSON.stringify({
          name: name,
          telecom: telecom,
          birth_date: format(birthDate, "yyyy-MM-dd"),
          gender: gender,
          agreed_terms: agreedTerms,
          agreed_privacy: agreedPrivacy
        })
      });
      
      if (!response.ok) {
        const errorText = await response.json();
        throw new Error(errorText.detail || '회원가입에 실패했습니다.');
      }

      const data = await response.json();
      const accessToken = data.access_token;

      // [수정] 회원가입 성공 후 바로 내 정보 조회 및 로그인 처리
      const userResponse = await fetch('http://localhost:8000/api/users/me', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (userResponse.ok) {
          const userData = await userResponse.json();
          
          // Store 업데이트
          login(accessToken, userData);
          
          toast({ title: "회원가입 성공", description: "CardBenePICK에 오신 것을 환영합니다!" });
          navigate('/link-mydata');
      } else {
          throw new Error("회원 정보를 불러오는데 실패했습니다.");
      }

    } catch (error: any) {
      console.error(error);
      toast({ title: "오류", description: error.message || "서버 오류", variant: "destructive" });
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
          onClick={() => navigate('/verify-otp')}
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
              서비스 이용을 위해 추가 정보를 입력해주세요.
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
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            {/* 생년월일 (달력) */}
            <div className="relative">
              <Cake className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "pl-10 h-12 w-full justify-start text-left font-normal",
                      !birthDate && "text-muted-foreground"
                    )}
                  >
                    {birthDate ? format(birthDate, "yyyy-MM-dd") : <span>생년월일을 선택하세요</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={birthDate}
                    onSelect={setBirthDate}
                    captionLayout="dropdown-buttons"
                    fromYear={1930}
                    toYear={new Date().getFullYear()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* 성별 선택 */}
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
              <Select onValueChange={setGender} value={gender}>
                <SelectTrigger className="pl-10 h-12">
                  <SelectValue placeholder="성별을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {genderOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  checked={agreedTerms && agreedPrivacy}
                />
                <Label htmlFor="terms-all" className="font-semibold">전체 동의</Label>
              </div>
              <hr />
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="terms" 
                  checked={agreedTerms}
                  onCheckedChange={(checked) => setAgreedTerms(checked === true)}
                />
                <Label htmlFor="terms">(필수) 이용약관 동의</Label>
                <Button variant="link" size="sm" className="ml-auto p-0 h-auto" type="button">보기</Button>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="privacy" 
                  checked={agreedPrivacy}
                  onCheckedChange={(checked) => setAgreedPrivacy(checked === true)}
                />
                <Label htmlFor="privacy">(필수) 개인정보 처리방침 동의</Label>
                <Button variant="link" size="sm" className="ml-auto p-0 h-auto" type="button">보기</Button>
              </div>
            </div>
            
            <Button 
              type="submit"
              className="w-full btn-gradient h-11"
              disabled={isLoading || !agreedTerms || !agreedPrivacy || !name || !telecom || !birthDate || !gender}
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