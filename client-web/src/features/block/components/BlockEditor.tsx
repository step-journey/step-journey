import { useEffect, useState, useMemo } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@/styles/text-editor.css";
import { StepBlock, BlockNoteContent } from "@/features/block/types";
import { updateBlock } from "@/features/block/services/blockService";
import { toast } from "sonner";

interface BlockEditorProps {
  block: StepBlock;
  onSave?: (content: BlockNoteContent) => void;
  readOnly?: boolean;
}

export function BlockEditor({
  block,
  onSave,
  readOnly = false,
}: BlockEditorProps) {
  const [savedContent, setSavedContent] = useState<BlockNoteContent | null>(
    null,
  );
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // BlockNote에 필요한 초기 콘텐츠를 useMemo로 최적화
  const initialContent = useMemo(() => {
    // editorContent 있으면 그 블록을 사용
    if (block.properties.editorContent?.blocks) {
      return block.properties.editorContent.blocks;
    }

    // 없으면 기본 블록 생성
    const defaultText = "내용을 입력하세요...";
    return [
      {
        id: "initial-block",
        type: "paragraph",
        props: {
          textColor: "default",
          backgroundColor: "default",
          textAlignment: "left",
        },
        content: [
          {
            type: "text",
            text: defaultText,
            styles: {},
          },
        ],
        children: [],
      },
    ];
  }, [block.id, block.properties.editorContent]);

  // 에디터 인스턴스 생성
  const editor = useCreateBlockNote({
    initialContent,
  });

  // 초기 마운트 시 에디터 컨텐츠 설정
  useEffect(() => {
    if (block.properties.editorContent) {
      setSavedContent(block.properties.editorContent);
    }
  }, [block.id, block.properties.editorContent]);

  // 자동 저장 타이머
  useEffect(() => {
    if (readOnly) return;

    const saveInterval = setInterval(async () => {
      try {
        // 문서의 현재 블록 가져오기
        const blocks = editor.document;
        const content = { blocks, version: "1.0" };

        // 내용이 변경된 경우에만 저장
        if (JSON.stringify(content) !== JSON.stringify(savedContent)) {
          setSavedContent(content);
          setLastSaved(new Date());

          // 블록 업데이트
          if (onSave) {
            onSave(content);
          }

          // IndexedDB에 직접 저장
          const updatedBlock = {
            ...block,
            properties: {
              ...block.properties,
              editorContent: content,
              // 텍스트 콘텐츠도 함께 업데이트
            },
          };
          await updateBlock(updatedBlock);
        }
      } catch (error) {
        console.error("Failed to save editor content:", error);
        toast.error("내용 저장에 실패했습니다.");
      }
    }, 2000); // 2초마다 저장

    return () => clearInterval(saveInterval);
  }, [editor, block, savedContent, onSave, readOnly]);

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
