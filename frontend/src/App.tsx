import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// 레이아웃 및 페이지 임포트 + 로그인 세션 만료 체크 임포트
import MainLayout from "./components/MainLayout";
import SessionMonitor from "./components/SessionMonitor";

// --- 루트 페이지 ---
import Splash from "./pages/Splash";
import NotFound from "./pages/NotFound";

// --- 1. 인증 (auth) ---
import Login from "./pages/auth/Login";
import VerifyOtp from "./pages/auth/VerifyOtp";
import Register from "./pages/auth/Register";

// --- 2. 온보딩 (onboarding) ---
import LinkMyData from "./pages/onboarding/LinkMyData";
import Survey from "./pages/onboarding/Survey";

// --- 3. 메인 앱 (app) ---
// 3a. 월렛 (app/wallet)
import Wallet from "./pages/app/wallet/Wallet";
import RegisterCards from "./pages/app/wallet/RegisterCards";
import VerifyCard from "./pages/app/wallet/VerifyCard";

// 3b. 챗봇 (app/chat)
import Chat from "./pages/app/chat/Chat";

// 3c. '전체' 메뉴 (app/all)
import Analysis from "./pages/app/all/Analysis";
import SpendingDetail from "./pages/app/all/SpendingDetail";
import AnalysisLoading from "./pages/app/all/AnalysisLoading";
import CardPerformance from "./pages/app/all/CardPerformance";

// 3d. 사용자 (app/user)
import MyPage from "./pages/app/user/MyPage";

import NotificationPage from "./pages/app/notification/NotificationPage";

// --- 4. 공용 페이지 (shared) ---
import Recommendations from "./pages/shared/Recommendations";
import CardDetail from "./pages/shared/CardDetail";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* ... (Splash, Login 등 기존 인증 라우트) ... */}
          <Route path="/" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/register" element={<Register />} />
          <Route path="/link-mydata" element={<LinkMyData />} />
          <Route path="/survey" element={<Survey />} />
          
          {/* --- [수정됨] --- */}
          {/* 2. 새 라우트 추가 */}
          <Route path="/analysis-loading" element={<AnalysisLoading />} />
          {/* --- [수정 완료] --- */}

          <Route path="/recommendations" element={<Recommendations />} />

          {/* 메인 앱 플로우 (하단 탭바 레이아웃 적용) */}
          <Route path="/app" element={<MainLayout />}>
            <Route index element={<Navigate to="wallet" replace />} />
            <Route path="chat" element={<Chat />} />
            <Route path="wallet" element={<Wallet />} />
            <Route path="wallet/add" element={<RegisterCards />} />
            <Route path="wallet/verify" element={<VerifyCard />} />
            
            <Route path="analysis" element={<Analysis />} />
            <Route path="mypage" element={<MyPage />} /> {/* 2. 마이페이지 라우트 추가 */}
            <Route path="analysis/detail" element={<SpendingDetail />} />
            <Route path="performance" element={<CardPerformance />} />

            <Route path="card/:cardId" element={<CardDetail />} />
            {/* 주소: /app/notifications */}
            <Route path="notifications" element={<NotificationPage />} />
          </Route>

          {/* CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;