import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, Send, BarChart3, CreditCard, TrendingUp, 
  HelpCircle, ChevronDown, Bell// [수정] 아이콘 통합 Import
} from 'lucide-react';
import { ChatMessage, PaymentQuery } from '@/types'; // 경로 수정 (상대경로 -> alias)

// [변경] Hook Import
import { useChatMutation } from '@/hooks/useChat';

// json 형태 파악 함수
export const isValidJson = (value: string): boolean => {
  if (typeof value !== "string") return false;
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null;
  } catch (e) {
    return false;
  }
};

// 🛠️ [디버깅용] 강력한 JSON 파서 (마크다운 제거 기능 포함)
export const safeParseJSON = (value: string): any | null => {
  if (typeof value !== "string") return null;
  
  try {
    // 1. 순수 JSON 파싱 시도
    return JSON.parse(value);
  } catch (e) {
    // 2. 실패시 마크다운(```json ... ```) 제거 후 재시도
    try {
      console.log("⚠️ 1차 파싱 실패, 마크다운 제거 시도...");
      const cleaned = value.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleaned);
    } catch (e2) {
      console.error("❌ JSON 파싱 최종 실패:", e2);
      return null;
    }
  }
};

// --- [핵심] 안전한 JSON 파싱 및 검증 함수 ---
// 기존 isValidJson을 대체하되, 최대한 보수적으로 "마크다운 태그"만 제거합니다.
export const tryParseJSON = (value: string): any | null => {
  if (typeof value !== "string") return null;
  
  try {
    // 1. 가장 먼저 순수 JSON 파싱 시도
    return JSON.parse(value);
  } catch (e) {
    // 2. 실패했다면, LLM이 자주 붙이는 ```json ... ``` 태그만 제거하고 재시도
    try {
      if (value.includes("```")) {
        const cleaned = value.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleaned);
      }
      return null;
    } catch (e2) {
      return null; // 그래도 안 되면 JSON 아님
    }
  }
};

// --- 카드 UI 컴포넌트 ---
const RecommendationCardItem = ({ card, navigate, isBest }: any) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCardClick = () => {
    navigate('/app/wallet', { 
        state: { 
            recommendedCardId: card.id,
            payment: {
                merchant: card.merchant,
                amount: card.price,
                benefit_id: card.benefit_id,
                discount_amount: card.benefit
            }
        } 
    });
  };

  const handleHelpClick = (e: any) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className="w-full max-w-sm mb-2">
      <div 
        onClick={handleCardClick}
        className={`
          relative flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-200
          ${isBest 
            ? "bg-blue-50 border-2 border-blue-500 shadow-md z-10 hover:bg-blue-100 hover:shadow-lg hover:-translate-y-1"   
            : "bg-white border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 hover:-translate-y-0.5" 
          }
        `}
      >
        {isBest && (
          <span className="absolute -top-3 left-4 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
            BEST 추천
          </span>
        )}

        <div className="flex items-center gap-3">
          <img 
            src={`/images/${card.id}card.png`}
            alt={card.name} 
            className="w-15 h-10 rounded shadow-sm object-contain rotate-90 mr-2" 
            onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }} // 이미지 에러 처리 추가
          />
          <div className="text-left">
            <h3 className="text-sm font-bold text-gray-800">{card.name}</h3>
            <p className="text-xs text-blue-600 font-medium">
              예상 혜택: {card.benefit} 원
            </p>
          </div>
        </div>

        <button 
          onClick={handleHelpClick}
          className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
        >
          <HelpCircle size={20} />
        </button>
      </div>

      {isOpen && (
        <div className="mt-1 mx-1 p-3 bg-gray-50 text-xs text-gray-600 rounded-lg border border-gray-100 animate-in slide-in-from-top-1">
          <p className="font-bold mb-1">💡 혜택 산출 근거</p>
          {card.detail}
        </div>
      )}
    </div>
  );
};

const Chat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      content: '안녕하세요! 카드 혜택 추천 서비스입니다. 어떤 도움이 필요하신가요?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  
  // [변경] React Query Mutation 사용
  const { mutateAsync: sendMessage, isPending: isLoading } = useChatMutation();

  const [isWaitingForMerchant, setIsWaitingForMerchant] = useState(false);
  const [isWaitingForAmount, setIsWaitingForAmount] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (content: string, type: 'user' | 'bot', data?: any) => {
    const newMessage: ChatMessage = {
      // [수정] Date.now() 뒤에 랜덤 문자열을 붙여서 중복 방지
      // 예: "1704273849123-ax9z3k"
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
      type,
      content,
      timestamp: new Date(),
      data
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // const handleSendMessage = async () => {
  //   if (!inputValue.trim() || isLoading) return;

  //   const userMessage = inputValue;
  //   addMessage(userMessage, 'user');
  //   setInputValue('');
    
  //   try {
  //     // [변경] API 호출 (fetch 제거 -> sendMessage 훅 사용)
  //     const data = await sendMessage(userMessage);
      
  //     // 서버 응답 처리 로직 (기존 유지)
  //     if (isValidJson(data.response)){
  //       const recommend_data = JSON.parse(data.response);
  //       if ("recommended_card" in recommend_data && Array.isArray(recommend_data.cards)){         
  //         const uniqueCardsMap = new Map();
  //         let merchant = "";
  //         let price_val = "";

  //         for (const card_r of recommend_data.cards){
  //           merchant = card_r.merchant_name;
  //           price_val = card_r.price;

  //           const newCard = {
  //             id: card_r.card_id,
  //             name: card_r.card,
  //             benefit: card_r.bene_val,
  //             merchant: merchant,
  //             price: price_val,
  //             benefit_id: card_r.benefit_id, 
  //             desc: card_r.final_val +'원 결제 예정',
  //             detail: card_r.reason,
  //             color: 'from-blue-700 to-blue-500'
  //           };

  //           if (!uniqueCardsMap.has(newCard.id)) {
  //               uniqueCardsMap.set(newCard.id, newCard);
  //           } else {
  //               const existingCard = uniqueCardsMap.get(newCard.id);
  //               if (newCard.benefit > existingCard.benefit) {
  //                   uniqueCardsMap.set(newCard.id, newCard);
  //               }
  //           }
  //         }

  //         const recommend_cards_data = Array.from(uniqueCardsMap.values());
  //         recommend_cards_data.sort((a: any, b: any) => b.benefit - a.benefit);

  //         addMessage(merchant + "에서 " + price_val + "원 결제 시, 추천 카드를 찾았습니다!", 'bot');
  //         addMessage("", 'bot', { recommendations: recommend_cards_data });
  //       } else if ("recommended_cards_NEW" in recommend_data && Array.isArray(recommend_data.recommended_cards_NEW)) {
          
  //         const uniqueCardsMap = new Map();

  //         // 1. 데이터 매핑 (Python Output -> Frontend UI Structure)
  //         for (const card of recommend_data.recommended_cards_NEW) {
  //           const newCard = {
  //             id: card.card_id,
  //             name: card.card_name,
              
  //             // 기존 로직이 'benefit' 기준으로 정렬하므로, 여기서는 'score'를 benefit으로 매핑
  //             benefit: card.score, 
              
  //             // 일반 검색이므로 특정 가맹점/가격 없음
  //             merchant: "AI 추천", 
  //             price: "", 
  //             benefit_id: null,

  //             // desc: 카드 하단에 표시될 짧은 설명 (연회비/실적 정보 활용)
  //             desc: `연회비: ${card.domestic_year_cost} | 실적: ${card.previous_month_performance}`,

  //             // detail: 혜택 상세 내용 (리스트를 문자열로 변환)
  //             // 화면이 너무 길어지지 않게 상위 3개 정도만 보여주거나 전부 보여줌
  //             detail: card.benefit_list.join(', '), 
              
  //             // 색상은 기존과 다르게 설정 (구분감 주기 위해 보라/파랑 계열 추천)
  //             color: 'from-indigo-600 to-purple-500' 
  //           };

  //           // 중복 제거 (혹시 모를 상황 대비)
  //           if (!uniqueCardsMap.has(newCard.id)) {
  //             uniqueCardsMap.set(newCard.id, newCard);
  //           }
  //         }

  //         const recommend_cards_data = Array.from(uniqueCardsMap.values());
          
  //         // 2. 점수(benefit/score) 높은 순 정렬
  //         recommend_cards_data.sort((a, b) => b.benefit - a.benefit);

  //         // 3. 메시지 출력
  //         addMessage(`요청하신 조건("${recommend_data.user_query}")에 맞는 카드를 찾았습니다!`, 'bot');
  //         // UI 컴포넌트 렌더링을 위해 recommendations 키에 담아서 전달
  //         addMessage("", 'bot', { recommendations: recommend_cards_data });
        
  //       }
  //       else {
  //          // JSON이지만 카드 추천 데이터가 아닌 경우 (일반 대화 등)
  //          addMessage(data.response, 'bot');
  //       }
  //     } else {
  //       // 일반 텍스트 응답
  //       addMessage(data.response || "답변을 받았습니다.", 'bot'); 
  //     }

  //   } catch (error) {
  //     console.error('Error:', error);
  //     addMessage("죄송합니다. 오류가 발생하여 답변을 가져오지 못했습니다.", 'bot');
  //   }
  // };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue;
    addMessage(userMessage, 'user');
    setInputValue('');
    
    try {
      const data = await sendMessage(userMessage);

      // 🕵️‍♂️ [디버깅 로그 1] 서버에서 온 원본 데이터 확인
      console.log("🔍 [DEBUG 1] Raw Response from Hook:", data);
      console.log("🔍 [DEBUG 1-1] Response String:", data?.response);
      
      // JSON 형식인지 확인
      if (isValidJson(data.response)){
        // const recommend_data = JSON.parse(data.response);
        const recommend_data = tryParseJSON(data.response);

        if (recommend_data) {
        // 🕵️‍♂️ [디버깅 로그 2] JSON 파싱 성공
          console.log("✅ [DEBUG 2] JSON Parse Success:", recommend_data);
          console.log("🔑 [DEBUG 2-1] Keys in object:", Object.keys(recommend_data));
        }
        // =========================================================
        // CASE 1: 특정 가맹점 결제 시 추천 (기존 로직)
        // 키: "recommended_card" (단수)
        // =========================================================
        if ("recommended_card" in recommend_data && Array.isArray(recommend_data.cards)){  
          
          // ✅ [로그 추가] 
            console.log("👉 [LOG] CASE 1 진입: 특정 가맹점 결제 추천");

          const uniqueCardsMap = new Map();
          let merchant = "";
          let price_val = "";

          for (const card_r of recommend_data.cards){
            merchant = card_r.merchant_name;
            price_val = card_r.price;

            const newCard = {
              id: card_r.card_id,
              name: card_r.card,
              benefit: card_r.bene_val, // 혜택 금액
              merchant: merchant,
              price: price_val,
              benefit_id: card_r.benefit_id, 
              desc: card_r.final_val +'원 결제 예정',
              detail: card_r.reason,
              color: 'from-blue-700 to-blue-500'
            };

            if (!uniqueCardsMap.has(newCard.id)) {
                uniqueCardsMap.set(newCard.id, newCard);
            } else {
                const existingCard = uniqueCardsMap.get(newCard.id);
                if (newCard.benefit > existingCard.benefit) {
                    uniqueCardsMap.set(newCard.id, newCard);
                }
            }
          }

          const recommend_cards_data = Array.from(uniqueCardsMap.values());
          // 혜택 금액 높은 순 정렬
          recommend_cards_data.sort((a: any, b: any) => b.benefit - a.benefit);

          addMessage(merchant + "에서 " + price_val + "원 결제 시, 추천 카드를 찾았습니다!", 'bot');
          // addMessage("", 'bot', { recommendations: recommend_cards_data });
          // 🚩 [변경] cardType: 'MERCHANT' 추가
          addMessage("", 'bot', { 
              recommendations: recommend_cards_data,
              cardType: 'MERCHANT' 
          });
        } 
        
        // =========================================================
        // CASE 2: AI 일반 혜택 검색 (새로운 로직)
        // 키: "recommended_cards" (복수) - 백엔드 로그 기준
        // 정렬 기준: SCORE (점수)
        // =========================================================
        else if ("recommended_cards_NEW" in recommend_data && Array.isArray(recommend_data.recommended_cards_NEW)) {
          
          // ✅ [로그 추가]
          console.log("👉 [LOG] CASE 2 진입: AI 점수 기반 추천 (NEW)");
          console.log("🚀 [DEBUG 3] CASE 2 (recommended_cards_NEW) 진입 성공!!!");
          
          // 1. 원본 데이터 가져오기
          const rawCards = recommend_data.recommended_cards_NEW;

          console.log("📋 [DEBUG 4] Raw Cards List:", rawCards);

          // 2. Score 기준으로 내림차순 정렬 (높은 점수가 1등)
          // rawCards.sort((a: any, b: any) => b.score - a.score);

          // 3. UI 포맷으로 매핑
          const uiCards = rawCards.map((card: any) => ({
             id: card.card_id,
             name: card.card_name,
             
             // UI에서 'benefit' 변수를 숫자로 써서 랭킹을 매기거나 표시하므로 score를 여기에 할당
             benefit: Math.round(card.score), 
             
             merchant: "AI 추천", // 가맹점 정보가 없으므로 고정값
             price: "",
             benefit_id: null,
             
             // 카드 설명란에 연회비와 전월실적 표시
             desc: `연회비: ${card.domestic_year_cost} | 실적: ${card.previous_month_performance}`,
             
             // 'match_reason'이 있으면 그걸 보여주고, 없으면 혜택 리스트 나열
             detail: card.match_reason ? card.match_reason : card.benefit_list.join(', '),
             
             // AI 추천은 색상을 다르게 (보라색 계열)
             color: 'from-indigo-600 to-purple-500'
          }));

          console.log("✨ [DEBUG 5] Final UI Cards:", uiCards);

          // 4. 메시지 출력
          addMessage(`요청하신 조건("${recommend_data.user_query}")에 맞는 카드를 찾았습니다!`, 'bot');
          // addMessage("", 'bot', { recommendations: uiCards });
          // 🚩 [변경] cardType: 'AI_SCORE' 추가
          addMessage("", 'bot', { 
              recommendations: uiCards, 
              cardType: 'AI_SCORE' 
          });
        }
        else {
           // JSON이지만 카드 추천 데이터가 아닌 경우 (일반 대화 등)
           addMessage(data.response, 'bot');
        }
      } else {
        // 일반 텍스트 응답
        addMessage(data.response || "답변을 받았습니다.", 'bot'); 
      }

    } catch (error) {
      console.error('Error:', error);
      addMessage("죄송합니다. 오류가 발생하여 답변을 가져오지 못했습니다.", 'bot');
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'spending':
        navigate('/app/analysis/detail');
        break;
      case 'performance':
        navigate('/app/performance');
        break;
      case 'recommend':
        addMessage('어떤 가맹점에서 결제하실 예정인가요?', 'bot');
        setIsWaitingForMerchant(true);
        break;
    }
  };

  return (
    <div className="flex flex-col h-full"> 
      <div className="flex items-center p-4 border-b">
        <h1 className="text-lg font-semibold flex-1 text-center">카드 추천 챗봇</h1>
        <Button variant="ghost" size="icon" className="absolute right-4" onClick={() => navigate('/app/notifications')}>
          <Bell className="w-6 h-6 text-gray-700" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={message.type === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}>
              
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              
              {message.data?.recommendations && (
                <div className="mt-3 space-y-2 w-full min-w-[280px]">
                  {/* {message.data.recommendations.map((card: any, index: number) => (
                    <RecommendationCardItem 
                      key={index} 
                      card={card} 
                      navigate={navigate} 
                      isBest={index === 0}
                    />
                  ))} */}
                  {message.data.recommendations.map((card: any, index: number) => {
                    
                    // 🌟 [핵심] 여기서 조건문으로 분기 처리!
                    if (message.data.cardType === 'AI_SCORE') {
                        // 👉 CASE 2: AI 점수 기반 추천일 때 (NEW)
                        return (
                            <RecommendationCardItem 
                              key={index} 
                              card={card} 
                              navigate={navigate} 
                              isBest={index === 0}
                              // 예: AI 추천은 배경색을 다르게 주거나, 상세 내용을 처음부터 펼치고 싶다면 prop으로 전달
                              isAiRecommendation={true} 
                            />
                        );
                    } else {
                        // 👉 CASE 1: 기존 가맹점 추천일 때
                        return (
                            <RecommendationCardItem 
                              key={index} 
                              card={card} 
                              navigate={navigate} 
                              isBest={index === 0}
                              isAiRecommendation={false}
                            />
                        );
                    }

                  })}
                </div>
              )}

            </div>
          </div>
        ))}
        
        {/* [변경] isLoading (isPending) 상태일 때 로딩 표시 */}
        {isLoading && (
          <div className="flex justify-start animate-in fade-in duration-300">
            <div className="chat-bubble-bot flex items-center space-x-1 min-h-[40px]">
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
            </div>
          </div>
        )}

        {messages.length === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">빠른 메뉴</p>
            <div className="grid grid-cols-1 gap-2">
              <Button 
                variant="outline" 
                className="justify-start h-auto p-4"
                onClick={() => handleQuickAction('recommend')}
              >
                <CreditCard className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">카드 추천받기</div>
                  <div className="text-xs text-muted-foreground">결제할 가맹점과 금액 입력</div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="justify-start h-auto p-4"
                onClick={() => handleQuickAction('spending')}
              >
                <BarChart3 className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">내 소비패턴</div>
                  <div className="text-xs text-muted-foreground">카테고리별 소비 분석</div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="justify-start h-auto p-4"
                onClick={() => handleQuickAction('performance')}
              >
                <TrendingUp className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">카드 실적 현황</div>
                  <div className="text-xs text-muted-foreground">이번 달 실적 달성 현황</div>
                </div>
              </Button>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-card">
        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              isWaitingForAmount ? "금액을 입력하세요 (예: 15000)" :
              isWaitingForMerchant ? "가맹점명을 입력하세요" :
              ""
            }
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading} // 로딩 중 버튼 비활성화
            size="icon"
            className="btn-gradient"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;