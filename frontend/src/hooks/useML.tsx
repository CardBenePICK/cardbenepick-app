// CardBenePICK_Web\frontend\src\hooks\useML.tsx

import { useState, useEffect } from 'react';
import { mlApi, SurveyResult, PredictionResponse, FeedbackPayload } from '@/api/ml';
import { useNavigate, useLocation } from 'react-router-dom'; // useLocation은 필요 없음
import { useUserStore } from '@/store/useUserStore'; 

// ... (Candidate 인터페이스 유지) ...

// [수정] 훅 시그니처 확장: mydataResult를 두 번째 인수로 받습니다.
export const useML = (
    surveyResult: SurveyResult | null,
    mydataResult: PredictionResponse | null = null // mydataResult 추가
) => {
    const navigate = useNavigate();
    const { isLoggedIn, user } = useUserStore(); 

    // mydataResult가 있으면 로딩을 시작하지 않습니다. (이미 결과가 있으므로)
    const [loading, setLoading] = useState(mydataResult ? false : true);
    const [error, setError] = useState('');
    
    // mydataResult가 있으면 초기값으로 사용
    const [apiResponse, setApiResponse] = useState<PredictionResponse | null>(mydataResult);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [selectedCluster, setSelectedCluster] = useState<number>(0);

    // 1. 초기 분석 (ML 예측) - 로직 통합 및 기존 API 호출 대체
    useEffect(() => {
        const analyze = async () => {
            let data: PredictionResponse | null = null;
            let source: 'survey' | 'mydata' | null = null;

            if (mydataResult) {
                // A) 마이데이터 결과가 이미 state로 넘어온 경우 (최우선 처리)
                data = mydataResult;
                source = 'mydata';
                console.log("📊 [Analysis Hook] 마이데이터 결과 (미리 예측됨) 바로 사용.");

            } else if (surveyResult) {
                // B) 설문 결과가 있는 경우 (기존 로직: API 호출 필요)
                source = 'survey';
                console.log("📝 [Analysis Hook] 설문 결과 기반 API 호출.");
                try {
                    data = await mlApi.predictCluster(surveyResult);
                } catch (err) {
                    console.error("❌ [Analysis Hook] ML 예측 실패:", err);
                    setError('분석 서버와 연결할 수 없습니다.');
                    setLoading(false);
                    return;
                }
            } else {
                // C) 데이터가 없는 경우 (에러 처리)
                setError('분석 데이터가 없습니다. 다시 시작해주세요.');
                setLoading(false);
                return;
            }

            // --- 예측 결과 데이터 정규화 및 상태 업데이트 (data가 있을 때만 실행) ---
            if (data) {
                const rawList = data.ranking || data.candidates || [];
                let normalizedList: Candidate[] = rawList.map((item: any) => ({
                    cluster: item.cluster,
                    score: item.probability !== undefined ? item.probability : (item.score || 0)
                }));

                // 데이터가 없을 경우 보정 로직 (기존 유지)
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
                }, source === 'mydata' ? 500 : 1500); // 마이데이터는 예측이 이미 완료되어 있으므로 딜레이 단축
            }
        };

        analyze();
    }, [surveyResult, mydataResult]); // 의존성 배열에 mydataResult 추가


    // 2. 최종 제출 및 라우팅 처리
    const submitResult = async (
        feedback: 'good' | 'bad',
        comment: string
    ) => {
        if (!apiResponse) return;

        // (A) ML 피드백 전송 (공통)
        const feedbackPayload: FeedbackPayload = {
            request_id: apiResponse.request_id,
            predicted_cluster: apiResponse.predicted_cluster,
            confidence_score: apiResponse.confidence_score,
            is_correct: feedback === 'good',
            corrected_cluster: selectedCluster,
            comment: comment.trim() || (feedback === 'good' ? "사용자 동의" : "사용자 수정")
        };
        try {
            await mlApi.sendFeedback(feedbackPayload);
        } catch (e) {
            console.warn("ML 피드백 전송 실패 (무시):", e);
        }

        // (B) [핵심 분기] 비로그인 상태 확인 후 라우팅 (기존 로직 유지)
        if (!isLoggedIn) {
            console.log("🔒 비로그인 사용자 -> 로그인 페이지로 이동");
            
            navigate('/login', { 
                state: { 
                    message: "맞춤 카드를 보려면 로그인이 필요합니다.",
                    surveyResult, 
                    clusterId: selectedCluster 
                } 
            });
            return;
        }

        // (C) 로그인 상태 -> RAG 추천 결과 요청 및 이동
        try {
            // 마이데이터 경로인 경우 preferredCategories는 빈 배열로 보냅니다.
            const userCategories = surveyResult?.preferredCategories || []; 
            const currentUserId = user?.user_id ? String(user.user_id) : 'guest_user_id';
            
            const preferencePayload = {
                user_id: currentUserId,
                cluster_id: selectedCluster,
                preferred_categories: userCategories, // 설문조사 카테고리 또는 빈 배열
                timestamp: new Date().toISOString()
            };

            console.log("📤 [Analysis Hook] 백엔드 추천 요청:", preferencePayload);
            const responseData = await mlApi.saveUserPreference(preferencePayload);
            console.log("📥 [Analysis Hook] 추천 결과 수신:", responseData);

            navigate('/recommendations', { 
                state: { 
                    cluster: selectedCluster,
                    recommendationData: responseData 
                } 
            });

        } catch (e) {
            // ... (에러 로깅 및 throw 로직 유지)
            if (e.response && e.response.status === 422) {
                console.error("🚨 422 Validation Error Details:", e.response.data);
            }
            console.error("❌ [Analysis Hook] 추천 요청 실패:", e);
            throw new Error("추천 정보를 불러오는 중 오류가 발생했습니다.");
        }
    };

    return {
        loading,
        error,
        apiResponse,
        candidates,
        selectedCluster,
        setSelectedCluster,
        submitResult
    };
};