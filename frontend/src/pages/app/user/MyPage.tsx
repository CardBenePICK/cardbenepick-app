import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, LogOut, Trash2, User, Banknote, CreditCard, ChevronRight, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// API 응답 타입 (가상)
interface UserInfo {
  user_name: string;
  phone_number: string;
  birth_date: string;
  telecom: string;
}
// asset_type != 'card' (마이데이터로 연동된 '기관')
interface MyDataInstitution {
  id: number; // user_asset의 asset_id
  institution_name: string;
  external_account_name: string;
}
// asset_type == 'card' (수동 등록한 '카드')
interface RegisteredCard {
  asset_id: number;
  institution_name: string; // 카드사
  external_account_name: string; // 카드명
}

const MyPage = () => {
  const navigate = useNavigate();

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [myDataInstitutions, setMyDataInstitutions] = useState<MyDataInstitution[]>([]);
  const [registeredCards, setRegisteredCards] = useState<RegisteredCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // [임시 목업 데이터] - 실제 API 호출로 대체해야 함
        
        // 1. GET /api/users/me (내 정보)
        const mockUserInfo: UserInfo = {
          user_name: "홍길동",
          phone_number: "010-1234-5678",
          birth_date: "1990-01-01",
          telecom: "SKT",
        };
        
        // 2. GET /api/assets/mydata (마이데이터 연동 기관)
        // (user_asset 테이블에서 asset_type != 'card' 인 항목)
        const mockMyData: MyDataInstitution[] = [
          { asset_id: 101, institution_name: "신한카드", external_account_name: "신한카드(본인)" },
          { asset_id: 102, institution_name: "KB국민카드", external_account_name: "KB국민카드(본인)" },
        ];
        
        // 3. GET /api/assets/cards (수동 등록 카드)
        // (user_asset 테이블에서 asset_type == 'card' 인 항목)
        const mockCards: RegisteredCard[] = [
          { asset_id: 201, institution_name: "삼성카드", external_account_name: "taptap O (직접 등록)" },
        ];
        
        setUserInfo(mockUserInfo);
        setMyDataInstitutions(mockMyData);
        setRegisteredCards(mockCards);

      } catch (error) {
        console.error("Failed to fetch mypage data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    // POST /api/auth/logout
    localStorage.removeItem('userLoggedIn');
    navigate('/login');
  };

  const handleWithdraw = () => {
    // DELETE /api/users/me
    console.log("회원 탈퇴 API 호출");
    localStorage.removeItem('userLoggedIn');
    navigate('/');
  };

  const handleDeleteAsset = (assetId: number, type: 'mydata' | 'card') => {
    // DELETE /api/assets/{assetId}
    console.log(`자산 삭제 API 호출: ${assetId}`);
    
    if (type === 'mydata') {
      setMyDataInstitutions(prev => prev.filter(a => a.asset_id !== assetId));
    } else {
      setRegisteredCards(prev => prev.filter(a => a.asset_id !== assetId));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/app/analysis')} // '전체' 탭으로 돌아가기
          className="mr-3"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">마이페이지</h1>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        
        {/* 내 정보 확인 카드 */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <User className="w-6 h-6 text-primary" />
              <CardTitle>내 정보</CardTitle>
            </div>
            <CardDescription>
              `user_master` 테이블
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="이름" value={userInfo?.user_name} />
            <InfoRow label="휴대폰 번호" value={userInfo?.phone_number} />
            <InfoRow label="생년월일" value={userInfo?.birth_date} />
            <InfoRow label="통신사" value={userInfo?.telecom} />
          </CardContent>
        </Card>
        
        {/* 마이데이터 연동 관리 카드 */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Banknote className="w-6 h-6 text-primary" />
              <CardTitle>마이데이터 연동</CardTitle>
            </div>
             <CardDescription>
              `user_asset` (asset_type != 'card')
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {myDataInstitutions.length > 0 ? myDataInstitutions.map(asset => (
              <AssetRow key={asset.asset_id} asset={asset} onDelete={handleDeleteAsset} type="mydata" />
            )) : (
              <p className="text-sm text-muted-foreground">연동된 카드사가 없습니다.</p>
            )}
            <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/link-mydata')}>
              카드사 추가 연동하기
            </Button>
          </CardContent>
        </Card>
        
        {/* 등록된 카드 관리 카드 */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <CreditCard className="w-6 h-6 text-primary" />
              <CardTitle>등록된 카드</CardTitle>
            </div>
            <CardDescription>
              `user_asset` (asset_type = 'card')
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {registeredCards.length > 0 ? registeredCards.map(asset => (
              <AssetRow key={asset.asset_id} asset={asset} onDelete={handleDeleteAsset} type="card" />
            )) : (
              <p className="text-sm text-muted-foreground">직접 등록한 카드가 없습니다.</p>
            )}
            <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/app/wallet/add')}>
              카드 직접 등록하기
            </Button>
          </CardContent>
        </Card>

        {/* 계정 관리 카드 */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>계정 관리</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full justify-between h-12"
              onClick={handleLogout}
            >
              <span><LogOut className="w-5 h-5 mr-3 inline" />로그아웃</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-between h-12 text-destructive hover:text-destructive"
                >
                  <span><Trash2 className="w-5 h-5 mr-3 inline" />회원 탈퇴</span>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>정말 탈퇴하시겠습니까?</AlertDialogTitle>
                  <AlertDialogDescription>
                    모든 자산 정보와 소비 분석 내역이 삭제되며, 복구할 수 없습니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction onClick={handleWithdraw} className="bg-destructive hover:bg-destructive/90">
                    탈퇴하기
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// 공용 컴포넌트
const InfoRow = ({ label, value }: { label: string; value?: string }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{value || '-'}</span>
  </div>
);

const AssetRow = ({ asset, onDelete, type }: { asset: MyDataInstitution | RegisteredCard; onDelete: (id: number, type: 'mydata' | 'card') => void; type: 'mydata' | 'card' }) => (
  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
    <div className="flex-1">
      <p className="font-medium text-sm">{asset.external_account_name}</p>
      <p className="text-xs text-muted-foreground">{asset.institution_name}</p>
    </div>
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          {type === 'mydata' ? '연동 해제' : '삭제'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription>
            {`[${asset.institution_name} - ${asset.external_account_name}] 정보를 삭제합니다.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction onClick={() => onDelete(asset.asset_id, type)} className="bg-destructive hover:bg-destructive/90">
            삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
);

export default MyPage;