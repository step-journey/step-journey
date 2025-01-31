import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import LoginModal from "./LoginModal";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import PATH from "@/constants/path";

export default function HomePage() {
  // 로그인 모달 열림 여부
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // 모달 열고 닫는 함수
  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  // 페이지 이동용 훅
  const navigate = useNavigate();

  // Card 클릭 시 이동
  const handleCardClick = () => {
    navigate(PATH.JOURNEY);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 상단 Header */}
      <Header onClickLogin={openLoginModal} />

      {/* 기존 3-컬럼 구조 */}
      <div className="flex flex-1 bg-background text-foreground">
        {/* 좌측 사이드바 (기존 내용 그대로) */}
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
          {/* 추후 이곳에 메인 피드/게시물 목록이 들어갈 예정 */}

          <Card
            className="cursor-pointer max-w-xs mb-4"
            onClick={handleCardClick}
          >
            <CardHeader>
              <CardTitle>Google Search Journey</CardTitle>
            </CardHeader>
            <CardContent>구글 검색 처리 과정</CardContent>
          </Card>

          {/* 여기에 다른 본문 내용(게시물 목록 등) 추가 가능 */}
        </main>

        {/* 우측 사이드바 */}
        <aside className="hidden lg:flex flex-col w-64 border-l border-border p-4">
          {/* 우측 광고/추천/인기글 등 공간 */}
        </aside>
      </div>

      {/* 로그인 모달 */}
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
    </div>
  );
}
