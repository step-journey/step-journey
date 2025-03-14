import { useEffect, useState, useMemo } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@/styles/text-editor.css";
import { StepBlock } from "@/features/block/types";
import { saveBlockNoteContent } from "@/features/block/services/blockService";
import { useAllBlocks } from "@/features/block/store/blockStore";
import { toast } from "sonner";
import { getBlockNoteBlocksFromStep } from "@/features/block/utils/blockNoteConverter";

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

  // BlockNote에 필요한 초기 콘텐츠를 useMemo로 최적화
  const initialContent = useMemo(() => {
    return getBlockNoteBlocksFromStep(block, allBlocks);
  }, [block, allBlocks]);

  // 에디터 인스턴스 생성
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

        // 사용자 콜백 호출
        if (onSave) {
          onSave();
        }
      } catch (error) {
        console.error("Failed to save editor content:", error);
        toast.error("내용 저장에 실패했습니다.");
      }
    }, 2000); // 2초마다 저장

    return () => clearInterval(saveInterval);
  }, [editor, block, onSave, readOnly]);

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
