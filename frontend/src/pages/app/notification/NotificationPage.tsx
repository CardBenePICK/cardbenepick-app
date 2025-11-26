import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NotificationItem from '@/components/NotificationItem';
import { Notification } from '@/types';
import { fetchWithAuth } from '@/lib/api';

const NotificationPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetchWithAuth('http://localhost:8000/api/notifications/');
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch (error) {
        console.error("알림 로드 실패:", error);
      }
    };
    loadData();
  }, []);

  // [추가된 부분 1] 알림 클릭 시 실행될 함수
  const handleNotificationClick = (noti: Notification) => {
    const contentObj = !Array.isArray(noti.content) ? noti.content : null;
    
    const title = contentObj ? (contentObj as any).title : '';
    const message = contentObj ? (contentObj as any).message : '';

    // 3번 타입(주간리포트)이거나 제목에 '주간'이 들어가면 달력으로 이동
    if (
          noti.alarm_type === 3 || 
          (title && title.includes('주간')) || 
          (message && message.includes('주간'))
        ) {
          navigate('/app/analysis/calendar');
        }
        // [추가된 부분] 2. 공지사항(Type 2) -> 상세 페이지로 이동
        else if (noti.alarm_type === 2) {
          // noti 객체를 통째로 state에 담아서 보냅니다
          navigate(`/app/notification/${noti.id}`, { state: { notice: noti } });
        }
      };

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const recentNotifications = notifications.filter(
    (n) => new Date(n.created_at) > oneWeekAgo
  );

  const oldNotifications = notifications.filter(
    (n) => new Date(n.created_at) <= oneWeekAgo
  );

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      <div className="flex items-center p-4 border-b bg-white sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-3">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">알림</h1>
      </div>
      
      <div>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground text-sm">
            <p>새로운 알림이 없습니다.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {recentNotifications.length > 0 && (
              <div>
                <div className="px-4 py-3 text-xs font-bold text-gray-500 bg-gray-50 border-b border-gray-100">
                  최근 알림
                </div>
                <div className="bg-white">
                  {recentNotifications.map((noti) => (
                    <NotificationItem 
                      key={noti.id} 
                      item={noti}
                      // [추가된 부분 2] 클릭 이벤트를 아이템에 전달
                      onClick={() => handleNotificationClick(noti)} 
                    />
                  ))}
                </div>
              </div>
            )}

            {oldNotifications.length > 0 && (
              <div> 
                <div className="px-4 py-3 text-xs font-bold text-gray-500 bg-gray-50 border-b border-gray-100">
                  이전 알림
                </div>
                <div className="bg-white">
                  {oldNotifications.map((noti) => (
                    <NotificationItem 
                      key={noti.id} 
                      item={noti}
                      // [추가된 부분 2] 여기도 동일하게 전달
                      onClick={() => handleNotificationClick(noti)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPage;