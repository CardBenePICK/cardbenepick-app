import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, ArrowRight, 
  CreditCard, Car, Utensils, Plane, GraduationCap, HeartPulse,
  Wallet, Bus, Coffee, Sofa, BookOpen, Smile, Briefcase, Users, Sun
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- 설문 응답 타입 ---
interface SurveyResponses {
  gender: string;       // (오타 수정 ender -> gender)
  ageGroup: string;    
  lifeStage: string;   
  monthlySpend: string;
  hasCar: string;
  diningFrequency: string;
  hasLeisure: string;
  hasEdu: string;
  hasHealth: string;
}

// --- 질문 데이터 (그대로 유지) ---
const questions = [
  // 1. 성별
  {
    id: 'gender',
    icon: <span className="text-3xl">👫</span>,
    question: "성별을 알려주세요.",
    description: "성별에 따라 선호하는 혜택이 다를 수 있어요.",
    options: [
      { label: "남성", sub: "Male", value: '1', icon: <span className="text-2xl">👨</span> },
      { label: "여성", sub: "Female", value: '2', icon: <span className="text-2xl">👩</span>},
    ]
  },
  // 2. 연령대
  {
    id: 'ageGroup',
    icon: <BookOpen className="w-8 h-8 text-green-500" />,
    question: "현재 연령대가\n어떻게 되시나요?",
    description: "나이대에 딱 맞는 카드를 찾아드릴게요.",
    options: [
      { label: "20대", sub: "대학생·취준생.사회초년생", value: '25', icon: <GraduationCap className="w-5 h-5" /> },
      { label: "30대", sub: "예비직장인·직장인", value: '35', icon: <Briefcase className="w-5 h-5" /> },
      { label: "40대", sub: "중견 직장인", value: '45', icon: <CreditCard className="w-5 h-5" /> },
      { label: "50대 이상", sub: "은퇴 준비", value: '55', icon: <Sofa className="w-5 h-5" /> },
    ]
  },
  // 3. 생애주기
  {
    id: 'lifeStage',
    icon: <Coffee className="w-8 h-8 text-brown-500" />,
    question: "현재 어떤 상황에\n해당하시나요?",
    description: "라이프스타일에 맞는 혜택을 분석해요.",
    options: [
      { label: "대학생", sub: "학업 열중", value: 'UNI', icon: <GraduationCap className="w-5 h-5" /> },
      { label: "사회초년생", sub: "직장 생활 시작", value: 'NEW_JOB', icon: <Wallet className="w-5 h-5" /> },
      { label: "신혼부부", sub: "신혼 생활 시작", value: 'NEW_WED', icon: <HeartPulse className="w-5 h-5" /> },
      { label: "영유아 자녀 부모", sub: "육아에 집중할 시기", value: 'CHILD_BABY', icon: <Smile className="w-5 h-5" /> },
      { label: "청소년 자녀 부모", sub: "자녀 교육비 지출", value: 'CHILD_TEEN', icon: <BookOpen className="w-5 h-5" /> },
      { label: "대학생 자녀 부모", sub: "학자금/생활비 지원", value: 'CHILD_UNI', icon: <Users className="w-5 h-5" /> },
      { label: "액티브 시니어", sub: "여유롭고 활기찬 생활", value: 'GOLLIFE', icon: <Sun className="w-5 h-5" /> },
      { label: "은퇴 준비기", sub: "제2의 인생 준비", value: 'SECLIFE', icon: <Coffee className="w-5 h-5" /> },
      { label: "은퇴", sub: "편안한 노후", value: 'RETIRE', icon: <Sofa className="w-5 h-5" /> },
    ]
  },
  // 4. 소비 금액
  {
    id: 'monthlySpend',
    icon: <Wallet className="w-8 h-8 text-blue-500" />,
    question: "한 달 카드 사용 금액이\n대략 어느 정도인가요?",
    description: "소비 규모에 딱 맞는 혜택 등급을 찾아드릴게요.",
    options: [
      { label: "120만원 미만", sub: "알뜰형", value: '1_Low', icon: <CreditCard className="w-5 h-5" /> },
      { label: "120만 ~ 150만원", sub: "실속형", value: '2_Mid', icon: <Wallet className="w-5 h-5" /> },
      { label: "150만원 이상", sub: "여유형", value: '3_High', icon: <CreditCard className="w-5 h-5" /> },
    ]
  },
  // 5. 차량
  {
    id: 'hasCar',
    icon: <Car className="w-8 h-8 text-indigo-500" />,
    question: "본인 소유의 차량을\n직접 운전하시나요?",
    description: "주유 할인이나 정비 혜택이 필요한지 확인해요.",
    options: [
      { label: "네, 운전해요", sub: "월 주유 5만원 이상", value: 'Yes', icon: <Car className="w-5 h-5" /> },
      { label: "아니요", sub: "대중교통 이용", value: 'No', icon: <Bus className="w-5 h-5" /> },
    ]
  },
  // 6. 외식
  {
    id: 'diningFrequency',
    icon: <Utensils className="w-8 h-8 text-orange-500" />,
    question: "평소 외식이나 카페를\n얼마나 자주 가시나요?",
    description: "맛집 탐방러를 위한 미식 혜택을 추천해 드려요.",
    options: [
      { label: "거의 안 가요", sub: "월 30만원 미만", value: '1_Low', icon: <Sofa className="w-5 h-5" /> },
      { label: "가끔 가요", sub: "월 30만 ~ 50만원", value: '2_Mid', icon: <Coffee className="w-5 h-5" /> },
      { label: "자주 가요", sub: "월 50만원 이상", value: '3_High', icon: <Utensils className="w-5 h-5" /> },
    ]
  },
  // 7. 레저
  {
    id: 'hasLeisure',
    icon: <Plane className="w-8 h-8 text-sky-500" />,
    question: "여행이나 레저 활동을\n즐기시는 편인가요?",
    description: "항공권, 숙박, 놀이공원 할인을 챙겨드릴까요?",
    options: [
      { label: "네, 좋아해요!", sub: "월 5만원 이상 소비", value: 'Yes', icon: <Plane className="w-5 h-5" /> },
      { label: "집이 최고예요", sub: "홈캉스 선호", value: 'No', icon: <Sofa className="w-5 h-5" /> },
    ]
  },
  // 8. 교육
  {
    id: 'hasEdu',
    icon: <GraduationCap className="w-8 h-8 text-emerald-500" />,
    question: "본인 또는 자녀를 위한\n교육비 지출이 있나요?",
    description: "학원비, 학습지, 인터넷 강의 할인을 확인해요.",
    options: [
      { label: "네, 꽤 커요", sub: "월 10만원 이상", value: 'Yes', icon: <BookOpen className="w-5 h-5" /> },
      { label: "거의 없어요", sub: "해당 없음", value: 'No', icon: <Smile className="w-5 h-5" /> },
    ]
  },
  // 9. 건강
  {
    id: 'hasHealth',
    icon: <HeartPulse className="w-8 h-8 text-rose-500" />,
    question: "병원이나 약국을\n정기적으로 방문하시나요?",
    description: "약국, 병원비 할인 혜택이 필요한지 알려주세요.",
    options: [
      { label: "네, 챙기는 편이에요", sub: "월 3만원 이상", value: 'Yes', icon: <HeartPulse className="w-5 h-5" /> },
      { label: "아니요, 건강해요", sub: "방문 적음", value: 'No', icon: <Smile className="w-5 h-5" /> },
    ]
  }
];

const Survey = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Partial<SurveyResponses>>({});
  const [isAnimating, setIsAnimating] = useState(false);

  const totalSteps = questions.length;
  const currentQuestion = questions[currentStep];

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [currentStep]);

  const handleOptionSelect = (value: string) => {
    setResponses((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/survey-complete', { state: { surveyResult: responses } });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentAnswer = responses[currentQuestion.id as keyof SurveyResponses];
  const progressPercent = ((currentStep + 1) / totalSteps) * 100;

  return (
    // [수정] 전체 높이 h-screen 설정, 배경 흰색, 하단 고정을 위한 flex-col
    <div className="flex flex-col h-screen bg-white font-sans text-gray-900 max-w-[448px] mx-auto shadow-2xl"> 
      
      {/* --- 상단 헤더 & 진행바 (고정) --- */}
      <div className="flex-none bg-white z-20">
        <div className="flex items-center justify-between px-4 h-14">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => currentStep === 0 ? navigate('/login') : handlePrevious()}
            className="text-gray-500 hover:text-gray-900 -ml-2"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="flex-1 text-center font-medium text-lg pr-8">
            <span className="text-blue-600 font-bold">{currentStep + 1}</span>
            <span className="text-gray-300"> / {totalSteps}</span>
          </div>
          <div className="w-6" /> 
        </div>
        
        {/* 진행바 (파란색) */}
        <div className="w-full h-1 bg-gray-100">
          <div 
            className="h-full bg-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* --- 메인 컨텐츠 (스크롤 가능 영역) --- */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div 
          className={cn(
            "w-full transition-all duration-300 ease-out transform pb-10",
            isAnimating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
          )}
        >
          {/* 아이콘 & 질문 */}
          <div className="flex flex-col items-center text-center mb-10">
            {/* [수정] 아이콘 박스를 연회색으로 변경 */}
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
              {currentQuestion.icon}
            </div>
            <h1 className="text-2xl font-bold leading-snug whitespace-pre-line mb-3 text-gray-900">
              {currentQuestion.question}
            </h1>
            <p className="text-gray-500 text-sm">
              {currentQuestion.description}
            </p>
          </div>

          {/* 선택지 리스트 */}
          <div className="space-y-4">
            {currentQuestion.options.map((option) => {
              const isSelected = currentAnswer === option.value;
              return (
                <div
                  key={option.value}
                  onClick={() => handleOptionSelect(option.value)}
                  // [수정] 기본 회색박스(border-transparent) -> 선택 시 파란색 박스/테두리
                  className={cn(
                    "relative flex items-center justify-between p-5 rounded-2xl cursor-pointer transition-all duration-200 border-2",
                    isSelected 
                      ? "bg-blue-50 border-blue-500 shadow-sm" 
                      : "bg-gray-50 border-transparent hover:bg-gray-100"
                  )}
                >
                  <div className="flex items-center gap-4">
                    {/* 아이콘 원형 배경 (흰색) */}
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-sm">
                      {option.icon}
                    </div>

                    <div className="flex flex-col text-left">
                      <span className={cn("font-bold text-lg", isSelected ? "text-blue-700" : "text-gray-900")}>
                        {option.label}
                      </span>
                      <span className="text-sm text-gray-400">
                        {option.sub}
                      </span>
                    </div>
                  </div>

                  {/* [수정] 체크 아이콘 대신 라디오 버튼 스타일 적용 */}
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                    isSelected 
                      ? "bg-blue-500 border-blue-500" 
                      : "border-gray-300 bg-white"
                  )}>
                    {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- 하단 버튼 (화면 하단 고정) --- */}
      <div className="flex-none p-4 border-t bg-white safe-area-bottom">
        <Button 
          onClick={handleNext}
          disabled={!currentAnswer}
          className={cn(
            "w-full h-14 text-lg font-bold rounded-xl transition-all duration-300",
            !currentAnswer 
              ? "bg-gray-200 text-gray-400 hover:bg-gray-200 shadow-none"
              : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
          )}
        >
          {currentStep === totalSteps - 1 ? '결과 확인하기' : '다음으로'}
          {currentStep < totalSteps - 1 && <ArrowRight className="w-5 h-5 ml-2 opacity-80" />}
        </Button>
      </div>
    </div>
  );
};

export default Survey;