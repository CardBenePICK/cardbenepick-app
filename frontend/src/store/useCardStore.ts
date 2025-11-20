import { create } from 'zustand';
import { fetchWithAuth } from '@/lib/api'; // [추가]
// (신규) '내 지갑' 카드 목록
// // - cards (등록된 카드 목록)
// - fetchCards() (API 호출)
// - addCard()
// - removeCard()


// 백엔드 AssetResponse 스키마와 일치
export interface Asset {
  asset_id: number;
  institution_name: string;    // 카드사명 (예: 신한카드)
  external_account_id: string; // 카드 ID (예: 13)
  external_account_name: string | null; // 카드 상품명
  asset_type: string;
  created_at: string;
}

interface CardState {
  assets: Asset[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAssets: () => Promise<void>;
  removeAsset: (assetId: number) => Promise<void>;
  clearAssets: () => void; // 로그아웃 시 초기화
}

export const useCardStore = create<CardState>((set, get) => ({
  assets: [],
  isLoading: false,
  error: null,

  fetchAssets: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      if (!token) return; // 로그아웃 상태면 패스
      const response = await fetchWithAuth('http://localhost:8080/api/assets/');


      if (!response.ok) throw new Error('자산 목록을 불러오는데 실패했습니다.');
      
      const data = await response.json();
      set({ assets: data });
    } catch (error: any) {
      console.error(error);
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  removeAsset: async (assetId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/assets/${assetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('연동 해제에 실패했습니다.');

      // 성공 시 로컬 상태에서도 즉시 제거 (낙관적 업데이트)
      set((state) => ({
        assets: state.assets.filter((asset) => asset.asset_id !== assetId)
      }));
    } catch (error: any) {
      console.error(error);
      throw error; // UI에서 에러 처리를 할 수 있게 던짐
    }
  },

  clearAssets: () => set({ assets: [], error: null })
}));