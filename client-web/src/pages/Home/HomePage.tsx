import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Header from "./Header";
import LoginModal from "./LoginModal";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PATH from "@/constants/path";
import { IconPlus, IconEdit, IconTrash } from "@tabler/icons-react";

// 분리된 selector 함수 사용
import { useAuthUser, useAuthStore } from "@/store/authStore";
import {
  useJourneysList,
  useJourneysLoading,
  useJourneyStore,
} from "@/store/journeyStore";
import { useLoginModalState, useUIStore } from "@/store/uiStore";

export default function HomePage() {
  // Zustand 스토어에서 상태와 액션 가져오기 (selector 함수 사용)
  const user = useAuthUser();
  const journeys = useJourneysList();
  const isLoadingJourneys = useJourneysLoading();
  const isLoginModalOpen = useLoginModalState();

  // 액션 함수들
  const { fetchUser } = useAuthStore();
  const { loadJourneys } = useJourneyStore();
  const { openLoginModal, closeLoginModal } = useUIStore();
  const logout = useAuthStore((state) => state.logout);

  const navigate = useNavigate();

  // 페이지 로드 시 사용자 정보와 Journey 목록 로드
  useEffect(() => {
    const initialize = async () => {
      // 사용자 정보 로드
      await fetchUser();

      // Journey 목록 로드
      await loadJourneys();
    };

    initialize();
  }, [fetchUser, loadJourneys]);

  // Card 클릭 시 Journey 페이지로 이동
  const handleCardClick = (journeyId: string) => {
    navigate(`${PATH.JOURNEY}/${journeyId}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 상단 Header: user, onClickLogin, onClickLogout 전달 */}
      <Header
        user={user}
        onClickLogin={openLoginModal}
        onClickLogout={logout}
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">All Journeys</h2>

            <Button size="sm">
              <IconPlus className="mr-1 h-4 w-4" />
              New Journey
            </Button>
          </div>

          {isLoadingJourneys ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : journeys.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                아직 Journey가 없습니다.
              </p>
              <Button>
                <IconPlus className="mr-1" />첫 번째 Journey 만들기
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {journeys.map((journey) => (
                <Card
                  key={journey.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleCardClick(journey.id)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle>{journey.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground">
                      {journey.description || "No description"}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 pt-0">
                    <Button variant="ghost" size="sm" title="Edit">
                      <IconEdit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Delete"
                      className="text-destructive hover:text-destructive"
                    >
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </main>

        {/* 우측 사이드바 */}
        <aside className="hidden lg:flex flex-col w-64 border-l border-border p-4"></aside>
      </div>

      {/* 로그인 모달 */}
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
    </div>
  );
}
