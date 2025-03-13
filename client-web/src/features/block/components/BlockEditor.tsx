import { useEffect, useState } from "react";
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

  // BlockNote는 아주 특정한 형식의 initialContent를 요구합니다
  // 정확한 형식으로 초기 콘텐츠를 설정합니다
  const initialContent = block.properties.editorContent?.blocks || [
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
          text: block.properties.content?.[0] || "내용을 입력하세요...",
          styles: {},
        },
      ],
      children: [],
    },
  ];

  // 에디터 인스턴스 생성
  const editor = useCreateBlockNote({
    initialContent,
  });

  // BlockNote 문서에서 텍스트 내용을 추출하는 함수
  const extractTextFromBlocks = (blocks: any[]) => {
    return blocks
      .map((block) => {
        // 인라인 콘텐츠 배열인 경우 (일반적인 텍스트 블록)
        if (Array.isArray(block.content)) {
          return block.content
            .map((item: any) => (item.type === "text" ? item.text || "" : ""))
            .join("");
        }
        // 테이블 콘텐츠인 경우
        else if (block.content && block.content.type === "tableContent") {
          return ""; // 테이블은 간단히 빈 문자열로 표현하거나 필요에 따라 처리
        }
        // 콘텐츠가 없는 경우
        return "";
      })
      .filter(Boolean);
  };

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

          // 텍스트 내용 추출
          const textContent = extractTextFromBlocks(blocks);

          // IndexedDB에 직접 저장
          const updatedBlock = {
            ...block,
            properties: {
              ...block.properties,
              editorContent: content,
              // 텍스트 콘텐츠도 함께 업데이트
              content: textContent,
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
