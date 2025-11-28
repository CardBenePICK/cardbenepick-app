import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

interface RewardCelebrationProps {
  savingsAmount: number;     // 할인 금액
  rewardRate: number;        // 적립률 (2.5)
  onClose?: () => void;      // 닫기 콜백
}

export default function RewardCelebration({ 
  savingsAmount, 
  rewardRate,
  onClose 
}: RewardCelebrationProps) {
  const [displayAmount, setDisplayAmount] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  
  const rewardAmount = Math.floor(savingsAmount * rewardRate / 100);

  useEffect(() => {
    // Confetti 효과
    const duration = 2000;
    const end = Date.now() + duration;
    const colors = ['#FFD700', '#6b7fffff', '#4ECDC4', '#45B7D1'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();

    // 숫자 카운트업
    const animationDuration = 1500;
    const startTime = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / animationDuration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      
      setDisplayAmount(Math.floor(rewardAmount * easeProgress));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();

    // 3초 후 자동 닫기
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [rewardAmount, onClose]);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={() => {
        setIsVisible(false);
        onClose?.();
      }}
    >
      <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl p-8 shadow-2xl animate-bounce-in">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <p className="text-white text-lg font-medium mb-2">
            {savingsAmount.toLocaleString()}원 할인받고
          </p>
          <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 mb-4">
            <div className="text-white text-5xl font-bold">
              +{displayAmount.toLocaleString()}원
            </div>
            <div className="text-white/90 text-sm mt-2">
              적립 완료!
            </div>
          </div>
          <p className="text-white/80 text-sm">
            ☕ 스타벅스 아메리카노 {Math.floor(rewardAmount / 4500)}잔 값
          </p>
        </div>
      </div>
    </div>
  );
}
