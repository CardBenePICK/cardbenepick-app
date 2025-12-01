// import { Outlet, NavLink, useLocation } from 'react-router-dom';
// import { MessageCircle, Wallet, LayoutGrid } from 'lucide-react';
// import { cn } from '@/lib/utils';

// // --- [수정됨] ---
// const navItems = [
//   { path: 'chat', label: '챗봇', icon: MessageCircle },
//   { path: 'wallet', label: '월렛', icon: Wallet },
//   { path: 'analysis', label: '전체', icon: LayoutGrid }, // '분석' -> '전체'로 레이블 변경
// ];
// // --- [수정 완료] ---

// const MainLayout = () => {
//   const location = useLocation();
//   // 'wallet/add' 같은 하위 경로도 'wallet' 탭이 활성화되도록 수정
//   const currentBasePath = location.pathname.split('/')[2] || 'wallet';

//   return (
//     <div className="app-container flex flex-col h-screen">
//       {/* 메인 콘텐츠 영역 (배경색이 body에서 적용됨) */}
//       <main className="flex-1 overflow-y-auto pb-20">
//         <Outlet />
//       </main>

//       {/* 하단 탭 네비게이션 */}
//       <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
//         <nav className="flex justify-around items-center h-16">
//           {navItems.map((item) => {
//             const isActive = currentBasePath === item.path;
//             return (
//               <NavLink
//                 key={item.path}
//                 to={`/app/${item.path}`}
//                 className={({ isActive }) =>
//                   cn(
//                     'flex flex-col items-center justify-center w-full h-full gap-1 text-xs',
//                     isActive
//                       ? 'text-primary font-semibold' // 활성 시 메인 블루
//                       : 'text-muted-foreground' // 비활성 시 보조 텍스트
//                   )
//                 }
//               >
//                 <item.icon className="w-5 h-5" />
//                 <span>{item.label}</span>
//               </NavLink>
//             );
//           })}
//         </nav>
//       </footer>
//     </div>
//   );
// };

// export default MainLayout;

import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, CreditCard, Menu } from 'lucide-react';

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 현재 활성화된 탭인지 확인 (색상 변경용)
  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="flex flex-col h-screen bg-white max-w-[480px] mx-auto shadow-2xl relative">
      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 overflow-y-auto bg-gray-50 pb-20 scrollbar-hide">
        <Outlet />
      </div>
      
      {/* 하단 탭바 (순서: 월렛 - 챗봇 - 전체) */}
      <div className="fixed bottom-0 w-full max-w-[480px] bg-white border-t border-gray-100 p-0 flex justify-around items-center h-16 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        
        {/* 1. 내 지갑 (Wallet) - 맨 앞으로 이동 */}
        <button 
          onClick={() => navigate('/app/wallet')}
          className="flex flex-col items-center justify-center w-full h-full gap-1 active:scale-95 transition-transform"
        >
          <CreditCard className={`w-6 h-6 ${isActive('/app/wallet') ? 'text-blue-600 fill-blue-50' : 'text-gray-400'}`} />
          <span className={`text-[10px] font-medium ${isActive('/app/wallet') ? 'text-blue-600' : 'text-gray-400'}`}>
            내 지갑
          </span>
        </button>

        {/* 2. 챗봇 (Chat) - 두 번째로 이동 */}
        <button 
          onClick={() => navigate('/app/chat')}
          className="flex flex-col items-center justify-center w-full h-full gap-1 active:scale-95 transition-transform"
        >
          <MessageCircle className={`w-6 h-6 ${isActive('/app/chat') ? 'text-blue-600 fill-blue-50' : 'text-gray-400'}`} />
          <span className={`text-[10px] font-medium ${isActive('/app/chat') ? 'text-blue-600' : 'text-gray-400'}`}>
            챗봇
          </span>
        </button>

        {/* 3. 전체 (Analysis) - 그대로 유지 */}
        <button 
          onClick={() => navigate('/app/analysis')}
          className="flex flex-col items-center justify-center w-full h-full gap-1 active:scale-95 transition-transform"
        >
          <Menu className={`w-6 h-6 ${isActive('/app/analysis') ? 'text-blue-600' : 'text-gray-400'}`} />
          <span className={`text-[10px] font-medium ${isActive('/app/analysis') ? 'text-blue-600' : 'text-gray-400'}`}>
            전체
          </span>
        </button>

      </div>
    </div>
  );
};

export default MainLayout;