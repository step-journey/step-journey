import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import PATH from "@/constants/path";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { Block, BlockType, BlockNoteContent } from "@/features/block/types";
import {
  createBlock,
  deleteBlock,
} from "@/features/block/services/blockService";

export function useJourneyActions() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Journey 생성 함수
  const createJourney = async (title: string, description: string) => {
    if (!title.trim()) {
      toast.error("제목을 입력해주세요.");
      return null;
    }

    setIsCreating(true);

    try {
      // 1. ID 생성
      const currentTime = Date.now();
      const journeyId = `${currentTime}-journey-${uuidv4()}`;
      const groupId = `${currentTime}-group-${uuidv4()}`;
      const stepId = `${currentTime}-step-${uuidv4()}`;
      const blockNoteContentId = `${currentTime}-blockNote-${uuidv4()}`;

      // 2. 기본 여정 생성
      const newJourney: Partial<Block> = {
        id: journeyId,
        type: BlockType.JOURNEY,
        content: [] as string[],
        createdBy: "user",
        properties: {
          title,
          description,
        },
      };

      // 3. 기본 Step Group 생성
      const newGroup: Partial<Block> = {
        id: groupId,
        type: BlockType.STEP_GROUP,
        parentId: journeyId,
        content: [] as string[],
        createdBy: "user",
        properties: {
          title: "기본 그룹",
        },
      };

      // 4. 기본 스텝 생성
      const initialText = "여기에 내용을 작성해보세요!";

      // BlockNote 에디터 형식에 맞는 초기 editorContent 생성
      const initialEditorContent: BlockNoteContent = {
        version: "1.0",
        blocks: [
          {
            id: blockNoteContentId,
            type: "paragraph",
            props: {
              textColor: "default",
              backgroundColor: "default",
              textAlignment: "left",
            },
            content: [
              {
                type: "text",
                text: initialText,
                styles: {},
              },
            ],
            children: [],
          },
        ],
      };

      const newStep: Partial<Block> = {
        id: stepId,
        type: BlockType.STEP,
        parentId: groupId,
        content: [] as string[],
        createdBy: "user",
        properties: {
          title: "시작하기",
          content: [initialText],
          stepIdInGroup: 1,
          editorContent: initialEditorContent,
        },
      };

      // 5. 여정에 그룹 추가, 그룹에 스텝 추가
      newJourney.content = [groupId];
      newGroup.content = [stepId];

      // 6. DB에 저장
      await createBlock(newJourney);
      await createBlock(newGroup);
      await createBlock(newStep);

      // 리스트 새로고침
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.journeys.all,
      });

      toast.success("새 여정이 생성되었습니다.");

      return journeyId;
    } catch (error) {
      console.error("Failed to create journey:", error);
      toast.error("여정 생성에 실패했습니다.");
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  // Journey 삭제 함수
  const deleteJourney = async (journeyId: string, journeyBlocks: Block[]) => {
    if (!journeyId) return false;

    setIsDeleting(true);

    try {
      const journeyBlock = journeyBlocks.find(
        (block) => block.id === journeyId,
      );

      if (journeyBlock) {
        // 그룹 ID들 가져오기
        const groupIds = journeyBlock.content || [];

        // 각 그룹에 속한 스텝 삭제
        for (const groupId of groupIds) {
          await deleteBlock(groupId);
        }

        // 여정 블록 삭제
        await deleteBlock(journeyId);

        // 리스트 새로고침
        await queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.journeys.all,
        });

        toast.success("여정이 삭제되었습니다.");
        return true;
      }

      return false;
    } catch (error) {
      console.error("Failed to delete journey:", error);
      toast.error("여정 삭제에 실패했습니다.");
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  // 여정 클릭 시 상세 페이지로 이동
  const navigateToJourney = (journeyId: string) => {
    navigate(`${PATH.JOURNEY}/${journeyId}`);
  };

  return {
    createJourney,
    deleteJourney,
    navigateToJourney,
    isCreating,
    isDeleting,
  };
}
