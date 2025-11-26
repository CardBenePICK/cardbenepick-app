import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ClipboardCheck } from 'lucide-react';

const SurveyComplete = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Survey.tsx에서 넘겨준 설문 결과 데이터
  const surveyResult = location.state?.surveyResult;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-blue-50 p-6 rounded-full mb-6">
        <ClipboardCheck className="w-16 h-16 text-blue-600" />
      </div>
      
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        설문조사가 완료되었습니다!
      </h1>
      
      <p className="text-gray-500 mb-8 max-w-xs mx-auto">
        소중한 답변 감사합니다.<br/>
        이 페이지에 곧 <strong>맞춤형 분석 결과</strong>가<br/>
        채워질 예정입니다. 🚧
      </p>

      {/* (개발용) 데이터가 잘 넘어왔는지 확인 */}
      {surveyResult && (
        <div className="bg-gray-100 p-4 rounded-lg text-left text-xs text-gray-600 w-full max-w-sm mb-8 overflow-auto max-h-40">
          <p className="font-bold mb-1">전송된 응답 데이터:</p>
          <pre>{JSON.stringify(surveyResult, null, 2)}</pre>
        </div>
      )}

      <Button 
        onClick={() => navigate('/app/wallet')}
        className="w-full max-w-xs h-12 text-base font-bold"
        variant="outline"
      >
        메인으로 이동 (임시)
      </Button>
    </div>
  );
};

export default SurveyComplete;