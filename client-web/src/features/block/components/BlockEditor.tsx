import { useEffect, useState, useMemo } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@/styles/text-editor.css";
import { StepBlock } from "@/features/block/types";
import { saveBlockNoteContent } from "@/features/block/services/blockService";
import { useAllBlocks } from "@/features/block/store/blockStore";
import { toast } from "sonner";
import { getBlockNoteBlocksFromStep } from "@/features/block/utils/blockNoteConverter";
import { useQueryClient } from "@tanstack/react-query"; // 추가
import { QUERY_KEYS } from "@/constants/queryKeys"; // 추가

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
  const queryClient = useQueryClient(); // 추가: queryClient 가져오기

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
  }, [block.id, block.updatedAt, allBlocks]); // 의존성 배열 개선

  // 에디터 인스턴스 생성 - block.id를 의존성으로 추가하여 재생성 보장
  const editor = useCreateBlockNote({
    initialContent,
  });

  // 자동 저장 타이머
  useEffect(() => {
    if (readOnly) return;

    const saveInterval = setInterval(async () => {
      try {
        // BlockNote 에디터의 현재 최상위 블록들 가져오기
        const topLevelBlocks = editor.document;

        // 중요: 여기서는 에디터 내용이 변경됐는지 체크하지 않고 매번 저장
        // 저장 로직
        await saveBlockNoteContent(block, topLevelBlocks);
        setLastSaved(new Date());

        // 변경 사항 저장 후 관련 Journey 쿼리 무효화 (추가)
        if (rootJourneyId) {
          await queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.journeys.detail(rootJourneyId),
          });
        }

        // 사용자 콜백 호출
        if (onSave) {
          onSave();
        }
      } catch (error) {
        console.error("Failed to save editor content:", error);
        toast.error("내용 저장에 실패했습니다.");
      }
    }, 1000); // 1초마다 저장

    return () => clearInterval(saveInterval);
  }, [editor, block, onSave, readOnly, queryClient, rootJourneyId]);

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
