import { client } from './client';
import axios from 'axios'; // ML/Agent 서버는 별도 인스턴스 또는 axios 직접 사용

// [환경변수] ML 서버 주소
const ML_BASE_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:9000';

// 데이터 타입 정의
export interface SurveyResult {
  ageGroup: string;
  gender: string;
  lifeStage: string;
  monthlySpend: string;
  hasCar: string;
  diningFrequency: string;
  hasLeisure: string;
  hasEdu: string;
  hasHealth: string;
  preferredCategories: string[];
}

export interface PredictionResponse {
  status: string;
  request_id: string;
  predicted_cluster: number;
  confidence_score: number;
  ranking?: { cluster: number; probability: number }[];
  candidates?: { cluster: number; score: number }[];
}

export interface FeedbackPayload {
  request_id: string;
  predicted_cluster: number;
  confidence_score: number;
  is_correct: boolean;
  corrected_cluster: number;
  comment: string;
}

export const mlApi = {
  // ML 서버로 예측 요청
  predictCluster: async (surveyResult: SurveyResult) => {
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

    // ML 서버는 별도 주소이므로 axios 직접 사용 (또는 별도 client 생성 가능)
    const response = await axios.post<PredictionResponse>(`${ML_BASE_URL}/predict`, payload);
    return response.data;
  },

  // ML 서버로 피드백 전송
  sendFeedback: async (payload: FeedbackPayload) => {
    await axios.post(`${ML_BASE_URL}/feedback`, payload);
  },

  // 백엔드(Agent)로 최종 결과 전송 및 추천 카드 요청
  saveUserPreference: async (data: {
    cluster_id: number;
    preferred_categories: string[];
    timestamp: string;
  }) => {
    // 메인 백엔드 API 호출 (api 인스턴스 사용)
    const response = await client.post('/users/preferences', data);
    return response.data;
  }
};