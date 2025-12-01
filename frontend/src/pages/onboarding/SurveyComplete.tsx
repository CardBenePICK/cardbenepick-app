import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, ThumbsUp, ThumbsDown, ArrowRight, RefreshCw, AlertCircle, HelpCircle, Check, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- 1. 타입 정의 ---
interface Candidate {
  cluster: number;
  score: number;
}

interface PredictionResponse {
  status: string;
  request_id: string; 
  predicted_cluster: number;
  confidence_score: number;
  ranking?: { cluster: number; probability: number }[]; 
  candidates?: { cluster: number; score: number }[];
}

interface FeedbackPayload {
  request_id: string;
  predicted_cluster: number;
  confidence_score: number;
  is_correct: boolean;
  corrected_cluster: number; 
  comment: string;
}

// [추가] 외부 서버 전송용 데이터 타입 정의
interface UserPreferencePayload {
    user_id?: string; // 유저 ID가 있다면 포함
    cluster_id: number;
    preferred_categories: string[];
    timestamp: string;
}

const SurveyComplete = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const surveyResult = location.state?.surveyResult;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 데이터 상태
  const [apiResponse, setApiResponse] = useState<PredictionResponse | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  
  // UI 상태
  const [feedback, setFeedback] = useState<'good' | 'bad' | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<number>(0); 
  const [openDescId, setOpenDescId] = useState<number | null>(null);
  const [userComment, setUserComment] = useState(''); // [필수] 사용자 코멘트 상태
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const topRef = useRef<HTMLDivElement>(null);

  // --- 2. API 호출 ---
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

        const data: PredictionResponse = await response.json();
        console.log("✅ 예측 완료:", data);

        // 데이터 정제
        const rawList = data.ranking || data.candidates || [];
        let normalizedList: Candidate[] = rawList.map((item: any) => ({
            cluster: item.cluster,
            score: item.probability !== undefined ? item.probability : (item.score || 0)
        }));

        if (normalizedList.length === 0) {
            const allClusters = [0, 1, 2, 3, 4];
            normalizedList.push({ cluster: data.predicted_cluster, score: data.confidence_score || 0.85 });
            allClusters.forEach(id => {
                if (id !== data.predicted_cluster) normalizedList.push({ cluster: id, score: 0.05 });
            });
        }
        normalizedList.sort((a, b) => b.score - a.score);

        setTimeout(() => {
            setApiResponse(data);
            setCandidates(normalizedList);
            setSelectedCluster(data.predicted_cluster);
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

  // --- 3. 최종 제출 핸들러 ---
  const handleSubmit = async () => {
    if (!apiResponse) return;
    setIsSubmitting(true);

    // 코멘트 정리
    let finalComment = userComment.trim();
    if (feedback === 'good') {
        finalComment = "사용자 동의";
    } else if (!finalComment) {
        finalComment = "사용자 수정 (코멘트 없음)";
    }

    const finalPayload: FeedbackPayload = {
        request_id: apiResponse.request_id,
        predicted_cluster: apiResponse.predicted_cluster,
        confidence_score: apiResponse.confidence_score,
        is_correct: feedback === 'good',
        corrected_cluster: selectedCluster, 
        comment: finalComment 
    };

    // 2. [추가] 외부 서버 활용용 데이터 준비 (클러스터 + 카테고리)
    const userCategories = Array.isArray(surveyResult?.preferredCategories) 
        ? surveyResult.preferredCategories 
        : [];

    const integrationPayload: UserPreferencePayload = {
        cluster_id: selectedCluster, // 사용자가 최종 선택한 클러스터
        preferred_categories: userCategories, // 설문 10번 문항 값
        timestamp: new Date().toISOString()
    };

    // --- [확인용 로그] ---
    console.group("🚀 데이터 전송 준비");
    console.log("1. 피드백 데이터 (ML 학습용):", finalPayload);
    console.log("2. 통합 데이터 (서비스 활용용):", integrationPayload);
    console.groupEnd();
    
    try {
        // (A) ML 서버로 피드백 전송
        await fetch('http://localhost:9000/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalPayload),
        });

        // (B) 백엔드 서버로 통합 데이터 전송
        const response = await fetch('http://localhost:8000/api/users/preferences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(integrationPayload),
        });
        
        if (response.ok) {
            console.log("✅ 통합 데이터 백엔드 전송 성공!");
            // alert("통합 데이터 전송 성공!"); // [확인용] 필요시 주석 해제
        } else {
            const errText = await response.text();
            console.error("❌ 통합 데이터 전송 실패:", response.status, errText);
            // alert(`전송 실패: ${response.status}`); // [확인용] 필요시 주석 해제
        }

    } catch (e) {
        console.warn("데이터 전송 중 오류 발생 (무시하고 진행):", e);
        // alert("전송 중 네트워크 오류 발생"); // [확인용] 필요시 주석 해제
    }

    try {
        // 보낼 데이터 구성
        const agentPayload = {
            user_id: "test_user_id", // 실제 구현시: user?.id || "guest"
            cluster_id: selectedCluster, // 사용자가 최종 선택한 클러스터
            preferred_categories: [], // [주의] 설문 결과에 카테고리가 있다면 여기에 넣어야 함
            timestamp: new Date().toISOString()
        };

        console.log("📤 Sending to Main Backend:", agentPayload);

        // 메인 백엔드 호출
        const response = await api.post('/users/preferences', agentPayload);
        
        console.log("✅ Backend Response:", response.data);

        // 성공 시 결과 페이지로 이동
        setTimeout(() => {
            setIsSubmitting(false);
            navigate('/recommendations', { 
                state: { 
                    cluster: selectedCluster,
                    recommendationData: response.data // 백엔드 응답 데이터 전달
                } 
            });
        }, 500);

    } catch (e) {
        console.error("❌ Failed to send preferences to backend:", e);
        setIsSubmitting(false);
        // 에러가 나도 일단 넘어갈지, 사용자에게 알릴지 결정
        alert("추천 정보를 저장하는 중 오류가 발생했습니다.");
    }
    

    // setTimeout(() => {
    //     setIsSubmitting(false);
    //     navigate('/recommendations', { state: { cluster: selectedCluster } });
    // }, 500);
  };

  // --- 4. 클러스터 컨텐츠 ---
  const getClusterContent = (clusterId: number) => {
    switch (clusterId) {
      case 0: return { title: "실속 미식가", eng: "Value Diner", emoji: "🥘", desc: "맛있는 외식과 건강 관리가 삶의 낙!\n하지만 낭비는 싫어하는 실속파입니다.", tag: "미식·건강", colorClass: "text-orange-600", bgClass: "bg-orange-50 border-orange-100" };
      case 1: return { title: "알뜰 소액족", eng: "Minimalist", emoji: "🪙", desc: "불필요한 지출은 절대 NO!\n꼭 필요한 곳에만 지갑을 여는 짠테크 고수.", tag: "절약·미니멀", colorClass: "text-emerald-600", bgClass: "bg-emerald-50 border-emerald-100" };
      case 2: return { title: "에듀 맘/대디", eng: "Edu-Focus", emoji: "🎓", desc: "자녀 교육비 지출이 압도적 1위!\n아이의 미래를 위해 아낌없이 투자하시네요.", tag: "자녀교육", colorClass: "text-indigo-600", bgClass: "bg-indigo-50 border-indigo-100" };
      case 3: return { title: "럭셔리 VIP", eng: "Affluent Lifestyle", emoji: "👑", desc: "외식, 여행, 레저까지!\n삶의 질을 높이는 데 아낌없는 여유로운 라이프.", tag: "프리미엄", colorClass: "text-purple-600", bgClass: "bg-purple-50 border-purple-100" };
      case 4: return { title: "마이카 중산층", eng: "Car Owner", emoji: "🚗", desc: "내 차와 함께라면 어디든!\n주유비와 차량 관리에 진심인 오너 드라이버.", tag: "드라이버", colorClass: "text-blue-600", bgClass: "bg-blue-50 border-blue-100" };
      default: return { title: "스마트 컨슈머", eng: "Smart Consumer", emoji: "🧐", desc: "당신의 소비 패턴을 분석해\n딱 맞는 혜택을 찾아냈어요!", tag: "분석완료", colorClass: "text-gray-600", bgClass: "bg-gray-50 border-gray-100" };
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center max-w-[480px] mx-auto">
      <Loader2 className="w-12 h-12 text-primary animate-spin mb-6" />
      <h2 className="text-xl font-bold text-foreground mb-2">AI가 소비 성향을<br/>분석하고 있습니다</h2>
      <p className="text-muted-foreground text-sm">잠시만 기다려 주세요...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center max-w-[480px] mx-auto">
      <AlertCircle className="w-12 h-12 text-destructive mb-4" />
      <p className="text-muted-foreground mb-6">{error}</p>
      <Button onClick={() => navigate('/survey')} variant="outline">처음으로 돌아가기</Button>
    </div>
  );

  const predictedClusterId = apiResponse?.predicted_cluster ?? 0;
  const mainContent = getClusterContent(predictedClusterId);
  const mainScore = apiResponse?.confidence_score ?? 0;

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground w-full max-w-[480px] mx-auto relative">
      <div ref={topRef} />

      <div className="flex-1 px-6 py-8 overflow-y-auto pb-40">
        
        {/* 상단 뱃지 */}
        <div className="flex justify-center mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-primary text-[11px] font-bold tracking-wider uppercase shadow-sm">
                <Sparkles className="w-3 h-3" />
                AI Analysis Complete
            </span>
        </div>

        {/* 메인 결과 카드 (항상 고정) */}
        <div className="bg-card rounded-[2rem] p-8 shadow-card border border-border text-center mb-8 relative overflow-hidden animate-in zoom-in duration-500">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-indigo-500"></div>
            <div className="text-6xl mb-4 cursor-default">{mainContent.emoji}</div>
            <h1 className="text-2xl font-extrabold text-foreground mb-1 leading-tight">
                당신은 <span className={cn("text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600")}>"{mainContent.title}"</span><br/>입니다
            </h1>
            <p className="text-xs text-muted-foreground font-medium mb-4 uppercase tracking-wide">{mainContent.eng}</p>
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line mb-6 font-medium">{mainContent.desc}</p>
            <div className="inline-flex items-center gap-2 bg-muted px-4 py-2 rounded-xl border border-border">
                <span className="text-xs text-muted-foreground font-medium">분석 신뢰도</span>
                <span className="text-sm font-bold text-foreground">{Math.round(mainScore * 100)}%</span>
            </div>
        </div>

        {/* 피드백 버튼 */}
        <div className="mb-8">
            <p className="text-center text-sm text-muted-foreground mb-4 font-medium">결과가 마음에 드시나요?</p>
            <div className="flex gap-3 justify-center">
                <button 
                    onClick={() => { 
                        setFeedback('good'); 
                        setSelectedCluster(predictedClusterId); 
                        setUserComment(''); // 좋아요 누르면 코멘트 초기화
                    }}
                    className={cn(
                        "flex-1 py-3.5 px-4 rounded-xl border text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2",
                        feedback === 'good' ? "bg-primary text-primary-foreground border-primary shadow-lg transform scale-105" : "bg-card text-muted-foreground border-border hover:bg-muted"
                    )}
                >
                    <ThumbsUp className={cn("w-4 h-4", feedback === 'good' ? "fill-current" : "")} /> 네, 맞아요!
                </button>

                <button 
                    onClick={() => { setFeedback('bad'); }}
                    className={cn(
                        "flex-1 py-3.5 px-4 rounded-xl border text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2",
                        feedback === 'bad' ? "bg-slate-800 text-white border-slate-800 shadow-lg transform scale-105" : "bg-card text-muted-foreground border-border hover:bg-muted"
                    )}
                >
                    <ThumbsDown className={cn("w-4 h-4", feedback === 'bad' ? "fill-current" : "")} /> 아닌 것 같아요
                </button>
            </div>
        </div>

        {/* [코멘트 입력창] 싫어요(bad)일 때 무조건 보이게 조건부 렌더링 */}
        {feedback === 'bad' && (
            <div className="mb-10 animate-in slide-in-from-top-2 duration-300">
                <label className="text-sm font-bold text-foreground mb-2 block flex items-center gap-1.5 ml-1">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    어떤 점이 아쉬운가요? (선택)
                </label>
                <textarea
                    value={userComment}
                    onChange={(e) => setUserComment(e.target.value)}
                    placeholder="예: 혜택이 저랑 안 맞는 것 같아요. 저는 여행보다 쇼핑을 더 좋아해요."
                    className="w-full p-4 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none h-28 placeholder:text-muted-foreground shadow-sm"
                />
            </div>
        )}

        {/* 다른 후보 리스트 */}
        <div className="space-y-3 mb-8">
            <div className="flex items-center justify-between px-1 mb-2">
                <p className="text-sm font-bold text-foreground">
                    {feedback === 'bad' ? "👇 본인에게 맞는 유형을 선택해주세요" : "AI가 예측한 다른 순위"}
                </p>
                {feedback === 'bad' && <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin-slow" />}
            </div>
            
            {candidates
            .filter(c => c.cluster !== predictedClusterId)
            .map((candidate) => {
                const info = getClusterContent(candidate.cluster);
                const isSelected = selectedCluster === candidate.cluster;
                const isDescOpen = openDescId === candidate.cluster;

                return (
                <div 
                    key={candidate.cluster}
                    onClick={() => {
                        if (feedback === 'bad') {
                            setSelectedCluster(candidate.cluster);
                        }
                    }}
                    className={cn(
                        "relative flex flex-col p-4 rounded-2xl bg-card border transition-all duration-200",
                        (feedback === 'bad' && isSelected)
                            ? "border-primary ring-1 ring-primary bg-blue-50/30 shadow-md scale-[1.01] z-10"
                            : "border-border",
                        feedback === 'bad' && !isSelected && "cursor-pointer hover:border-primary/50 active:scale-[0.99]"
                    )}
                >
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-4">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 transition-colors", info.bgClass)}>
                                {info.emoji}
                            </div>
                            <div className="text-left">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <p className={cn("font-bold text-sm", isSelected && feedback === 'bad' ? "text-primary" : "text-foreground")}>
                                        {info.title}
                                    </p>
                                    {isSelected && feedback === 'bad' && (
                                        <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full font-bold">
                                            <Check className="w-2.5 h-2.5" /> 선택
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground font-medium">일치도 {Math.round(candidate.score * 100)}%</p>
                            </div>
                        </div>

                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpenDescId(isDescOpen ? null : candidate.cluster);
                            }}
                            className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                                isDescOpen ? "bg-muted text-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                            )}
                        >
                            <HelpCircle className="w-4 h-4" />
                        </button>
                    </div>

                    <div className={cn(
                        "grid transition-all duration-300 ease-in-out text-left overflow-hidden",
                        isDescOpen ? "grid-rows-[1fr] opacity-100 mt-3 pt-3 border-t border-border" : "grid-rows-[0fr] opacity-0"
                    )}>
                        <div className="min-h-0 text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                            {info.desc}
                        </div>
                    </div>
                </div>
                );
            })}
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 w-full max-w-[480px] bg-white/80 backdrop-blur-md border-t border-border p-5 z-20">
          <Button 
            onClick={handleSubmit} 
            disabled={!feedback || isSubmitting} 
            className={cn(
                "w-full h-14 text-lg font-bold rounded-xl shadow-lg transition-all",
                feedback 
                    ? "btn-gradient hover:shadow-blue-500/20 active:scale-[0.98]"
                    : "bg-muted text-muted-foreground shadow-none cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
                <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
                <>
                    {feedback === 'bad' ? "선택한 유형으로 결정하기" : "내 맞춤 카드 보러가기"}
                    {feedback && <ArrowRight className="w-5 h-5 ml-2 opacity-80" />}
                </>
            )}
          </Button>
      </div>

    </div>
  );
};

export default SurveyComplete;