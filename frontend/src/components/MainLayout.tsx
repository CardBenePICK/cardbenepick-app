import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { MessageCircle, Wallet, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- [수정됨] ---
const navItems = [
  { path: 'chat', label: '챗봇', icon: MessageCircle },
  { path: 'wallet', label: '월렛', icon: Wallet },
  { path: 'analysis', label: '분석', icon: LayoutGrid }, // 1. path: 'spending' -> 'analysis'
];
// --- [수정 완료] ---

const MainLayout = () => {
  const location = useLocation();
  // 'wallet/add' 같은 하위 경로도 'wallet' 탭이 활성화되도록 수정
  const currentBasePath = location.pathname.split('/')[2] || 'wallet';

  return (
    <div className="app-container flex flex-col h-screen">
      {/* 메인 콘텐츠 영역 (배경색이 body에서 적용됨) */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* 하단 탭 네비게이션 */}
      <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
        <nav className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = currentBasePath === item.path;
            return (
              <NavLink
                key={item.path}
                to={`/app/${item.path}`}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center w-full h-full gap-1 text-xs',
                    isActive
                      ? 'text-primary font-semibold' // 활성 시 메인 블루
                      : 'text-muted-foreground' // 비활성 시 보조 텍스트
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </footer>
    </div>
  );
};

export default MainLayout;