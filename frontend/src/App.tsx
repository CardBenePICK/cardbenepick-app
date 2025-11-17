import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

// 레이아웃 및 페이지 임포트
import MainLayout from "./components/MainLayout";
import Splash from "./pages/Splash";
import Login from "./pages/Login";
import VerifyOtp from "./pages/VerifyOtp";
import Register from "./pages/Register";
import LinkMyData from "./pages/LinkMyData";
import RegisterCards from "./pages/RegisterCards";
import Wallet from "./pages/Wallet";
import Chat from "./pages/Chat";

// --- [수정됨] ---
import Analysis from "./pages/Analysis";
import SpendingDetail from "./pages/SpendingDetail";
import AnalysisLoading from "./pages/AnalysisLoading"; // 1. 새 분석 로딩 페이지 임포트
// --- [수정 완료] ---

import CardPerformance from "./pages/CardPerformance";
import Survey from "./pages/Survey";
import Recommendations from "./pages/Recommendations";
import CardDetail from "./pages/CardDetail";
import NotFound from "./pages/NotFound";
import VerifyCard from "./pages/VerifyCard"; 

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
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
            <Route path="analysis/detail" element={<SpendingDetail />} />
            <Route path="performance" element={<CardPerformance />} />

            <Route path="card/:cardId" element={<CardDetail />} />
          </Route>

          {/* CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;