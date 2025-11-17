import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Banknote, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// 가상 금융기관 목록
const mockBanks = [
  { id: 'kb', name: '국민은행' },
  { id: 'shinhan', name: '신한은행' },
  { id: 'woori', name: '우리은행' },
  { id: 'hana', name: '하나은행' },
  { id: 'toss', name: '토스뱅크' },
  { id: 'kakao', name: '카카오뱅크' },
];

const LinkMyData = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);

  const handleBankClick = (bankId: string) => {
    setSelectedBanks((prevSelected) =>
      prevSelected.includes(bankId)
        ? prevSelected.filter((id) => id !== bankId) // 이미 있으면 제거
        : [...prevSelected, bankId] // 없으면 추가
    );
  };

  const handleLink = () => {
    if (selectedBanks.length === 0) {
      toast({
        title: "선택 필요",
        description: "연동할 금융기관을 하나 이상 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    toast({
      title: "마이데이터 연동 중...",
      description: `${selectedBanks.length}개 기관의 데이터를 연동합니다.`,
    });

    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "연동 성공",
        description: "마이데이터 연동이 완료되었습니다. '월렛' 탭에서 카드를 등록해주세요.",
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
            <CardTitle className="text-xl">데이터 연동</CardTitle>
            <CardDescription>
              소비 패턴 분석을 위해 금융기관을 연동해주세요. (다중 선택 가능)
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {mockBanks.map((bank) => (
                <Button
                  key={bank.id}
                  variant={selectedBanks.includes(bank.id) ? "default" : "outline"}
                  className="flex-col h-20"
                  onClick={() => handleBankClick(bank.id)}
                >
                  <Banknote className="w-6 h-6 mb-1" />
                  <span className="text-xs">{bank.name}</span>
                </Button>
              ))}
            </div>

            <Button 
              className="w-full btn-gradient h-11"
              disabled={isLoading || selectedBanks.length === 0}
              onClick={handleLink}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "연동 중..." : `선택한 ${selectedBanks.length}개 기관 연동하기`}
            </Button>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/app/wallet')} // 마이데이터 없이 '월렛' 탭으로 이동
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