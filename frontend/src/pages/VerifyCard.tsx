import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const VerifyCard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // 3초간 로딩 시뮬레이션
    const timer = setTimeout(() => {
      toast({
        title: "등록 완료",
        description: "카드가 월렛에 안전하게 등록되었습니다.",
      });
      navigate('/app/wallet'); // 3초 후 월렛으로 복귀
    }, 3000);

    return () => clearTimeout(timer); // 페이지 이탈 시 타이머 제거
  }, [navigate, toast]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
      <h1 className="mt-6 text-xl font-semibold">본인 확인 중...</h1>
      <p className="text-muted-foreground">카드를 안전하게 등록하고 있습니다.</p>
    </div>
  );
};

export default VerifyCard;