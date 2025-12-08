import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, Send, BarChart3, CreditCard, TrendingUp, 
  HelpCircle, ChevronDown, Bell
} from 'lucide-react';
import { ChatMessage, PaymentQuery } from '@/types'; 
import { useChatMutation } from '@/hooks/useChat';

// --- 파싱 유틸리티 함수들 ---
export const isValidJson = (value: string): boolean => {
  if (typeof value !== "string") return false;
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null;
  } catch (e) {
    return false;
  }
};

export const safeParseJSON = (value: string): any | null => {
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch (e) {
    try {
      const cleaned = value.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleaned);
    } catch (e2) {
      return null;
    }
  }
};

export const tryParseJSON = (value: string): any | null => {
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch (e) {
    try {
      if (value.includes("```")) {
        const cleaned = value.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleaned);
      }
      return null;
    } catch (e2) {
      return null; 
    }
  }
};

// --- 카드 썸네일 컴포넌트 ---
const CardThumbnail = ({ id, name }: { id: string | number, name: string }) => {
  const [shouldRotate, setShouldRotate] = useState(false);
  const [isImageReady, setIsImageReady] = useState(false);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalHeight > naturalWidth) {
      setShouldRotate(true);
    }
    setIsImageReady(true);
  };

  return (
    <div className="w-[64px] h-[40px] flex items-center justify-center mr-3 flex-shrink-0 bg-transparent">
      <img 
        src={`/images/${id}card.png`}
        alt={name} 
        onLoad={handleImageLoad}
        className={`
          rounded shadow-sm object-contain transition-opacity duration-200
          ${shouldRotate ? 'rotate-90 h-[64px] w-[40px]' : 'w-full h-full'}
          ${isImageReady ? 'opacity-100' : 'opacity-0'} 
        `}
        style={shouldRotate ? { transform: 'rotate(90deg) scale(0.9)' } : {}}
        onError={(e) => { 
            e.currentTarget.src = '/placeholder.svg';
            setIsImageReady(true); 
        }} 
      />
    </div>
  );
};

// --- [핵심 수정] 카드 UI 컴포넌트 ---
const RecommendationCardItem = ({ card, navigate, isBest, isAiRecommendation }: any) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCardClick = () => {
    if (isAiRecommendation) {
        navigate(`/app/card/${card.id}`); 
    } else {
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
    }
  };

  const handleHelpClick = (e: any) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const renderDetailContent = () => {
    if (!card.detail) return null;

    if (isAiRecommendation) {
        // 1. match_reason 파싱 및 'Variety' 제외
        const matchReasons = card.detail.split('+')
            .map((s: string) => s.trim())
            .filter((s: string) => !s.toLowerCase().includes('variety')); // 🚫 Variety 제외

        // 2. 실제 혜택 리스트 (card.raw_benefit_list가 있다면 사용, 없으면 detail에서 처리 불가)
        // Chat 컴포넌트에서 card.benefit_list를 raw_benefit_list로 넘겨줬다고 가정하거나,
        // 현재 card 구조상 benefit_list가 포함되어 있지 않다면 Chat 컴포넌트의 매핑 로직을 확인해야 함.
        // (아래 Chat 컴포넌트 수정에서 'raw_benefit_list'를 추가해줄 것입니다.)
        const benefitList = card.raw_benefit_list || [];

        return (
            <div className="space-y-3">
                {/* 매칭 이유 (뱃지) */}
                <div className="flex flex-wrap gap-1">
                    {matchReasons.map((part: string, idx: number) => (
                        <span 
                            key={idx} 
                            // 폰트 크기 변경: text-[10px] -> text-xs
                            className="text-xs px-2 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-md font-medium"
                        >
                            {part}
                        </span>
                    ))}
                </div>

                {/* 혜택 상세 리스트 (줄글) */}
                {benefitList.length > 0 && (
                    <div className="bg-gray-50 p-2 rounded border border-gray-100">
                        {/* 폰트 크기 변경: text-[10px] -> text-xs */}
                        <p className="text-xs font-bold text-gray-600 mb-1">주요 혜택</p>
                        <ul className="list-disc list-inside space-y-0.5">
                            {benefitList.map((ben: string, idx: number) => (
                                // 폰트 크기 변경: text-[10px] -> text-xs
                                <li key={idx} className="text-xs text-gray-700 leading-tight truncate">
                                    {ben}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    } 
    
    // 일반 추천
    // 폰트 크기 변경: 기본값 -> text-sm
    return <p className="mt-1 text-sm text-gray-600 leading-relaxed">{card.detail}</p>;
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
          // 폰트 크기 변경: text-[10px] -> text-xs
          <span className="absolute -top-3 left-4 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
            BEST 추천
          </span>
        )}

        <div className="flex items-center gap-3">
          <CardThumbnail id={card.id} name={card.name} />
          <div className="text-left">
            {/* 폰트 크기 변경: text-sm -> text-base */}
            <h3 className="text-base font-bold text-gray-800">{card.name}</h3>
            {/* 폰트 크기 변경: text-xs -> text-sm */}
            <p className="text-sm text-blue-600 font-medium">
              {isAiRecommendation ? `매칭 점수: ${card.benefit}점` : `예상 혜택: ${card.benefit} 원`}
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
        // 폰트 크기 변경: text-xs -> text-sm
        <div className="mt-1 mx-1 p-3 bg-white text-sm rounded-lg border border-gray-200 shadow-sm animate-in slide-in-from-top-1">
          <div className="flex items-center gap-2 mb-2">
             <span className="font-bold text-gray-800">💡 {isAiRecommendation ? "추천 이유 분석" : "혜택 산출 근거"}</span>
          </div>
          
          {renderDetailContent()}

          {/* 추가 정보 (연회비/실적) - 진하게 변경 */}
          {card.desc && (
             // 폰트 크기 변경: text-[11px] -> text-xs
             <div className="mt-3 pt-2 border-t border-gray-100 text-gray-700 text-xs font-medium flex justify-between">
                {/* desc 문자열(연회비:... | 실적:...)을 파이프로 쪼개서 양쪽에 배치하거나 그대로 진하게 출력 */}
                <span>{card.desc.split('|')[0]}</span>
                <span>{card.desc.split('|')[1]}</span>
             </div>
          )}
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
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
      type,
      content,
      timestamp: new Date(),
      data
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue;
    addMessage(userMessage, 'user');
    setInputValue('');
    
    try {
      const data = await sendMessage(userMessage);

      console.log("🔍 [DEBUG 1] Raw Response from Hook:", data);
      
      if (isValidJson(data.response)){
        const recommend_data = tryParseJSON(data.response);

        if (recommend_data) {
          console.log("✅ [DEBUG 2] JSON Parse Success:", recommend_data);
        }
        
        // CASE 1: 특정 가맹점 결제 시 추천
        if ("recommended_card" in recommend_data && Array.isArray(recommend_data.cards)){         
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
              benefit: card_r.bene_val,
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
          recommend_cards_data.sort((a: any, b: any) => b.benefit - a.benefit);

          addMessage(merchant + "에서 " + price_val + "원 결제 시, 추천 카드를 찾았습니다!", 'bot');
          addMessage("", 'bot', { 
              recommendations: recommend_cards_data,
              cardType: 'MERCHANT' 
          });
        } 
        
        // CASE 2: AI 일반 혜택 검색
        else if ("recommended_cards_NEW" in recommend_data && Array.isArray(recommend_data.recommended_cards_NEW)) {
          console.log("👉 [LOG] CASE 2 진입: AI 점수 기반 추천 (NEW)");
          
          const rawCards = recommend_data.recommended_cards_NEW;
          rawCards.sort((a: any, b: any) => b.score - a.score);

          const uiCards = rawCards.map((card: any) => ({
             id: card.card_id,
             name: card.card_name,
             benefit: Math.round(card.score), 
             merchant: "AI 추천",
             price: "",
             benefit_id: null,
             desc: `연회비: ${card.domestic_year_cost} | 전월실적: ${card.previous_month_performance}`,
             detail: card.match_reason, // match_reason만 넣고,
             raw_benefit_list: card.benefit_list, // 🌟 [추가] 실제 혜택 리스트를 별도로 전달
             color: 'from-indigo-600 to-purple-500' 
          }));

          addMessage(`요청하신 조건("${recommend_data.user_query}")에 맞는 카드를 찾았습니다!`, 'bot');
          addMessage("", 'bot', { 
              recommendations: uiCards, 
              cardType: 'AI_SCORE' 
          });
        }
        else {
           addMessage(data.response, 'bot');
        }
      } else {
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
        {/* 폰트 크기 변경: text-lg -> text-xl */}
        <h1 className="text-xl font-semibold flex-1 text-center">카드 추천 챗봇</h1>
        <Button variant="ghost" size="icon" className="absolute right-4" onClick={() => navigate('/app/notifications')}>
          <Bell className="w-6 h-6 text-gray-700" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={message.type === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}>
              
              {/* 폰트 크기 변경: text-sm -> text-base */}
              <p className="text-base whitespace-pre-wrap">{message.content}</p>
              
              {message.data?.recommendations && (
                <div className="mt-3 space-y-2 w-full min-w-[280px]">
                  {message.data.recommendations.map((card: any, index: number) => {
                    
                    if (message.data.cardType === 'AI_SCORE') {
                        return (
                            <RecommendationCardItem 
                              key={index} 
                              card={card} 
                              navigate={navigate} 
                              isBest={index === 0}
                              isAiRecommendation={true} 
                            />
                        );
                    } else {
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
        
        {isLoading && (
          <div className="flex justify-start animate-in fade-in duration-300">
            <div className="chat-bubble-bot flex items-center space-x-1 min-h-[40px]">
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
            </div>
          </div>
        )}

        {/* {messages.length === 1 && (
          <div className="space-y-3">
            <p className="text-base text-muted-foreground text-center">빠른 메뉴</p>
            <div className="grid grid-cols-1 gap-2">
              <Button 
                variant="outline" 
                className="justify-start h-auto p-4"
                onClick={() => handleQuickAction('recommend')}
              >
                <CreditCard className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium text-base">카드 추천받기</div>
                  <div className="text-sm text-muted-foreground">결제할 가맹점과 금액 입력</div>
                </div>
              </Button>
              {/* ... 나머지 버튼들 ... * /}
            </div>
          </div>
        )} 
        */}
        
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
            disabled={!inputValue.trim() || isLoading} 
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