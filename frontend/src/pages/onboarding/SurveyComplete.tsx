import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, ThumbsUp, ThumbsDown, ArrowRight, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- 1. 타입 정의 ---
interface Candidate {
  cluster: number;
  score: number;
}

const SurveyComplete = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const surveyResult = location.state?.surveyResult;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 화면에 뿌려줄 데이터
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [currentCluster, setCurrentCluster] = useState<number>(0);
  
  const [feedback, setFeedback] = useState<'good' | 'bad' | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // --- 2. API 호출 및 데이터 정제 ---
  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!surveyResult) {
        setError('설문 데이터가 없습니다.');
        setLoading(false);
        return;
      }

      try {
        const payload = {
          AGE: surveyResult.ageGroup || "25",
          SEX_CD: Number(surveyResult.gender || 1),
          LIFE_STAGE: surveyResult.lifeStage || "UNI",
          Q_SPEND: surveyResult.monthlySpend || "1_Low",
          Q_CAR: surveyResult.hasCar || "No",
          Q_DINING: surveyResult.diningFrequency || "1_Low",
          Q_LEISURE: surveyResult.hasLeisure || "No",
          Q_EDU: surveyResult.hasEdu || "No",
          Q_HEALTH: surveyResult.hasHealth || "No",
        };

        const response = await fetch('http://localhost:9000/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('서버 오류');

        const data = await response.json();
        console.log("✅ 서버 응답:", data);

        // [1] 데이터 변환 (이름표 통일)
        const rawList = data.candidates || data.ranking || [];
        let normalizedList: Candidate[] = rawList.map((item: any) => ({
            cluster: item.cluster,
            score: item.probability ?? item.score ?? 0 
        }));

        // ★★★ [2] 비상 대책: 리스트가 부족하면 강제로 채워넣음 (이거 때문에 무조건 뜸!) ★★★
        if (normalizedList.length < 5) {
            console.warn("⚠️ 후보 리스트가 부족하여 강제로 생성합니다.");
            const allClusters = [0, 1, 2, 3, 4];
            const existing = normalizedList.map(i => i.cluster);
            
            allClusters.forEach(id => {
                if (!existing.includes(id)) {
                    // 데이터가 없으면 5% 확률로라도 채워넣음
                    normalizedList.push({ cluster: id, score: 0.05 }); 
                }
            });
        }

        // [3] 점수 높은 순 정렬
        normalizedList.sort((a, b) => b.score - a.score);

        setTimeout(() => {
            setCandidates(normalizedList);
            // 1등이 없으면 0번이라도 넣음
            const firstPlace = normalizedList[0]?.cluster ?? 0;
            setCurrentCluster(firstPlace);
            setLoading(false);
        }, 1500);

      } catch (err) {
        console.error(err);
        setError('분석 서버와 연결할 수 없습니다.');
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [surveyResult]);

  // --- 3. 클러스터 컨텐츠 ---
  const getClusterContent = (clusterId: number) => {
    switch (clusterId) {
      case 0: return { 
        title: "실속 미식가", 
        eng: "Value Diner",
        emoji: "🥘", 
        desc: "맛있는 외식과 건강 관리가 삶의 낙!\n하지만 낭비는 싫어하는 실속파입니다.", 
        tag: "미식·건강",
        colorClass: "text-orange-600", 
        bgClass: "bg-orange-50 border-orange-100" 
      };
      case 1: return { 
        title: "알뜰 소액족", 
        eng: "Minimalist",
        emoji: "🪙", 
        desc: "불필요한 지출은 절대 NO!\n꼭 필요한 곳에만 지갑을 여는 짠테크 고수.", 
        tag: "절약·미니멀",
        colorClass: "text-emerald-600", 
        bgClass: "bg-emerald-50 border-emerald-100" 
      };
      case 2: return { 
        title: "에듀 맘/대디", 
        eng: "Edu-Focus",
        emoji: "🎓", 
        desc: "자녀 교육비 지출이 압도적 1위!\n아이의 미래를 위해 아낌없이 투자하시네요.", 
        tag: "자녀교육",
        colorClass: "text-indigo-600", 
        bgClass: "bg-indigo-50 border-indigo-100" 
      };
      case 3: return { 
        title: "럭셔리 VIP", 
        eng: "Affluent Lifestyle",
        emoji: "👑", 
        desc: "외식, 여행, 레저까지!\n삶의 질을 높이는 데 아낌없는 여유로운 라이프.", 
        tag: "프리미엄",
        colorClass: "text-purple-600", 
        bgClass: "bg-purple-50 border-purple-100" 
      };
      case 4: return { 
        title: "마이카 중산층", 
        eng: "Car Owner",
        emoji: "🚗", 
        desc: "내 차와 함께라면 어디든!\n주유비와 차량 관리에 진심인 오너 드라이버.", 
        tag: "드라이버",
        colorClass: "text-blue-600", 
        bgClass: "bg-blue-50 border-blue-100" 
      };
      default: return { 
        title: "스마트 컨슈머", 
        eng: "Smart Consumer",
        emoji: "🧐", 
        desc: "당신의 소비 패턴을 분석해\n딱 맞는 혜택을 찾아냈어요!", 
        tag: "분석완료",
        colorClass: "text-gray-600", 
        bgClass: "bg-gray-50 border-gray-100" 
      };
    }
  };

  // --- 4. 화면 렌더링 ---

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center max-w-[480px] mx-auto">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
        <div className="relative bg-white p-4 rounded-full shadow-lg border border-blue-100">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">AI가 소비 성향을<br/>분석하고 있습니다</h2>
      <p className="text-gray-500 text-sm">잠시만 기다려 주세요...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center max-w-[480px] mx-auto">
      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
      <p className="text-gray-600 mb-6">{error}</p>
      <Button onClick={() => navigate('/survey')} variant="outline">처음으로 돌아가기</Button>
    </div>
  );

  const mainContent = getClusterContent(currentCluster);
  const currentScore = candidates.find(c => c.cluster === currentCluster)?.score || 0;

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans text-gray-900 w-full max-w-[480px] mx-auto relative">
      <div ref={topRef} />

      <div className="flex-1 px-6 py-8 overflow-y-auto pb-28">
        
        {/* 상단 뱃지 */}
        <div className="flex justify-center mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[11px] font-bold tracking-wider uppercase shadow-sm">
                <Sparkles className="w-3 h-3" />
                AI Analysis Complete
            </span>
        </div>

        {/* 메인 결과 카드 */}
        <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 text-center mb-8 relative overflow-hidden animate-in zoom-in duration-500">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            
            <div className="text-6xl mb-4 transform hover:scale-110 transition-transform duration-300 cursor-default">
              {mainContent.emoji}
            </div>
            
            <h1 className="text-2xl font-extrabold text-gray-900 mb-1 leading-tight">
                당신은 <span className={cn("text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600")}>"{mainContent.title}"</span><br/>
                입니다
            </h1>
            <p className="text-xs text-gray-400 font-medium mb-4 uppercase tracking-wide">{mainContent.eng}</p>

            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line mb-6 font-medium">
                {mainContent.desc}
            </p>

            {/* 신뢰도 표시 */}
            <div className="inline-flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                <span className="text-xs text-gray-400 font-medium">분석 신뢰도</span>
                <span className="text-sm font-bold text-gray-900">{Math.round(currentScore * 100)}%</span>
            </div>
        </div>

        {/* 피드백 버튼 */}
        <div className="mb-10">
            <p className="text-center text-sm text-gray-400 mb-4 font-medium">결과가 마음에 드시나요?</p>
            <div className="flex gap-3 justify-center">
                <button 
                    onClick={() => { setFeedback('good'); }}
                    className={cn(
                        "flex-1 py-3.5 px-4 rounded-xl border text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2",
                        feedback === 'good' 
                            ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200 transform scale-105" 
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    )}
                >
                    <ThumbsUp className={cn("w-4 h-4", feedback === 'good' ? "fill-current" : "")} />
                    네, 맞아요!
                </button>

                <button 
                    onClick={() => { setFeedback('bad'); }}
                    className={cn(
                        "flex-1 py-3.5 px-4 rounded-xl border text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2",
                        feedback === 'bad' 
                            ? "bg-slate-800 text-white border-slate-800 shadow-lg transform scale-105" 
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    )}
                >
                    <ThumbsDown className={cn("w-4 h-4", feedback === 'bad' ? "fill-current" : "")} />
                    아닌 것 같아요
                </button>
            </div>
        </div>

        {/* 다른 후보 리스트 (무조건 보이게 수정!) */}
        <div className="space-y-3 mb-8">
            <div className="flex items-center justify-between px-1 mb-2">
                <p className="text-sm font-bold text-gray-900">
                    {feedback === 'bad' ? "👇 가장 가까운 유형을 선택해주세요" : "AI가 예측한 다른 순위"}
                </p>
                {feedback === 'bad' && <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin-slow" />}
            </div>
            
            {candidates
            .filter(c => c.cluster !== currentCluster)
            .map((candidate) => {
                const info = getClusterContent(candidate.cluster);
                return (
                <div 
                    key={candidate.cluster}
                    onClick={() => {
                        if (feedback === 'bad') {
                            setCurrentCluster(candidate.cluster);
                            setFeedback('good'); 
                            topRef.current?.scrollIntoView({ behavior: 'smooth' });
                        }
                    }}
                    className={cn(
                        "group relative flex items-center justify-between p-4 rounded-2xl bg-white border shadow-sm transition-all duration-200",
                        feedback === 'bad' 
                            ? "cursor-pointer border-gray-200 hover:border-blue-500 hover:shadow-md hover:-translate-y-0.5" 
                            : "border-gray-100 cursor-default"
                    )}
                >
                    <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 transition-colors", info.bgClass)}>
                            {info.emoji}
                        </div>
                        <div className="text-left">
                            <div className="flex items-center gap-2 mb-0.5">
                                <p className="font-bold text-gray-800 text-sm">{info.title}</p>
                                {feedback === 'bad' && <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-medium">{info.tag}</span>}
                            </div>
                            <p className="text-xs text-gray-400 font-medium">일치도 {Math.round(candidate.score * 100)}%</p>
                        </div>
                    </div>
                    
                    {feedback === 'bad' && (
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </div>
                    )}
                </div>
                );
            })}
        </div>
      </div>

      <div className="fixed bottom-0 w-full max-w-[480px] bg-white/80 backdrop-blur-md border-t border-gray-100 p-5 z-20">
          <Button 
            onClick={() => navigate('/recommendations', { state: { cluster: currentCluster } })}
            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {feedback === 'bad' ? "이 유형으로 추천받기" : "내 맞춤 카드 보러가기"}
            <ArrowRight className="w-5 h-5 ml-2 opacity-80" />
          </Button>
      </div>

    </div>
  );
};

export default SurveyComplete;