import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { SurveyResponse, BenefitCategory } from '../types';
import { surveyQuestions, benefitCategoryNames } from '../data/mockData';
import { matchUserGroup, getCardCombinations } from '../utils/cardRecommendation';

const Survey = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Partial<SurveyResponse>>({
    spendingCategories: [],
    preferredBenefits: [],
    monthlyBudget: 0,
    benefitPreference: 'multiple_small',
    primarySpendingCategory: 'dining'
  });

  const totalSteps = surveyQuestions.length;

  const handleMultipleChoice = (value: string, checked: boolean) => {
    const currentQuestion = surveyQuestions[currentStep];
    if (currentQuestion.id === 'spending-categories') {
      setResponses(prev => ({
        ...prev,
        spendingCategories: checked 
          ? [...(prev.spendingCategories || []), value as BenefitCategory]
          : (prev.spendingCategories || []).filter(item => item !== value)
      }));
    }
  };

  const handleSingleChoice = (value: string) => {
    const currentQuestion = surveyQuestions[currentStep];
    switch (currentQuestion.id) {
      case 'monthly-budget':
        setResponses(prev => ({ ...prev, monthlyBudget: parseInt(value) }));
        break;
      case 'benefit-preference':
        setResponses(prev => ({ ...prev, benefitPreference: value as 'single_big' | 'multiple_small' }));
        break;
      case 'primary-category':
        setResponses(prev => ({ ...prev, primarySpendingCategory: value as BenefitCategory }));
        break;
    }
  };

  const canProceed = () => {
    const currentQuestion = surveyQuestions[currentStep];
    switch (currentQuestion.id) {
      case 'spending-categories':
        return (responses.spendingCategories?.length || 0) > 0;
      case 'monthly-budget':
        return responses.monthlyBudget && responses.monthlyBudget > 0;
      case 'benefit-preference':
        return responses.benefitPreference !== undefined;
      case 'primary-category':
        return responses.primarySpendingCategory !== undefined;
      default:
        return true;
    }
  };

  // --- [수정됨] ---
  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // 설문 완료 - 분석 로딩 페이지로 이동
      const completeResponse = responses as SurveyResponse;
      const userGroup = matchUserGroup(completeResponse);
      const cardCombinations = getCardCombinations(completeResponse);
      
      // /recommendations 대신 /analysis-loading으로 이동
      navigate('/analysis-loading', { 
        state: { 
          surveyResponse: completeResponse,
          userGroup,
          cardCombinations
        }
      });
    }
  };
  // --- [수정 완료] ---

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentQuestion = surveyQuestions[currentStep];

  return (
    <div className="app-container">
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/login')} // [수정] 로그인 페이지로 돌아가기
          className="mr-3"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">소비 성향 설문</h1>
          <p className="text-sm text-muted-foreground">
            {currentStep + 1} / {totalSteps}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 pt-4">
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {currentQuestion.type === 'multiple' ? (
              // 복수 선택
              <div className="space-y-3">
                {currentQuestion.options.map((option) => (
                  <div key={option.value} className="flex items-center space-x-3">
                    <Checkbox
                      id={option.value}
                      checked={responses.spendingCategories?.includes(option.value as BenefitCategory) || false}
                      onCheckedChange={(checked) => handleMultipleChoice(option.value, checked as boolean)}
                    />
                    <Label 
                      htmlFor={option.value}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              // 단일 선택
              <RadioGroup
                value={
                  currentQuestion.id === 'monthly-budget' ? responses.monthlyBudget?.toString() :
                  currentQuestion.id === 'benefit-preference' ? responses.benefitPreference :
                  currentQuestion.id === 'primary-category' ? responses.primarySpendingCategory :
                  ''
                }
                onValueChange={handleSingleChoice}
                className="space-y-3"
              >
                {currentQuestion.options.map((option) => (
                  <div key={option.value} className="flex items-center space-x-3">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label 
                      htmlFor={option.value}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </CardContent>
        </Card>

        {/* 선택된 항목 요약 (복수 선택인 경우) */}
        {currentQuestion.type === 'multiple' && responses.spendingCategories && responses.spendingCategories.length > 0 && (
          <Card className="shadow-card mt-4">
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-2">선택된 항목:</p>
              <div className="flex flex-wrap gap-2">
                {responses.spendingCategories.map((category) => (
                  <span 
                    key={category}
                    className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                  >
                    {benefitCategoryNames[category]}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Navigation */}
      <div className="p-6 border-t">
        <div className="flex justify-between space-x-4">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            이전
          </Button>
          
          <Button 
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex-1 btn-gradient"
          >
            {currentStep === totalSteps - 1 ? '결과 보기' : '다음'}
            {currentStep < totalSteps - 1 && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Survey;