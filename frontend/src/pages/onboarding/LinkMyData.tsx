import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// 1. Banknote 아이콘을 CreditCard 아이콘으로 변경
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react'; 
import { useToast } from '@/hooks/use-toast';

// 2. 가상 금융기관 목록을 '은행'에서 '카드사'로 변경
const mockCardCompanies = [
  { id: 'kb', name: 'KB국민카드' },
  { id: 'shinhan', name: '신한카드' },
  { id: 'samsung', name: '삼성카드' },
  { id: 'hyundai', name: '현대카드' },
  { id: 'lotte', name: '롯데카드' },
  { id: 'woori', name: '우리카드' },
  { id: 'hana', name: '하나카드' },
  { id: 'nh', name: 'NH농협카드' },
  { id: 'bc', name: 'BC카드' },
];

const LinkMyData = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  // 3. 변수 이름 변경 (selectedBanks -> selectedCompanies)
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

  const handleCompanyClick = (companyId: string) => {
    setSelectedCompanies((prevSelected) =>
      prevSelected.includes(companyId)
        ? prevSelected.filter((id) => id !== companyId) // 이미 있으면 제거
        : [...prevSelected, companyId] // 없으면 추가
    );
  };

  const handleLink = () => {
    if (selectedCompanies.length === 0) {
      toast({
        title: "선택 필요",
        description: "연동할 카드사를 하나 이상 선택해주세요.", // 4. 문구 수정
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    toast({
      title: "마이데이터 연동 중...",
      description: `${selectedCompanies.length}개 카드사의 데이터를 연동합니다.`, // 5. 문구 수정
    });

    // 백엔드 API (POST /api/mydata/link) 호출을 시뮬레이션합니다.
    // 이 API는 user_asset 테이블에 asset_type='account' 등으로 데이터를 추가합니다.
    // (여기서는 카드사의 계정 정보를 연동한다고 가정)
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "연동 성공",
        description: "마이데이터 연동이 완료되었습니다. '월렛' 탭에서 카드를 확인하거나 '마이페이지'에서 연동 기관을 관리하세요.",
      });
      // '월렛' 탭으로 이동
      navigate('/app/wallet');
    }, 2000);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/register')} // 6. 이전 단계인 회원가입으로 이동
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
              {/* 7. mockBanks -> mockCardCompanies로 변경 */}
              {mockCardCompanies.map((company) => (
                <Button
                  key={company.id}
                  variant={selectedCompanies.includes(company.id) ? "default" : "outline"}
                  className="flex-col h-20"
                  onClick={() => handleCompanyClick(company.id)}
                >
                  <CreditCard className="w-6 h-6 mb-1" /> {/* 8. 아이콘 변경 */}
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
              {/* 9. 버튼 텍스트 수정 */}
              {isLoading ? "연동 중..." : `선택한 ${selectedCompanies.length}개 카드사 연동하기`}
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