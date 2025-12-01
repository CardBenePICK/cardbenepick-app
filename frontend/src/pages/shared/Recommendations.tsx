import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, Users, TrendingUp, Star, Loader2, AlertCircle } from 'lucide-react';

// 카드 데이터 타입 (서버 응답에 맞춤)
interface CardAsset {
  id: number;
  name: string;
  company: string;
  image_url: string;
  benefits?: any[];
}

const Recommendations = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // SurveyComplete에서 넘겨준 클러스터 번호 (기본값 0)
  const userCluster = location.state?.cluster ?? 0;

  // 상태 관리
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<CardAsset[]>([]);
  const [error, setError] = useState('');

  // --- 클러스터별 정보 (SurveyComplete와 컨셉 통일) ---
  const getClusterInfo = (id: number) => {
    switch(id) {
      case 0: return { name: "실속 미식가", desc: "가성비와 미식을 동시에 챙기는 스마트한 타입", tags: ["#맛집", "#병원", "#가성비"] };
      case 1: return { name: "알뜰 소액족", desc: "꼭 필요한 곳에만 지출하는 절약의 고수", tags: ["#공과금", "#통신비", "#무지출"] };
      case 2: return { name: "에듀 맘/대디", desc: "자녀 교육과 미래를 위한 아낌없는 투자", tags: ["#학원", "#서점", "#온라인강의"] };
      case 3: return { name: "럭셔리 VIP", desc: "여행, 레저, 다이닝을 즐기는 여유로운 라이프", tags: ["#호텔", "#골프", "#라운지"] };
      case 4: return { name: "마이카 중산층", desc: "내 차 관리와 주유 혜택이 필수인 오너 드라이버", tags: ["#주유", "#정비", "#하이패스"] };
      default: return { name: "스마트 컨슈머", desc: "합리적인 소비를 지향하는 당신", tags: ["#생활비", "#쇼핑", "#적립"] };
    }
  };

  const clusterInfo = getClusterInfo(userCluster);

  // --- 서버에서 카드 데이터 가져오기 ---
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        // 토큰 직접 가져오기 (Import 에러 방지)
        const token = localStorage.getItem('accessToken');

        const response = await fetch('http://127.0.0.1:8000/api/assets/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // 토큰이 있으면 헤더에 추가 (401 에러 방지)
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          if (response.status === 401) throw new Error('로그인이 필요합니다.');
          throw new Error('카드 목록을 불러오지 못했습니다.');
        }

        const data = await response.json();
        // TODO: 나중에는 백엔드에서 클러스터별 추천 카드를 줘야 함. 지금은 임시로 앞에서 3개만 자름.
        setCards(data.slice(0, 3)); 

      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [userCluster]);


  // 1. 로딩 중
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 text-sm">맞춤 카드를 분석하고 있습니다...</p>
      </div>
    );
  }

  // 2. 에러 발생
  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-gray-800 font-bold mb-2">오류 발생</p>
        <p className="text-gray-500 text-sm mb-6">{error}</p>
        <Button onClick={() => navigate('/login')} variant="outline">로그인 페이지로</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 w-full max-w-[480px] mx-auto">
      
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 px-4 h-14 flex items-center border-b border-gray-100">
        <Button variant="ghost" size="icon" onClick={() => navigate('/survey')} className="mr-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-bold text-lg">추천 결과</h1>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6 overflow-y-auto pb-24">

        {/* 회원가입/관리 유도 버튼 (원래 코드 유지) */}
        <Button className="w-full btn-gradient h-11 text-white font-bold shadow-md" onClick={() => navigate('/login')}>
          가입하고 내 카드 관리하기
        </Button>

        {/* 1. 사용자 그룹 정보 카드 */}
        <Card className="shadow-sm border-gray-200 bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg text-gray-900">당신의 소비 그룹</CardTitle>
                <p className="text-xs text-gray-500">AI가 분석한 라이프스타일</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100"> 
              <h3 className="font-bold text-lg text-blue-700 mb-1">{clusterInfo.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{clusterInfo.desc}</p>
              <div className="flex flex-wrap gap-2">
                {clusterInfo.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="bg-white text-gray-500 border border-gray-200 font-normal">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. 추천 카드 리스트 */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center text-gray-900">
            <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
            AI 추천 카드
          </h2>
          
          {/* 카드 목록 반복 */}
          {cards.map((card, index) => (
            <Card 
                key={card.id} 
                className="shadow-sm border-gray-200 overflow-hidden cursor-pointer hover:border-blue-300 transition-all active:scale-[0.98]"
                onClick={() => navigate(`/app/card/${card.id}`)}
            > 
              <CardContent className="p-0 flex"> 
                {/* 카드 이미지 영역 */}
                <div className="w-24 bg-gray-50 flex items-center justify-center p-2 border-r border-gray-100">
                    {card.image_url ? (
                        <img src={card.image_url} alt={card.name} className="w-full h-auto object-contain" />
                    ) : (
                        <CreditCard className="w-8 h-8 text-gray-300" />
                    )}
                </div>

                {/* 카드 정보 영역 */}
                <div className="flex-1 p-4 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-xs text-gray-400 font-medium">{card.company}</span>
                        {index === 0 && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0 text-[10px] px-1.5 h-5">BEST</Badge>}
                    </div>
                    <h4 className="font-bold text-gray-900 text-base mb-2">{card.name}</h4>
                    
                    <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs text-gray-500">인기도 {9.8 - (index * 0.2)}</span>
                    </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 하단 버튼 */}
        <div className="pt-4">
          <Button variant="outline" className="w-full h-12" onClick={() => navigate('/survey')}>
            설문 다시하기
          </Button>
        </div>

      </div>
    </div>
  );
};

export default Recommendations;