import { useState, useEffect } from 'react';
import { mlApi, SurveyResult, PredictionResponse, FeedbackPayload } from '@/api/ml';
import { useNavigate } from 'react-router-dom';

export interface Candidate {
  cluster: number;
  score: number;
}

export const useML = (surveyResult: SurveyResult | null) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [apiResponse, setApiResponse] = useState<PredictionResponse | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<number>(0);

  // 1. 분석 실행 (컴포넌트 마운트 시)
  useEffect(() => {
    const analyze = async () => {
      if (!surveyResult) {
        setError('설문 데이터가 없습니다.');
        setLoading(false);
        return;
      }

      try {
        // ML 서버 예측 요청
        const data = await mlApi.predictCluster(surveyResult);
        console.log("✅ ML 서버 예측 완료:", data);

        // 데이터 정제 (ranking/candidates 통합)
        const rawList = data.ranking || data.candidates || [];
        let normalizedList: Candidate[] = rawList.map((item: any) => ({
            cluster: item.cluster,
            score: item.probability !== undefined ? item.probability : (item.score || 0)
        }));

        // 후보가 없는 경우 fallback 데이터 생성
        if (normalizedList.length === 0) {
            const allClusters = [0, 1, 2, 3, 4];
            normalizedList.push({ cluster: data.predicted_cluster, score: data.confidence_score || 0.85 });
            allClusters.forEach(id => {
                if (id !== data.predicted_cluster) normalizedList.push({ cluster: id, score: 0.05 });
            });
        }
        normalizedList.sort((a, b) => b.score - a.score);

        // 결과 설정 (UX를 위한 딜레이 추가)
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

    analyze();
  }, [surveyResult]);

  // 2. 최종 제출 (피드백 + 선호도 저장)
  const submitResult = async (
    feedback: 'good' | 'bad',
    comment: string
  ) => {
    if (!apiResponse) return;

    // 피드백 데이터 구성
    const feedbackPayload: FeedbackPayload = {
        request_id: apiResponse.request_id,
        predicted_cluster: apiResponse.predicted_cluster,
        confidence_score: apiResponse.confidence_score,
        is_correct: feedback === 'good',
        corrected_cluster: selectedCluster,
        comment: comment.trim() || (feedback === 'good' ? "사용자 동의" : "사용자 수정 (코멘트 없음)")
    };

    // 백엔드 전송 데이터 구성
    const userCategories = surveyResult?.preferredCategories || [];
    const preferencePayload = {
        cluster_id: selectedCluster,
        preferred_categories: userCategories,
        timestamp: new Date().toISOString()
    };

    try {
        // (A) ML 피드백 전송 (실패해도 진행)
        try {
            await mlApi.sendFeedback(feedbackPayload);
            console.log("✅ ML 피드백 전송 완료");
        } catch (e) {
            console.warn("ML 피드백 전송 실패 (무시):", e);
        }

        // (B) 백엔드 저장 및 추천 결과 요청
        console.log("📤 백엔드로 요청 보냄:", preferencePayload);
        const responseData = await mlApi.saveUserPreference(preferencePayload);
        
        console.log("📦 백엔드 응답 데이터:", responseData);

        // 결과 페이지로 이동
        navigate('/recommendations', { 
            state: { 
                cluster: selectedCluster,
                recommendationData: responseData 
            } 
        });

    } catch (e) {
        console.error("❌ 백엔드 전송 실패:", e);
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