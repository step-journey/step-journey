import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import Header from "./Header";
import LoginModal from "@/features/auth/components/LoginModal";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import PATH from "@/constants/path";
import { IconPlus, IconEdit, IconTrash, IconCopy } from "@tabler/icons-react";

// React Query 훅 사용
import { useUser, useLogout } from "@/features/auth/hooks/useAuth";
import { useJourneys } from "@/features/journey/hooks/useJourneys";
import { useLoginModalState, useUIStore } from "@/store/uiStore";
import {
  getJourneyDescription,
  getJourneyTitle,
  isJourneyBlock,
  Block,
  BlockType,
} from "@/features/block/types";
import { v4 as uuidv4 } from "uuid";
import {
  createBlock,
  deleteBlock,
  duplicateJourney,
} from "@/features/block/services/blockService";
import { toast } from "sonner";

export default function HomePage() {
  // React Query 훅 사용
  const { data: user, isLoading: isLoadingUser } = useUser();
  const {
    data: journeyBlocks,
    isLoading: isLoadingJourneys,
    refetch,
  } = useJourneys();
  const { mutate: logout } = useLogout();

  // UI 상태
  const isLoginModalOpen = useLoginModalState();
  const { openLoginModal, closeLoginModal } = useUIStore();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [newJourneyTitle, setNewJourneyTitle] = useState("");
  const [newJourneyDesc, setNewJourneyDesc] = useState("");

  const navigate = useNavigate();

  // Card 클릭 시 Journey 페이지로 이동
  const handleCardClick = (journeyId: string) => {
    navigate(`${PATH.JOURNEY}/${journeyId}`);
  };

  // 새 여정 생성
  const handleCreateJourney = async () => {
    if (!newJourneyTitle.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }

    try {
      // 1. 여정 ID 생성
      const journeyId = uuidv4();

      // 2. 기본 여정 생성 - 타입 명시
      const newJourney: Partial<Block> = {
        id: journeyId,
        type: BlockType.JOURNEY, // 문자열이 아닌 열거형 사용
        content: [] as string[],
        createdBy: "user",
        properties: {
          title: newJourneyTitle,
          description: newJourneyDesc,
        },
      };

      // 3. 기본 그룹 생성 - 타입 명시
      const groupId = uuidv4();
      const newGroup: Partial<Block> = {
        id: groupId,
        type: BlockType.STEP_GROUP, // 문자열이 아닌 열거형 사용
        parentId: journeyId,
        content: [] as string[],
        createdBy: "user",
        properties: {
          title: "기본 그룹",
        },
      };

      // 4. 기본 스텝 생성 - 타입 명시
      const stepId = uuidv4();
      const newStep: Partial<Block> = {
        id: stepId,
        type: BlockType.STEP, // 문자열이 아닌 열거형 사용
        parentId: groupId,
        content: [] as string[],
        createdBy: "user",
        properties: {
          title: "시작하기",
          desc: "첫 번째 단계입니다.",
          content: ["여기에 내용을 작성해보세요!"],
          stepIdInGroup: 1,
        },
      };

      // 5. 여정에 그룹 추가, 그룹에 스텝 추가
      newJourney.content = [groupId];
      newGroup.content = [stepId];

      // 6. DB에 저장
      await createBlock(newJourney);
      await createBlock(newGroup);
      await createBlock(newStep);

      // 상태 초기화 및 다이얼로그 닫기
      setNewJourneyTitle("");
      setNewJourneyDesc("");
      setIsCreateDialogOpen(false);

      // 리스트 새로고침
      await refetch();

      // 생성한 여정으로 이동
      navigate(`${PATH.JOURNEY}/${journeyId}`);

      toast.success("새 여정이 생성되었습니다.");
    } catch (error) {
      console.error("Failed to create journey:", error);
      toast.error("여정 생성에 실패했습니다.");
    }
  };

  // 여정 삭제
  const handleDeleteJourney = async () => {
    if (!deleteTargetId) return;

    try {
      // 관련된 그룹과 스텝을 모두 찾아서 삭제해야 함
      if (journeyBlocks) {
        const journeyBlock = journeyBlocks.find(
          (block) => block.id === deleteTargetId,
        );
        if (journeyBlock) {
          // 그룹 ID들 가져오기
          const groupIds = journeyBlock.content || [];

          // 각 그룹에 속한 스텝 삭제
          for (const groupId of groupIds) {
            await deleteBlock(groupId);
          }

          // 여정 블록 삭제
          await deleteBlock(deleteTargetId);

          // 리스트 새로고침
          await refetch();

          toast.success("여정이 삭제되었습니다.");
        }
      }
    } catch (error) {
      console.error("Failed to delete journey:", error);
      toast.error("여정 삭제에 실패했습니다.");
    }

    setIsDeleteDialogOpen(false);
    setDeleteTargetId(null);
  };

  // 여정 복제
  const handleDuplicateJourney = async (
    journeyId: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();

    try {
      const newJourneyId = await duplicateJourney(journeyId);
      if (newJourneyId) {
        // 리스트 새로고침
        await refetch();
        toast.success("여정이 복제되었습니다.");
      } else {
        toast.error("여정 복제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to duplicate journey:", error);
      toast.error("여정 복제에 실패했습니다.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 상단 Header: user, onClickLogin, onClickLogout 전달 */}
      <Header
        user={user || null}
        onClickLogin={openLoginModal}
        onClickLogout={() => logout()}
        isLoading={isLoadingUser}
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

            <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
              <IconPlus className="mr-1 h-4 w-4" />
              New Journey
            </Button>
          </div>
          {isLoadingJourneys ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : !journeyBlocks || journeyBlocks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                아직 Journey가 없습니다.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <IconPlus className="mr-1" />첫 번째 Journey 만들기
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {journeyBlocks
                .filter((block) => isJourneyBlock(block))
                .map((block) => (
                  <Card
                    key={block.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleCardClick(block.id)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle>{getJourneyTitle(block)}</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="text-sm text-muted-foreground">
                        {getJourneyDescription(block) || "No description"}
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 pt-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="복제"
                        onClick={(e) => handleDuplicateJourney(block.id, e)}
                      >
                        <IconCopy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" title="Edit">
                        <IconEdit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Delete"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTargetId(block.id);
                          setIsDeleteDialogOpen(true);
                        }}
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

      {/* 새 여정 생성 다이얼로그 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>새 Journey 만들기</DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <div>
              <label
                htmlFor="journey-title"
                className="text-sm font-medium block mb-1"
              >
                제목
              </label>
              <Input
                id="journey-title"
                value={newJourneyTitle}
                onChange={(e) => setNewJourneyTitle(e.target.value)}
                placeholder="여정 제목"
              />
            </div>

            <div>
              <label
                htmlFor="journey-desc"
                className="text-sm font-medium block mb-1"
              >
                설명
              </label>
              <Textarea
                id="journey-desc"
                value={newJourneyDesc}
                onChange={(e) => setNewJourneyDesc(e.target.value)}
                placeholder="여정에 대한 설명을 입력하세요"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">취소</Button>
            </DialogClose>
            <Button onClick={handleCreateJourney}>생성</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 여정 삭제 확인 다이얼로그 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>여정 삭제</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p>
              정말 이 여정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 모든
              그룹과 스텝 데이터가 함께 삭제됩니다.
            </p>
          </div>

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
