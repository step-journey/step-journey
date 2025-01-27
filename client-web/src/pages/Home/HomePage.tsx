import { useState } from "react";
import Header from "./Header";
import LoginModal from "./LoginModal";

/**
 * 메인화면 (Reddit 메인화면과 유사한 3-컬럼 구조)
 * 좌측 사이드바 / 중앙 본문 / 우측 사이드바
 * 안의 컨텐츠는 비어있는 상태로만 두었습니다.
 */
export default function HomePage() {
  // 로그인 모달 열림 여부
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // 로그인 모달 열기/닫기 함수
  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  return (
    <div className="flex flex-col min-h-screen">
      {/* 상단 Header */}
      <Header onClickLogin={openLoginModal} />

      {/* 본문 3-컬럼: 좌/중앙/우 */}
      <div className="flex flex-1 bg-background text-foreground">
        {/* 좌측 사이드바 (예: Reddit의 Home/Popular/Explore...) */}
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

        {/* 중앙 본문 (현재는 비어있는 상태) */}
        <main className="flex-1 p-4">
          {/* 추후 이곳에 메인 피드/게시물 목록이 들어갈 예정 */}
        </main>

        {/* 우측 사이드바 (현재는 비어있는 상태) */}
        <aside className="hidden lg:flex flex-col w-64 border-l border-border p-4">
          {/* 예: Reddit의 광고, 추천, 인기글, 커뮤니티 정보 등 */}
        </aside>
      </div>

      {/* 로그인 모달 */}
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
    </div>
  );
}
