import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowLeft, User, Loader2, Cake, Users, Calendar as CalendarIcon } from 'lucide-react'; // [수정] CalendarIcon 추가
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// [추가] Popover, Calendar 및 날짜 포맷(date-fns) 임포트
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils"; // cn 유틸리티 임포트

// 성별 옵션
const genderOptions = [
  { value: "M", label: "남성" },
  { value: "F", label: "여성" },
];

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined); // [수정] Date 타입으로 변경
  const [gender, setGender] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const telecom = location.state?.telecom;

  // telecom 정보가 없으면(새로고침 등) 로그인 페이지로 리다이렉트
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

    if (!name.trim()) {
      toast({ title: "오류", description: "이름을 입력하세요.", variant: "destructive" });
      return;
    }
    // [수정] Date 객체 유효성 검사
    if (!birthDate) {
       toast({ title: "오류", description: "생년월일을 선택하세요.", variant: "destructive" });
       return;
    }
    if (!gender) {
       toast({ title: "오류", description: "성별을 선택하세요.", variant: "destructive" });
       return;
    }
    if (!agreedTerms || !agreedPrivacy) {
      toast({ title: "오류", description: "필수 약관에 모두 동의해야 합니다.", variant: "destructive" });
      return;
    }

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
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name,
          telecom: telecom,
          birth_date: format(birthDate, "yyyy-MM-dd"), // [수정] YYYY-MM-DD 형식으로 포맷
          gender: gender,
          agreed_terms: agreedTerms,
          agreed_privacy: agreedPrivacy
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorDetail = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorDetail = errorJson.detail || errorText;
        } catch (e) {
          // JSON 파싱 실패
        }
        throw new Error(errorDetail || '회원가입에 실패했습니다.');
      }

      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('userLoggedIn', 'true');
      toast({ title: "회원가입 성공", description: "CardBenePICK에 오신 것을 환영합니다!" });
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
            
            {/* [수정] 생년월일 (달력) */}
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
                    captionLayout="dropdown-buttons" // 년/월 쉽게 선택
                    fromYear={1930} // 선택 가능 범위
                    toYear={new Date().getFullYear()} // 선택 가능 범위
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