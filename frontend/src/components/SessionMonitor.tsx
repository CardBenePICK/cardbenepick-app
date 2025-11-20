// frontend/src/components/SessionMonitor.tsx

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/useUserStore';
import { getTimeLeft } from '@/utils/auth';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

const SessionMonitor = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { token, logout } = useUserStore();
  
  // 경고 메시지 중복 방지용 Ref
  const hasWarnedRef = useRef(false);

  useEffect(() => {
    if (!token) return;

    const checkSession = () => {
      const timeLeft = getTimeLeft(token);
      
      // 1. 만료됨 (0초 이하)
      if (timeLeft <= 0) {
        logout();
        navigate('/login');
        toast({
            title: "세션 만료",
            description: "로그인 시간이 만료되어 로그아웃되었습니다.",
            variant: "destructive"
        });
        return;
      }

      // 2. 만료 임박 (1분 미만 = 60000ms)
      // 이미 경고하지 않았을 때만 알림
      if (timeLeft < 60000 && !hasWarnedRef.current) {
        hasWarnedRef.current = true;
        toast({
          title: "로그아웃 예정",
          description: "1분 뒤에 로그아웃됩니다. 계속하려면 다시 로그인해주세요.",
          variant: "destructive", // 빨간색 경고
          action: (
             <ToastAction altText="로그인 연장" onClick={() => navigate('/login')}>
                연장하기
             </ToastAction>
          ),
          duration: 10000, // 10초 동안 표시
        });
      }
    };

    // 1초마다 체크
    const intervalId = setInterval(checkSession, 1000);
    
    // 초기 실행
    checkSession();

    return () => clearInterval(intervalId);
  }, [token, logout, navigate, toast]);

  // 토큰이 바뀌면(로그인/로그아웃/갱신) 경고 상태 초기화
  useEffect(() => {
    hasWarnedRef.current = false;
  }, [token]);

  return null; // 화면에 아무것도 그리지 않음
};

export default SessionMonitor;