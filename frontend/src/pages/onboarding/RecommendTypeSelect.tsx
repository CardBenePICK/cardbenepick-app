// CardBenePICK_Web\frontend\src\pages\onboarding\RecommendTypeSelect.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, User, MousePointerClick } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { mlApi, SurveyResult } from '@/api/ml'; // SurveyResult import 추가 (pass를 위해)
import { cn } from '@/lib/utils';

const RecommendTypeSelect = () => {
    const navigate = useNavigate();
    const { user } = useUserStore(); // user 정보 (user_id)를 가져옴
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 마이데이터 추천 요청 핸들러
    const handleMydataRecommend = async () => {
        if (!user?.user_id) {
            setError("사용자 ID를 찾을 수 없습니다. 다시 로그인해 주세요.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const userIdString = String(user.user_id);
            console.log(`📡 [Mydata] 추천 요청 시작: User ID ${userIdString}`);
            
            // [API 호출] ML 서버로 user_id만 전송
            const result = await mlApi.predictMydata(userIdString);

            console.log("✅ [Mydata] 클러스터 예측 완료:", result);

            // 예측 결과를 SurveyComplete 페이지로 바로 넘깁니다. 
            // surveyResult는 null로 넘겨서 useML 훅이 설문 로직을 건너뛰게 합니다.
            navigate('/survey-complete', {
                state: { 
                    // surveyResult를 null로 전달하여 useML 훅이 예측 API를 호출하지 않도록 합니다.
                    surveyResult: null as SurveyResult | null, 
                    
                    // 마이데이터 예측 결과를 useML이 사용할 수 있도록 넘깁니다.
                    mydataResult: result, 
                }
            });

        } catch (err) {
            console.error("❌ [Mydata] 추천 실패:", err);
            setError("마이데이터 분석에 실패했습니다. 설문조사로 진행해 주세요.");
            setLoading(false);
        }
    };

    const handleSurveySelect = () => {
        // 설문조사 페이지로 이동
        navigate('/survey');
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center max-w-[448px] mx-auto">
            <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
                어떤 방식으로<br/>카드를 추천받으시겠어요?
            </h1>
            <p className="text-sm text-gray-500 mb-10">
                정확도 높은 추천을 위해 방법을 선택해 주세요.
            </p>

            {/* --- 옵션 카드 --- */}
            <div className="w-full space-y-4">
                {/* 1. 마이데이터 추천 */}
                <button
                    onClick={handleMydataRecommend}
                    disabled={loading}
                    className={cn(
                        "w-full p-6 rounded-2xl border-2 transition-all duration-200",
                        loading ? "bg-gray-100 border-gray-300" : "bg-blue-50 border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.99]"
                    )}
                >
                    {/* ... (UI 내용 생략) ... */}
                </button>

                {/* 2. 설문조사 추천 */}
                <button
                    onClick={handleSurveySelect}
                    disabled={loading}
                    className="w-full p-6 rounded-2xl border-2 border-gray-300 bg-white hover:bg-gray-50 active:scale-[0.99] transition-all duration-200"
                >
                    {/* ... (UI 내용 생략) ... */}
                </button>
            </div>

            {error && (
                <p className="text-sm text-red-500 mt-4 p-3 bg-red-50 rounded-lg w-full">{error}</p>
            )}
        </div>
    );
};

export default RecommendTypeSelect;