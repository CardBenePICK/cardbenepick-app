// 카드 관련 타입 정의
export interface Card {
  id: string;
  name: string;
  bank: string;
  image: string;
  annualFee: number;
  benefits: Benefit[];
  category: CardCategory;
  popularityScore: number;
}

export interface Benefit {
  id: string;
  category: BenefitCategory;
  description: string;
  discountRate: number;
  cashbackRate?: number;
  pointRate?: number;
  maxDiscount?: number;
  conditions?: string[];
}

export type BenefitCategory = 
  | 'dining' 
  | 'cafe' 
  | 'shopping' 
  | 'gas' 
  | 'transport' 
  | 'online' 
  | 'grocery' 
  | 'entertainment' 
  | 'travel' 
  | 'utility';

export type CardCategory = 'premium' | 'standard' | 'cashback' | 'points' | 'travel';

// 사용자 관련 타입
export interface User {
  id: string;
  email: string;
  name: string;
  cards: UserCard[];
  spendingPattern: SpendingPattern;
  preferences: UserPreferences;
}

export interface UserCard {
  cardId: string;
  card: Card;
  monthlySpending: number;
  currentMonthPerformance: Performance;
  lastMonthPerformance: Performance;
}

export interface Performance {
  requiredAmount: number;
  currentAmount: number;
  isAchieved: boolean;
  benefits: string[];
}

export interface SpendingPattern {
  categories: {
    [key in BenefitCategory]: number;
  };
  totalMonthly: number;
  averageTransaction: number;
}

export interface UserPreferences {
  preferredBenefits: BenefitCategory[];
  preferredBenefitType: 'single_big' | 'multiple_small';
  monthlyBudget: number;
}

// 챗봇 관련 타입
export interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  data?: any;
}

export interface PaymentQuery {
  merchant: string;
  amount: number;
  category?: BenefitCategory;
}

export interface CardRecommendation {
  card: Card;
  reason: string;
  expectedBenefit: number;
  type: 'best_benefit' | 'performance_needed' | 'additional_recommendation';
}

// 설문조사 관련 타입
export interface SurveyResponse {
  spendingCategories: BenefitCategory[];
  preferredBenefits: BenefitCategory[];
  monthlyBudget: number;
  benefitPreference: 'single_big' | 'multiple_small';
  primarySpendingCategory: BenefitCategory;
}

export interface UserGroup {
  id: string;
  name: string;
  characteristics: string[];
  popularCards: Card[];
  spendingPattern: SpendingPattern;
}

// 차트 데이터 타입
export interface ChartData {
  name: string;
  value: number;
  color: string;
}

export interface RadarChartData {
  category: string;
  user: number;
  group: number;
}