import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import PATH from "@/constants/path";
import { IconPlus, IconEdit, IconTrash } from "@tabler/icons-react";

import { useAuthStore } from "@/store/authStore";
import { useJourneyStore } from "@/store/journeyStore";
import { useUIStore } from "@/store/uiStore";
import { initializeDatabase } from "@/services/journeyService";
import { toast } from "sonner";

export default function HomePage() {
  // Zustand 스토어에서 상태와 액션 가져오기
  const { user, fetchUser, logout } = useAuthStore();
  const { journeys, isLoadingJourneys, loadJourneys, deleteCurrentJourney } =
    useJourneyStore();
  const {
    isLoginModalOpen,
    isDeleteModalOpen,
    journeyToDelete,
    openLoginModal,
    closeLoginModal,
    openDeleteModal,
    closeDeleteModal,
  } = useUIStore();

  const [isCreating, setIsCreating] = React.useState(false);

  const navigate = useNavigate();

  // 페이지 로드 시 사용자 정보와 Journey 목록 로드
  useEffect(() => {
    const initialize = async () => {
      // 사용자 정보 로드
      await fetchUser();

      // 데이터베이스 초기화
      await initializeDatabase();

      // Journey 목록 로드
      await loadJourneys();
    };

    initialize();
  }, [fetchUser, loadJourneys]);

  // Journey 생성 및 바로 편집 페이지로 이동
  const handleCreateJourney = async () => {
    try {
      setIsCreating(true);

      // 새 Journey ID 생성
      const newJourneyId = uuidv4();

      // Journey 스토어 사용 방식으로 변경 필요
      await initializeDatabase();
      await loadJourneys();

      // 생성 후 바로 편집 모드로 이동
      navigate(`${PATH.JOURNEY}/${newJourneyId}/edit`);
    } catch (error) {
      console.error("Failed to create journey:", error);
      toast.error("Journey 생성 중 오류가 발생했습니다.");
    } finally {
      setIsCreating(false);
    }
  };

  // Journey 편집 페이지로 이동
  const handleEditJourney = (journeyId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // 카드 클릭 이벤트 방지
    navigate(`${PATH.JOURNEY}/${journeyId}/edit`);
  };

  // Journey 삭제 확인 모달 열기
  const handleDeleteConfirm = (journeyId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // 카드 클릭 이벤트 방지
    openDeleteModal(journeyId);
  };

  // Journey 삭제 처리
  const handleDeleteJourney = async () => {
    if (!journeyToDelete) return;

    try {
      await deleteCurrentJourney();
      closeDeleteModal();
    } catch (error) {
      console.error("Failed to delete journey:", error);
      toast.error("Journey 삭제 중 오류가 발생했습니다.");
    }
  };

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

            <Button
              onClick={handleCreateJourney}
              size="sm"
              disabled={isCreating}
            >
              {isCreating ? (
                "생성 중..."
              ) : (
                <>
                  <IconPlus className="mr-1 h-4 w-4" />
                  New Journey
                </>
              )}
            </Button>
          </div>

          {isLoadingJourneys ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : journeys.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                아직 Journey가 없습니다.
              </p>
              <Button onClick={handleCreateJourney} disabled={isCreating}>
                {isCreating ? (
                  "생성 중..."
                ) : (
                  <>
                    <IconPlus className="mr-1" />첫 번째 Journey 만들기
                  </>
                )}
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleEditJourney(journey.id, e)}
                      title="Edit"
                    >
                      <IconEdit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteConfirm(journey.id, e)}
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

      {/* 삭제 확인 모달 */}
      <Dialog open={isDeleteModalOpen} onOpenChange={closeDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Journey 삭제</DialogTitle>
          </DialogHeader>

          <p className="py-4">
            정말 해당 Journey를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </p>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">취소</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDeleteJourney}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
