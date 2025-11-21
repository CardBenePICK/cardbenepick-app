import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Send, BarChart3, CreditCard, TrendingUp } from 'lucide-react';
import { ChatMessage, PaymentQuery } from '../../../types';
import { getCardRecommendations, inferCategoryFromMerchant } from '../../../utils/cardRecommendation';
import { sampleCards } from '../../../data/mockData';

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
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return; // 로딩 중이면 중복 전송 방지

    const userMessage = inputValue;
    addMessage(userMessage, 'user');
    setInputValue('');
    setIsLoading(true); // 로딩 시작

    try {
      // 서버로 POST 요청 전송
      const response = await fetch('http://localhost:8090/chat_react', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded', // 폼 데이터 전송 방식
          // 만약 JSON으로 보내고 싶다면 'application/json'을 사용하고 body를 JSON.stringify({ query: userMessage })로 변경
        },
        // Jinja 템플릿의 form 방식과 호환되도록 x-www-form-urlencoded 형식으로 전송
        body: new URLSearchParams({
          'query': userMessage 
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      console.log("chat-response", response)
      // 서버 응답 처리 (JSON으로 온다고 가정)
      const data = await response.json();
      
      // 서버 응답 구조에 맞춰 메시지 추가
      // 예: { "response": "추천 카드는...", "cards": [...] } 라고 가정
      addMessage(data.response || "답변을 받았습니다.", 'bot', { recommendations: data.cards });

    } catch (error) {
      console.error('Failed to send message:', error);
      addMessage("죄송합니다. 서버와 통신 중 오류가 발생했습니다.", 'bot');
    } finally {
      setIsLoading(false); // 로딩 종료
    }
  };
  // --- [수정 완료] ---


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
        {messages.map((message) => (
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