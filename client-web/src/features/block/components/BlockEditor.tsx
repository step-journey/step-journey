import { useEffect, useState, useMemo, useRef } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@/styles/text-editor.css";
import { Block, JourneyBlock, StepBlock } from "@/features/block/types";
import { saveBlockNoteContent } from "@/features/block/services/blockService";
import { useAllBlocks } from "@/features/block/store/blockStore";
import { toast } from "sonner";
import { getBlockNoteBlocksFromStep } from "@/features/block/utils/blockNoteConverter";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";

// Journey 데이터 타입 정의
interface JourneyData {
  journeyBlock: JourneyBlock | null;
  flattenedSteps: StepBlock[];
  allBlocks: Block[];
}

interface BlockEditorProps {
  block: StepBlock;
  onSave?: () => void;
  readOnly?: boolean;
}

export function BlockEditor({
  block,
  onSave,
  readOnly = false,
}: BlockEditorProps) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const allBlocks = useAllBlocks();
  const queryClient = useQueryClient();

  // 마지막 저장된 내용을 참조로 저장
  const lastSavedContentRef = useRef<string>("");

  // 저장 중인지 추적
  const isSavingRef = useRef<boolean>(false);

  // rootJourneyId 추출 - 상위 Journey ID를 찾아 캐시 무효화에 사용
  const rootJourneyId = useMemo(() => {
    // block.parentId는 StepGroup의 ID
    // StepGroup의 parentId는 Journey의 ID
    const stepGroupBlock = allBlocks.find((b) => b.id === block.parentId);
    return stepGroupBlock?.parentId; // Journey ID
  }, [block.parentId, allBlocks]);

  // BlockNote에 필요한 초기 콘텐츠를 useMemo로 최적화
  const initialContent = useMemo(() => {
    return getBlockNoteBlocksFromStep(block, allBlocks);
  }, [block.id, block.updatedAt, allBlocks]);

  // 에디터 인스턴스 생성
  const editor = useCreateBlockNote({
    initialContent,
  });

  // 자동 저장 타이머
  useEffect(() => {
    if (readOnly) return;

    const saveInterval = setInterval(async () => {
      try {
        // 이미 저장 중이면 건너뜁니다
        if (isSavingRef.current) return;

        // BlockNote 에디터의 현재 최상위 블록들 가져오기
        const topLevelBlocks = editor.document;

        // 현재 콘텐츠를 JSON 문자열로 변환하여 비교
        const currentContent = JSON.stringify(topLevelBlocks);

        // 마지막 저장 내용과 같으면 건너뜁니다
        if (currentContent === lastSavedContentRef.current) return;

        // 저장 중 플래그 설정
        isSavingRef.current = true;

        // 저장 로직
        await saveBlockNoteContent(block, topLevelBlocks);

        // 저장 성공 후 상태 업데이트
        setLastSaved(new Date());
        lastSavedContentRef.current = currentContent;

        // 변경 사항 저장 후 관련 Journey 쿼리 무효화를 제한적으로 수행
        if (rootJourneyId) {
          queryClient.setQueryData(
            QUERY_KEYS.journeys.detail(rootJourneyId),
            (oldData: JourneyData | undefined) => {
              if (!oldData) return oldData;

              // 기존 데이터 구조를 유지하면서 allBlocks만 업데이트
              return {
                ...oldData,
                allBlocks: [...allBlocks],
              };
            },
          );
        }

        // 사용자 콜백 호출
        if (onSave) {
          onSave();
        }
      } catch (error) {
        console.error("Failed to save editor content:", error);
        toast.error("내용 저장에 실패했습니다.");
      } finally {
        // 저장 완료 플래그 설정
        isSavingRef.current = false;
      }
    }, 2000); // 2초마다 변경사항 확인 및 저장

    return () => clearInterval(saveInterval);
  }, [editor, block, onSave, readOnly, queryClient, rootJourneyId, allBlocks]);

  return (
    <div className="editor-container">
      <BlockNoteView
        editor={editor}
        editable={!readOnly}
        className="min-h-[200px] border rounded-md overflow-auto"
      />
      {lastSaved && !readOnly && (
        <div className="text-xs text-gray-400 mt-1 text-right">
          마지막 저장: {lastSaved.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
