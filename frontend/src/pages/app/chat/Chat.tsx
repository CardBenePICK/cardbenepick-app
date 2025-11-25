import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Send, BarChart3, CreditCard, TrendingUp } from 'lucide-react';
import { ChatMessage, PaymentQuery } from '../../../types';
import { getCardRecommendations, inferCategoryFromMerchant } from '../../../utils/cardRecommendation';
import { sampleCards } from '../../../data/mockData';
//[임시 2]
import { HelpCircle, ChevronDown } from 'lucide-react'; // 상단 import에 추가 필요!

// Chat.tsx 상단

// json 형태 파악 함수
export const isValidJson = (value: string): boolean => {
  if (typeof value !== "string") return false;
  try {
    const parsed = JSON.parse(value);
    // 단순히 파싱만 성공하면 JSON으로 볼 것인지, 객체/배열 형태여야 하는지 체크
    return typeof parsed === "object" && parsed !== null;
  } catch (e) {
    return false;
  }
};

// --- [임시 1] 고정된 카드 데이터 (백엔드 대신 여기서 내용 수정) ---
const FIXED_CARD_DATA = [
  {
    id: 'samsung_taptap',
    name: '삼성카드 taptap O',
    benefit: '1,250원', // 혜택 금액
    desc: '스타벅스 50% 할인', // 짧은 요약
    detail: '삼성카드 taptap O는 월 커피 할인 한도 10,000원 중 잔여 한도가 9,178원 남아있어 50% 할인이 전액 적용됩니다. (전월 실적 80만원 충족)', // 물음표 눌렀을 때 나올 긴 설명
    color: 'from-pink-500 to-orange-400' // 카드 색상 (그라데이션)
  },
  {
    id: 'shinhan_deep',
    name: '신한카드 Deep Dream',
    benefit: '375원',
    desc: '전가맹점 0.7% 적립',
    detail: '특별한 할인 조건이 없는 가맹점이므로, Deep Dream의 기본 적립률 0.7%가 적용되어 375 포인트가 적립됩니다.',
    color: 'from-blue-700 to-blue-500'
  }
];

// --- [임시 2] 카드 UI 컴포넌트 ---
// import { HelpCircle, ChevronDown } from 'lucide-react'; // 상단 import에 추가 필요!

const RecommendationCardItem = ({ card, navigate, isBest }: any) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCardClick = () => {
    // 카드를 누르면 결제 화면으로 이동하면서 카드 정보 넘기기
    navigate('/app/wallet', { state: { recommendedCardId: card.id } });
  };

  const handleHelpClick = (e: any) => {
    e.stopPropagation(); // 부모의 클릭(결제 이동) 방지
    setIsOpen(!isOpen); // 설명창 열기/닫기 토글
  };

  return (
    <div className="w-full max-w-sm mb-2">
      {/* 1. 카드 메인 영역 */}

      <div 
        onClick={handleCardClick}
        className={`
          relative flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-200
          ${isBest 
            // 🥇 1등 스타일 (Hover 추가)
            // 기본: 파란 테두리 + 연한 배경
            // Hover: 배경이 조금 더 진해짐(blue-100) + 그림자 더 커짐(shadow-lg) + 살짝 위로 떠오름(-translate-y-1)
            ? "bg-blue-50 border-2 border-blue-500 shadow-md z-10 hover:bg-blue-100 hover:shadow-lg hover:-translate-y-1"   
            
            // 🥈 일반 스타일 (Hover 추가)
            // 기본: 흰색 배경
            // Hover: 회색 배경(gray-50) + 그림자 커짐(shadow-md) + 살짝 위로 떠오름(-translate-y-0.5)
            : "bg-white border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 hover:-translate-y-0.5" 
          }
        `}
      >
      {/* 🥇 1등일 경우 왼쪽 상단에 뱃지 추가 */}
      {isBest && (
        <span className="absolute -top-3 left-4 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
          BEST 추천
        </span>
      )}

      {/* <div 
        onClick={handleCardClick}
        className="relative flex items-center justify-between p-4 bg-white border rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all"
      > */}
        <div className="flex items-center gap-3">
          {/* 카드 이미지 (네모 박스) */}
          {/* <div className={`w-10 h-6 rounded bg-gradient-to-r ${card.color} shadow-sm`}></div> */}
          <img 
            src={`/images/${card.id}card.png`}
            alt={card.name} 
            className="w-15 h-10 rounded shadow-sm object-contain rotate-90 mr-2" 
            // className="w-24 h-16 object-contain rotate-90"
          />
          {/* 텍스트 정보 */}
          <div className="text-left">
            <h3 className="text-sm font-bold text-gray-800">{card.name}</h3>
            <p className="text-xs text-blue-600 font-medium">
              예상 혜택: {card.benefit} 원
            </p>
          </div>
        </div>

        {/* 물음표 버튼 */}
        <button 
          onClick={handleHelpClick}
          className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
        >
          <HelpCircle size={20} />
        </button>
      </div>

      {/* 2. 상세 설명 영역 (isOpen일 때만 보임) */}
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
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태 추가

  // --- [수정됨] ---
  const [isWaitingForMerchant, setIsWaitingForMerchant] = useState(false); // 가맹점 입력 대기 상태
  // --- [수정 완료] ---
  
  const [isWaitingForAmount, setIsWaitingForAmount] = useState(false);
  const [currentQuery, setCurrentQuery] = useState<Partial<PaymentQuery>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (content: string, type: 'user' | 'bot', data?: any) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      data
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // --- [수정됨] ---
  // [임시임시]
  // Chat.tsx 내부 handleSendMessage 수정

const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue;
    addMessage(userMessage, 'user');
    setInputValue('');
    setIsLoading(true); // 로딩 시작 (... 나옴)


    // 1. 로컬 스토리지에서 토큰 가져오기
    const token = localStorage.getItem("access_token");
    try{
      // 1. 로컬 스토리지에서 토큰 가져오기
      const token = localStorage.getItem("access_token");

      // 2. 서버에 요청 (헤더에 토큰 추가)
      const response = await fetch('http://localhost:8090/chat_react', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
            // [핵심] 토큰이 있을 때만 Authorization 헤더를 추가합니다.
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: new URLSearchParams({ 'query': userMessage })
      });
    
    // 헤더에 토큰 포함시키기
    // try {
    //   // 1. 서버에 요청은 보냄 (로딩 시간 연출 + 실제 통신)
    //   const response = await fetch('http://localhost:8090/chat_react', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    //     body: new URLSearchParams({ 'query': userMessage })
    //   });

      // 2. 응답이 오면 내용은 무시하고! 
      //    우리가 준비한 'FIXED_CARD_DATA'를 메시지에 담음    

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      console.log("chat-response", response)
      // 서버 응답 처리 (JSON으로 온다고 가정)
      const data = await response.json();
      
      // 서버 응답 구조에 맞춰 메시지 추가
      // 예: { "response": "추천 카드는...", "cards": [...] } 라고 가정
      if (isValidJson(data.response)){
        const recommend_data = JSON.parse(data.response);
        if ("recommended_card" in recommend_data){ // 혜택 계산을 해서 나왔을 경우
          console.log("recommended_card 가 있습니다.")
          
          
          const recommend_cards_data = []
          let merchant = ""
          let price_val = ""

          for (const card_r of recommend_data.cards){
            merchant = card_r.merchant_name;
            price_val = card_r.price;

            const newCard =
            {
              id: card_r.card_id,
              name: card_r.card,
              benefit: card_r.bene_val,
              desc: card_r.final_val +'원 결제 예정',
              detail: card_r.reason,
              color: 'from-blue-700 to-blue-500'
            };
            recommend_cards_data.push(newCard)
          }

          // 혜택이 가장 높은 카드가 가장 위로 올라오도록.
          recommend_cards_data.sort((a, b) => b.benefit - a.benefit);

          addMessage(merchant + "에서 " + price_val + "원 결제 시, 추천 카드를 찾았습니다!", 'bot');
          addMessage("", 'bot', { recommendations: recommend_cards_data });
        }
        // addMessage(data.response + "\n\n 이렇습니다." || "답변을 받았습니다.", 'bot', { recommendations: data.cards });  
      }else{
        addMessage("data.response가 json 형태가 아닙니다.\n" + data.response + "\n\n 이렇습니다." || "답변을 받았습니다.", 'bot', { recommendations: data.cards }); 
      }
         

    } catch (error) {
      console.error('Error:', error);
      addMessage("오류가 발생했습니다.", 'bot');
    } finally {
      setIsLoading(false); // 로딩 끝
    }
  };
  // const handleSendMessage = async () => {
  //   if (!inputValue.trim() || isLoading) return; // 로딩 중이면 중복 전송 방지

  //   const userMessage = inputValue;
  //   addMessage(userMessage, 'user');
  //   setInputValue('');
  //   setIsLoading(true); // 로딩 시작

  //   try {
  //     // 서버로 POST 요청 전송
  //     const response = await fetch('http://localhost:8090/chat_react', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/x-www-form-urlencoded', // 폼 데이터 전송 방식
  //         // 만약 JSON으로 보내고 싶다면 'application/json'을 사용하고 body를 JSON.stringify({ query: userMessage })로 변경
  //       },
  //       // Jinja 템플릿의 form 방식과 호환되도록 x-www-form-urlencoded 형식으로 전송
  //       body: new URLSearchParams({
  //         'query': userMessage 
  //       })
  //     });

  //     if (!response.ok) {
  //       throw new Error(`Server error: ${response.status}`);
  //     }
  //     console.log("chat-response", response)
  //     // 서버 응답 처리 (JSON으로 온다고 가정)
  //     const data = await response.json();
      
  //     // 서버 응답 구조에 맞춰 메시지 추가
  //     // 예: { "response": "추천 카드는...", "cards": [...] } 라고 가정
  //     addMessage(data.response || "답변을 받았습니다.", 'bot', { recommendations: data.cards });

  //   } catch (error) {
  //     console.error('Failed to send message:', error);
  //     addMessage("죄송합니다. 서버와 통신 중 오류가 발생했습니다.", 'bot');
  //   } finally {
  //     setIsLoading(false); // 로딩 종료
  //   }
  // };
  // // --- [수정 완료] ---


  // --- [수정됨] ---
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'spending':
        navigate('/app/spending'); // 경로 수정
        break;
      case 'performance':
        navigate('/app/performance'); // 경로 수정
        break;
      case 'recommend':
        addMessage('어떤 가맹점에서 결제하실 예정인가요?', 'bot');
        setIsWaitingForMerchant(true); // 가맹점 입력 대기 상태로 변경
        break;
    }
  };
  // --- [수정 완료] ---

  const handleCardRecommendationClick = (cardId: string) => {
    navigate('/app/wallet', { state: { recommendedCardId: cardId } });
  };

  return (
    <div className="flex flex-col h-full"> 
      <div className="flex items-center p-4 border-b">
        <h1 className="text-lg font-semibold flex-1 text-center">카드 추천 챗봇</h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={message.type === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}>
              <p className="text-sm">{message.content}</p>
              
              {message.data?.recommendations && (
                <div className="mt-3 space-y-2">
                  {message.data.recommendations.map((rec: any, index: number) => (
                    <Card 
                      key={index} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleCardRecommendationClick(rec.card.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{rec.card.name}</h4>
                            <p className="text-xs text-muted-foreground">{rec.reason}</p>
                            <p className="text-xs font-medium" style={{color: "hsl(var(--success))"}}>
                              예상 혜택: {rec.expectedBenefit.toLocaleString()}원
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))} */}
        
        {/* 임시 4 */}
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={message.type === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}>
              
              {/* 1. 텍스트 메시지 내용 */}
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              
              {/* 2. 추천 카드 데이터가 있으면 -> 우리가 만든 새 컴포넌트로 보여주기! */}
              {message.data?.recommendations && (
                <div className="mt-3 space-y-2 w-full min-w-[280px]">
                  {message.data.recommendations.map((card: any, index: number) => (
                    <RecommendationCardItem 
                      key={index} 
                      card={card} 
                      navigate={navigate} 
                      isBest={index === 0} // 처음 부분을 체크하게 하려고.
                    />
                  ))}
                </div>
              )}

            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start animate-in fade-in duration-300">
            {/* 기존 봇 말풍선 스타일(chat-bubble-bot) 적용 */}
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
            // --- [수정됨] ---
            placeholder={
              isWaitingForAmount ? "금액을 입력하세요 (예: 15000)" :
              isWaitingForMerchant ? "가맹점명을 입력하세요" :
              "" // 1. "카드 추천받기"를 누르기 전에는 placeholder 없음
            }
            // --- [수정 완료] ---
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
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