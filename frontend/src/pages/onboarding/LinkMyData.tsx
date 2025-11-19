import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react'; 
import { useToast } from '@/hooks/use-toast';

// 요청하신 순서대로 카드사 목록 및 ID 정의
// (백엔드의 COMPANY_MAPPING 키값과 일치해야 함)
const mockCardCompanies = [
  { id: 'shinhan', name: '신한카드' },
  { id: 'samsung', name: '삼성카드' },
  { id: 'bc_baro', name: 'BC 바로카드' },
  { id: 'ibk', name: 'IBK기업은행' },
  { id: 'kb', name: 'KB국민카드' },
  { id: 'mg', name: 'MG새마을금고' },
  { id: 'nh', name: 'NH농협카드' },
  { id: 'lotte', name: '롯데카드' },
  { id: 'woori', name: '우리카드' },
  { id: 'hana', name: '하나카드' },
  { id: 'hyundai', name: '현대카드' },
];

const LinkMyData = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

  const handleCompanyClick = (companyId: string) => {
    setSelectedCompanies((prevSelected) =>
      prevSelected.includes(companyId)
        ? prevSelected.filter((id) => id !== companyId)
        : [...prevSelected, companyId]
    );
  };

  const handleLink = async () => {
    if (selectedCompanies.length === 0) {
      toast({
        title: "선택 필요",
        description: "연동할 카드사를 하나 이상 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // 1. 저장된 토큰 가져오기
    const token = localStorage.getItem('token');
    
    if (!token) {
      toast({
        title: "인증 오류",
        description: "로그인 정보가 없습니다. 다시 로그인해주세요.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    try {
      // 2. 백엔드 API 호출 (POST /api/assets/link)
      const response = await fetch('http://localhost:8000/api/assets/link', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // JWT 토큰 전송
        },
        body: JSON.stringify({ companies: selectedCompanies })
      });

      // 3. 응답 처리
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: '연동에 실패했습니다.' }));
        // 404 등 백엔드에서 보낸 에러 메시지를 그대로 보여줌
        throw new Error(errorData.detail);
      }

      const result = await response.json();
      
      // 4. 성공 처리
      toast({
        title: "연동 성공",
        description: `총 ${result.count}건의 거래 내역을 불러왔습니다.`,
      });
      
      // 월렛 탭으로 이동
      navigate('/app/wallet');

    } catch (error: any) {
      console.error("Link error:", error);
      toast({
        title: "연동 실패",
        description: error.message || "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });
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
          onClick={() => navigate('/register')}
          className="mr-3"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">마이데이터 연동</h1>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <Card className="shadow-card">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">카드사 연동</CardTitle> 
            <CardDescription>
              소비 패턴 분석을 위해 카드사를 연동해주세요. (다중 선택 가능)
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {mockCardCompanies.map((company) => (
                <Button
                  key={company.id}
                  variant={selectedCompanies.includes(company.id) ? "default" : "outline"}
                  className="flex-col h-20"
                  onClick={() => handleCompanyClick(company.id)}
                >
                  <CreditCard className="w-6 h-6 mb-1" />
                  <span className="text-xs">{company.name}</span>
                </Button>
              ))}
            </div>

            <Button 
              className="w-full btn-gradient h-11"
              disabled={isLoading || selectedCompanies.length === 0}
              onClick={handleLink}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "데이터 불러오는 중..." : `선택한 ${selectedCompanies.length}개 카드사 연동하기`}
            </Button>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/app/wallet')} 
            >
              다음에 하기
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LinkMyData;