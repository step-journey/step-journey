import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "./Header";
import LoginModal from "./LoginModal";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import PATH from "@/constants/path";

import { useUserQuery, useLogoutMutation } from "@/hooks/useAuth";

export default function HomePage() {
  // 로그인 모달 열림 여부
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // TanStack Query
  // 1) useUserQuery: 유저 정보를 불러옴 (없으면 null)
  // 2) useLogoutMutation: 로그아웃 처리
  const { data: user } = useUserQuery();
  const logoutMutation = useLogoutMutation();

  const navigate = useNavigate();

  // 로그인 모달 열고 닫기
  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  // 로그아웃
  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Card 클릭 시 Journey 페이지로 이동
  const handleCardClick = () => {
    navigate(PATH.JOURNEY);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 상단 Header: user, onClickLogin, onClickLogout 전달 */}
      <Header
        // user는 (User | null | undefined)이므로, undefined 인 경우 null 로 대체
        user={user ?? null}
        onClickLogin={openLoginModal}
        onClickLogout={handleLogout}
      />

      {/* 메인 레이아웃 (좌 사이드바 - 중앙 본문 - 우 사이드바) */}
      <div className="flex flex-1 bg-background text-foreground">
        {/* 좌측 사이드바 */}
        <aside className="hidden md:flex flex-col w-60 border-r border-border p-4">
          <nav className="space-y-4">
            <div className="text-sm font-semibold">Home</div>
            <div className="text-sm font-semibold">Popular</div>
            <div className="text-sm font-semibold">Explore</div>
            <div className="text-sm font-semibold">All</div>

            <hr className="my-2 border-border" />

            <div className="text-xs text-muted-foreground">MODERATION</div>
            <div className="text-sm text-foreground">Mod Queue</div>
            <div className="text-sm text-foreground">Mod Mail</div>
            <div className="text-sm text-foreground">r/Mod</div>

            <hr className="my-2 border-border" />

            <div className="text-xs text-muted-foreground">CUSTOM FEEDS</div>
            <div className="text-sm text-foreground">Create a custom feed</div>

            <hr className="my-2 border-border" />

            <div className="text-xs text-muted-foreground">RECENT</div>
            <div className="text-sm text-foreground">r/logodesign</div>
            <div className="text-sm text-foreground">r/graphic_design</div>
            <div className="text-sm text-foreground">r/golang</div>
            <div className="text-sm text-foreground">r/reppley</div>
          </nav>
        </aside>

        {/* 중앙 본문 */}
        <main className="flex-1 p-4">
          <Card
            className="cursor-pointer max-w-xs mb-4"
            onClick={handleCardClick}
          >
            <CardHeader>
              <CardTitle>Google Search Journey</CardTitle>
            </CardHeader>
            <CardContent>구글 검색 처리 과정</CardContent>
          </Card>
        </main>

        {/* 우측 사이드바 */}
        <aside className="hidden lg:flex flex-col w-64 border-l border-border p-4"></aside>
      </div>

      {/* 로그인 모달 */}
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
    </div>
  );
}
