import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "./Header";
import LoginModal from "./LoginModal";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import PATH from "@/constants/path";

/**
 * 간단한 User 타입 예시. 실제로는 서버 응답에 맞춰 구조를 수정하세요.
 */
interface User {
  name: string;
  email: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function HomePage() {
  // 로그인 모달 열림 여부
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // 유저 정보 (null이면 비로그인 상태)
  const [user, setUser] = useState<User | null>(null);

  const navigate = useNavigate();
  const didFetchUser = useRef(false); // 한 번만 호출하도록 플래그

  // ---------------------------
  // 1) 초기 로딩 시 유저 정보 가져오기
  // ---------------------------
  useEffect(() => {
    if (didFetchUser.current) return;
    didFetchUser.current = true;

    const fetchUser = async () => {
      try {
        const resp = await fetch(`${API_URL}/users/me`, {
          credentials: "include",
        });
        if (resp.ok) {
          const data = await resp.json();
          setUser({
            name: data.name,
            email: data.email,
          });
        } else {
          // 401 등 에러 -> 비로그인 처리
          setUser(null);
        }
      } catch (err) {
        console.error("Failed to fetch user info:", err);
        setUser(null);
      }
    };

    fetchUser();
  }, []);

  // ---------------------------
  // 2) 로그인 / 로그아웃
  // ---------------------------
  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  // 로그아웃 시, 서버의 로그아웃 엔드포인트를 호출하여 쿠키에 설정된 access_token과 refresh_token을 삭제한 후,
  // 클라이언트 상태에서 user를 null로 업데이트합니다.
  const handleLogout = async () => {
    try {
      const resp = await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      if (!resp.ok) {
        console.error("Logout API call failed with status", resp.status);
      }
    } catch (err) {
      console.error("Logout API call failed:", err);
    } finally {
      setUser(null);
    }
  };

  // ---------------------------
  // 3) Card 클릭 시 Journey 이동
  // ---------------------------
  const handleCardClick = () => {
    navigate(PATH.JOURNEY);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 상단 Header: user, onClickLogin, onClickLogout 전달 */}
      <Header
        user={user}
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
