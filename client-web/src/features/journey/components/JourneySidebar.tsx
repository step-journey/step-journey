import {
  IconSearch,
  IconHome,
  IconPlus,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Block,
  BlockType,
  JourneyBlock,
  isJourneyBlock,
  StepContainerMap,
  isStepBlock,
} from "@/features/block/types";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { BlockRenderer, RenderingArea } from "@/features/block/renderers";
import { useIsEditMode } from "@/features/block/store/editorStore";
import {
  createBlock,
  updateBlock,
  deleteBlock,
} from "@/features/block/services/blockService";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

interface Props {
  journeyBlock: Block;
  allBlocks: Block[];
  stepContainerRefs?: React.RefObject<StepContainerMap>;
  onNavigateHome?: () => void;
  onRefetch?: () => void;
}

export function JourneySidebar({
  journeyBlock,
  allBlocks,
  onNavigateHome,
  onRefetch,
}: Props) {
  const isEditMode = useIsEditMode();
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{
    id: string;
    type: string;
    name: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    type: string;
  } | null>(null);
  const [newName, setNewName] = useState("");

  // 타입 가드 확인
  if (!isJourneyBlock(journeyBlock)) {
    return (
      <aside className="flex flex-col border-r border-gray-200 bg-white w-[280px]">
        <div className="p-4">Not a valid journey block</div>
      </aside>
    );
  }

  // 타입 안전한 접근을 위해 타입 캐스팅
  const typedJourneyBlock = journeyBlock as JourneyBlock;

  // 여정에 포함된 스텝 그룹 블록들 가져오기
  const stepGroupBlocks = typedJourneyBlock.content
    .map((id: string) => allBlocks.find((block) => block.id === id))
    .filter(
      (block: Block | undefined) =>
        block && block.type === BlockType.STEP_GROUP,
    ) as Block[];

  // 새 그룹 추가
  const handleAddGroup = async () => {
    // 새로운 그룹 ID 생성
    const newGroupId = uuidv4();

    // 새 그룹 블록 생성
    const newGroupBlock: Partial<Block> = {
      id: newGroupId,
      type: BlockType.STEP_GROUP,
      parentId: journeyBlock.id,
      content: [] as string[],
      createdBy: "user",
      properties: {
        title: "새 그룹",
      },
    };

    await createBlock(newGroupBlock);

    // 부모 Journey 블록의 content에 새 그룹 추가
    const updatedJourneyBlock = {
      ...journeyBlock,
      content: [...journeyBlock.content, newGroupId],
    };

    await updateBlock(updatedJourneyBlock);

    // 데이터 새로고침
    if (onRefetch) {
      onRefetch();
    }

    toast.success("새 그룹이 추가되었습니다.");
  };

  // 그룹에 새 스텝 추가
  const handleAddStepToGroup = async (groupId: string, groupBlock: Block) => {
    // 새로운 스텝 ID 생성
    const newStepId = uuidv4();

    // 안전하게 stepIdInGroup 찾기
    const stepBlocks = groupBlock.content
      .map((id) => allBlocks.find((b) => b.id === id))
      .filter((b): b is Block => !!b && b.type === BlockType.STEP);

    // 타입이 STEP인 블록들만 가져와서 stepIdInGroup을 안전하게 접근
    const maxStepId =
      stepBlocks.length > 0
        ? Math.max(
            ...stepBlocks.map((b) => {
              if (isStepBlock(b)) {
                return b.properties.stepIdInGroup || 0;
              }
              return 0;
            }),
          )
        : 0;

    const stepIdInGroup = maxStepId + 1;

    // 새 스텝 블록 생성
    const newStepBlock: Partial<Block> = {
      id: newStepId,
      type: BlockType.STEP,
      parentId: groupId,
      content: [] as string[],
      createdBy: "user",
      properties: {
        title: "새 스텝",
        content: ["내용을 입력하세요"],
        stepIdInGroup: stepIdInGroup,
      },
    };

    await createBlock(newStepBlock);

    // 부모 Group 블록의 content에 새 스텝 추가
    const updatedGroupBlock = {
      ...groupBlock,
      content: [...groupBlock.content, newStepId],
    };

    await updateBlock(updatedGroupBlock);

    // 데이터 새로고침
    if (onRefetch) {
      onRefetch();
    }

    toast.success("새 스텝이 추가되었습니다.");
  };

  // 블록의 속성에 안전하게 접근하는 함수
  const getStepGroupTitle = (block: Block): string => {
    if (block.type === BlockType.STEP_GROUP) {
      return (block.properties as any).title || "Untitled Group";
    }
    return "Untitled Group";
  };

  // 이름 변경 다이얼로그 열기
  const openRenameDialog = (id: string, type: string, currentName: string) => {
    setRenameTarget({ id, type, name: currentName });
    setNewName(currentName);
    setIsRenameDialogOpen(true);
  };

  // 이름 변경 처리
  const handleRename = async () => {
    if (!renameTarget || !newName.trim()) return;

    try {
      const blockToUpdate = allBlocks.find((b) => b.id === renameTarget.id);
      if (!blockToUpdate) throw new Error("블록을 찾을 수 없습니다.");

      const updatedBlock = {
        ...blockToUpdate,
        properties: {
          ...blockToUpdate.properties,
          ...(renameTarget.type === "journey"
            ? { title: newName }
            : renameTarget.type === "group"
              ? { title: newName }
              : { label: newName }),
        },
      };

      await updateBlock(updatedBlock);

      // 데이터 새로고침
      if (onRefetch) {
        onRefetch();
      }

      toast.success("이름이 변경되었습니다.");
      setIsRenameDialogOpen(false);
    } catch (error) {
      console.error("Failed to rename:", error);
      toast.error("이름 변경에 실패했습니다.");
    }
  };

  // 삭제 다이얼로그 열기
  const openDeleteDialog = (id: string, type: string) => {
    setDeleteTarget({ id, type });
    setIsDeleteDialogOpen(true);
  };

  // 삭제 처리
  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === "journey") {
        // Journey 삭제는 홈으로 리디렉션이 필요하므로 구현하지 않음
        toast.error("여정 삭제는 홈 페이지에서 가능합니다.");
        setIsDeleteDialogOpen(false);
        return;
      }

      const blockToDelete = allBlocks.find((b) => b.id === deleteTarget.id);
      if (!blockToDelete) throw new Error("블록을 찾을 수 없습니다.");

      // 부모 블록에서 해당 ID 제거
      const parentBlock = allBlocks.find(
        (b) => b.id === blockToDelete.parentId,
      );
      if (parentBlock) {
        const updatedParent = {
          ...parentBlock,
          content: parentBlock.content.filter((id) => id !== deleteTarget.id),
        };
        await updateBlock(updatedParent);
      }

      // 블록 삭제
      await deleteBlock(deleteTarget.id);

      // 스텝 그룹인 경우 하위 스텝들도 삭제
      if (deleteTarget.type === "group") {
        const childSteps = allBlocks.filter(
          (b) => b.parentId === deleteTarget.id,
        );
        for (const step of childSteps) {
          await deleteBlock(step.id);
        }
      }

      // 데이터 새로고침
      if (onRefetch) {
        onRefetch();
      }

      toast.success(
        `${deleteTarget.type === "group" ? "그룹" : "스텝"}이 삭제되었습니다.`,
      );
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error("삭제에 실패했습니다.");
    }
  };

  return (
    <aside className="flex flex-col border-r border-gray-200 bg-white w-[280px]">
      {/* 상단: 제목 + 검색창 */}
      <div className="shrink-0 p-4 pb-2">
        <div className="flex justify-between items-center mb-3">
          <BlockRenderer
            block={typedJourneyBlock}
            area={RenderingArea.SIDEBAR}
          />

          {isEditMode && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() =>
                  openRenameDialog(
                    journeyBlock.id,
                    "journey",
                    journeyBlock.properties.title || "Untitled Journey",
                  )
                }
              >
                <IconEdit size={16} />
              </Button>
            </div>
          )}
        </div>

        {/* 검색창 */}
        <div className="relative">
          <IconSearch
            size={16}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <Input
            type="text"
            placeholder="Search"
            className="pl-7 pr-2 py-1 text-sm w-full border-gray-200 bg-gray-50"
          />
        </div>

        {/* 편집 모드일 때 그룹 추가 버튼 */}
        {isEditMode && (
          <Button
            className="w-full mt-2"
            size="sm"
            variant="outline"
            onClick={handleAddGroup}
          >
            <IconPlus size={16} className="mr-1" />
            그룹 추가
          </Button>
        )}
      </div>

      {/* 단계 목록 스크롤 영역 */}
      <ScrollArea className="flex-1 py-2 pl-4 pr-1">
        {stepGroupBlocks.map((groupBlock) => (
          <div key={groupBlock.id} className="mb-3">
            <div className="flex justify-between items-center">
              <BlockRenderer block={groupBlock} area={RenderingArea.SIDEBAR} />

              {isEditMode && (
                <div className="flex gap-1 mr-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() =>
                      openRenameDialog(
                        groupBlock.id,
                        "group",
                        getStepGroupTitle(groupBlock),
                      )
                    }
                  >
                    <IconEdit size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-500"
                    onClick={() => openDeleteDialog(groupBlock.id, "group")}
                  >
                    <IconTrash size={14} />
                  </Button>
                </div>
              )}
            </div>

            {/* 편집 모드일 때 스텝 추가 버튼 */}
            {isEditMode && (
              <Button
                className="ml-5 mt-1 w-[calc(100%-20px)]"
                size="sm"
                variant="ghost"
                onClick={() => handleAddStepToGroup(groupBlock.id, groupBlock)}
              >
                <IconPlus size={14} className="mr-1" />
                스텝 추가
              </Button>
            )}
          </div>
        ))}
      </ScrollArea>

      {/* 최하단 홈 아이콘 - 스크롤 영역 밖에 배치하여 항상 보이도록 함 */}
      <div className="p-2 mt-auto flex justify-end">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-800"
          onClick={onNavigateHome}
          title="홈으로 돌아가기"
        >
          <IconHome size={18} />
        </Button>
      </div>

      {/* 이름 변경 다이얼로그 */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {renameTarget?.type === "journey"
                ? "여정"
                : renameTarget?.type === "group"
                  ? "그룹"
                  : "스텝"}{" "}
              이름 변경
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full"
              placeholder="새 이름 입력"
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">취소</Button>
            </DialogClose>
            <Button onClick={handleRename}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {deleteTarget?.type === "journey"
                ? "여정"
                : deleteTarget?.type === "group"
                  ? "그룹"
                  : "스텝"}{" "}
              삭제
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p>
              정말
              {deleteTarget?.type === "journey"
                ? "여정"
                : deleteTarget?.type === "group"
                  ? "그룹"
                  : "스텝"}
              을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            {deleteTarget?.type === "group" && (
              <p className="mt-2 text-red-500">
                그룹을 삭제하면 해당 그룹의 모든 스텝도 함께 삭제됩니다.
              </p>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">취소</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
