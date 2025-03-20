import { useEffect, useState, useMemo, useRef } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import {
  BlockNoteSchema,
  combineByGroup,
  filterSuggestionItems,
  locales,
  defaultBlockSpecs,
} from "@blocknote/core";
import "@/styles/text-editor.css";
import { Block, JourneyBlock, StepBlock } from "@/features/block/types";
import { convertAndSaveBlockNoteContent } from "@/features/block/services/blockService";
import { useAllBlocks } from "@/features/block/store/blockStore";
import { toast } from "sonner";
import { getBlockNoteBlocksFromStep } from "@/features/block/utils/blockNoteConverter";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";
import {
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
} from "@blocknote/react";
import {
  getMultiColumnSlashMenuItems,
  multiColumnDropCursor,
  locales as multiColumnLocales,
  withMultiColumn,
} from "@blocknote/xl-multi-column";

// Journey 데이터 타입 정의
interface JourneyData {
  journeyBlock: JourneyBlock | null;
  flattenedSteps: StepBlock[];
  allBlocks: Block[];
}

interface BlockEditorProps {
  block: StepBlock;
  onSave?: () => void;
  onLastSavedChange?: (lastSaved: Date | null) => void;
}

export function BlockEditor({
  block,
  onSave,
  onLastSavedChange,
}: BlockEditorProps) {
  const [, setLastSaved] = useState<Date | null>(null);
  const allBlocks = useAllBlocks();
  const queryClient = useQueryClient();
  // 에디터 뷰에 접근하기 위한 ref 추가
  const editorViewRef = useRef<HTMLDivElement>(null);

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
    // getBlockNoteBlocksFromStep 함수의 반환 타입은 BlockNoteEditor.create가
    // 예상하는 PartialBlock[] 타입과 호환되지 않으므로 as any로 캐스팅
    return getBlockNoteBlocksFromStep(block, allBlocks) as any;
  }, [block, allBlocks]);

  // video, audio, file 블록 제외하기
  const customSchema = useMemo(() => {
    // 제외할 블록 제거
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { video, audio, file, ...remainingBlockSpecs } = defaultBlockSpecs;

    // 커스텀 스키마 생성
    return BlockNoteSchema.create({
      blockSpecs: {
        ...remainingBlockSpecs,
      },
    });
  }, []);

  // 에디터 설정을 준비
  const editorConfig = useMemo(
    () => ({
      initialContent,
      // 제외된 블록이 적용된 스키마에 multiColumn 기능 추가
      schema: withMultiColumn(customSchema),
      dropCursor: multiColumnDropCursor,
      dictionary: {
        ...locales.ko,
        multi_column: {
          // 기존 멀티컬럼 한국어 번역을 가져와서 필요한 부분만 오버라이드
          ...multiColumnLocales.ko,
          slash_menu: {
            // 필요한 부분만 오버라이드
            two_columns: {
              ...multiColumnLocales.ko.slash_menu.two_columns,
              title: "2개의 열", // "두 열"을 "2개의 열"로 변경
              subtext: "2개의 열 나란히", // 필요시 부제목도 변경
            },
            three_columns: {
              ...multiColumnLocales.ko.slash_menu.three_columns,
              title: "3개의 열", // "세 열"을 "3개의 열"로 변경
              subtext: "3개의 열 나란히",
            },
          },
        },
      },
    }),
    [initialContent, customSchema],
  );

  // 에디터 인스턴스 생성
  const editor = useCreateBlockNote(editorConfig);

  // 기본 슬래시 메뉴 항목과 멀티컬럼 항목 병합
  const getSlashMenuItems = useMemo(() => {
    return async (query: string) =>
      filterSuggestionItems(
        combineByGroup(
          getDefaultReactSlashMenuItems(editor),
          getMultiColumnSlashMenuItems(editor),
        ),
        query,
      );
  }, [editor]);

  // 자동 저장 타이머
  useEffect(() => {
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

        // 저장 로직 - 타입 호환성 문제로 any 캐스팅
        await convertAndSaveBlockNoteContent(block, topLevelBlocks as any);

        // 저장 성공 후 상태 업데이트
        const now = new Date();
        setLastSaved(now);
        lastSavedContentRef.current = currentContent;

        // 마지막 저장 시간을 부모 컴포넌트에 전달
        if (onLastSavedChange) {
          onLastSavedChange(now);
        }

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
  }, [
    editor,
    block,
    onSave,
    onLastSavedChange,
    queryClient,
    rootJourneyId,
    allBlocks,
  ]);

  // 에디터 자동 포커스 기능
  useEffect(() => {
    // 컴포넌트가 완전히 마운트된 후 포커스 설정을 위해 약간의 지연
    const timeoutId = setTimeout(() => {
      try {
        // BlockNote API 를 통한 포커스 시도
        if (editor && typeof editor.focus === "function") {
          editor.focus();
          return;
        }
      } catch (error) {
        console.error("Failed to focus editor:", error);
      }
    }, 100); // 약간의 지연을 두어 컴포넌트가 완전히 마운트된 후 포커스하도록 함

    return () => clearTimeout(timeoutId);
  }, [editor]);

  return (
    <div className="editor-container">
      <BlockNoteView
        editor={editor}
        // editable={}
        className="min-h-[200px] border rounded-md overflow-auto"
        slashMenu={false} // 기본 슬래시 메뉴 비활성화 (커스텀 메뉴 사용)
        ref={editorViewRef}
      >
        {/* 멀티컬럼 지원이 포함된 커스텀 슬래시 메뉴 추가 */}
        <SuggestionMenuController
          triggerCharacter={"/"}
          getItems={getSlashMenuItems}
        />
      </BlockNoteView>
    </div>
  );
}
