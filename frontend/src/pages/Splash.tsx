import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Splash = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      // 로그인 여부 확인 (간단한 localStorage 시뮬레이션)
      const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';

      if (isLoggedIn) {
        navigate('/app/wallet'); // 기존 사용자 -> 메인 월렛 화면
      } else {
        navigate('/login'); // 신규 사용자 -> 로그인/회원가입 시작
      }
    }, 2000); // 2초 후 이동

    return () => clearTimeout(timer); // 컴포넌트 언마운트 시 타이머 제거
  }, [navigate]);

  return (
    <div 
      className="flex flex-col items-center justify-center h-screen"
      style={{ backgroundColor: '#E6F0FF' }} // 요청한 배경색 #E6F0FF 적용
    >
      {/* 1. 로고 순서 변경 (imageLogo가 위로)
        2. 두 이미지 모두 214px x 214px 크기 적용 (w-[214px] h-[214px])
        3. 로고 간격을 gap-8에서 gap-12로 조정
      */}
      <div className="flex flex-col items-center gap-12 animate-pulse">
        <img 
          src="/images/imageLogo.png" 
          alt="메인 이미지" 
          className="w-[214px] h-[214px] object-contain"
        />
        <img 
          src="/images/nameLogo.png" 
          alt="서비스 이름 로고" 
          className="w-[214px] h-[214px] object-contain"
        />
      </div>
    </div>
  );
};

export default Splash;