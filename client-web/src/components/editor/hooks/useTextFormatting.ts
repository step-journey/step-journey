import React, { useState, useRef, useCallback } from "react";
import { BlockType, TextFormat } from "@/types/block";
import { useCaretManager, CaretPosition } from "@/lib/caret";

type TextSelection = {
  start: number;
  end: number;
  text: string;
};

interface UseTextFormattingOptions {
  editorRef: React.RefObject<HTMLDivElement>;
  value: Array<[string, Array<TextFormat>]>;
  onChange: (value: Array<[string, Array<TextFormat>]>) => void;
  blockType: BlockType;
  onChangeType?: (type: BlockType) => void;
  caretManager?: ReturnType<typeof useCaretManager>;
}

/**
 * 텍스트 서식 및 마크다운 변환 등을 처리하는 훅
 */
export function useTextFormatting({
  editorRef,
  value,
  onChange,
  blockType,
  onChangeType,
  caretManager,
}: UseTextFormattingOptions) {
  const [activeFormats, setActiveFormats] = useState<TextFormat[]>([]);
  const [selectedRange, setSelectedRange] = useState<TextSelection | null>(
    null,
  );
  const lastKeyPressTime = useRef<number>(0);

  // 기본 캐럿 관리자 구성
  const defaultCaretManager = useCaretManager({
    editorRef,
    debug: false,
  });

  // 제공된 캐럿 관리자 또는 기본 관리자 사용
  const caret = caretManager || defaultCaretManager;

  // 현재 선택된 텍스트 감지
  const detectSelection = useCallback(() => {
    const selection = window.getSelection();
    if (
      !selection ||
      selection.rangeCount === 0 ||
      selection.isCollapsed ||
      !editorRef.current
    ) {
      setSelectedRange(null);
      return null;
    }

    const range = selection.getRangeAt(0);
    const selectedText = range.toString().trim();

    if (selectedText) {
      const newSelection = {
        start: range.startOffset,
        end: range.endOffset,
        text: selectedText,
      };
      setSelectedRange(newSelection);

      // 현재 적용된 포맷 감지
      detectAppliedFormats(newSelection);

      return newSelection;
    }

    setSelectedRange(null);
    return null;
  }, [editorRef]);

  // 적용된 포맷 감지하기
  const detectAppliedFormats = useCallback(
    (selection: TextSelection) => {
      // 여기서는 단순화된 구현
      // 실제로는 Notion의 포맷 배열을 분석해야 함
      const formats: TextFormat[] = [];

      // 블록 타입에 따라 포맷 자동 감지
      if (
        blockType === "heading_1" ||
        blockType === "heading_2" ||
        blockType === "heading_3"
      ) {
        formats.push(["b"]); // 헤딩은 기본적으로 굵게 표시
      }

      // 선택 영역 정보 사용
      console.log(
        `Selection range: ${selection.start}-${selection.end}, text: "${selection.text}"`,
      );

      // 원래 텍스트에서 선택 영역 분석
      const formatArray = value[0][1] || [];

      // 선택 영역에 해당하는 포맷만 추출 (실제 구현은 더 복잡할 수 있음)
      // 여기서는 단순화를 위해 모든 포맷을 고려
      formatArray.forEach((format) => {
        if (
          format[0] === "b" ||
          format[0] === "i" ||
          format[0] === "u" ||
          format[0] === "s"
        ) {
          formats.push(format as TextFormat);
        }
      });

      setActiveFormats(formats);
    },
    [value, blockType],
  );

  // 포맷 적용하기
  const applyFormat = useCallback(
    (formatType: TextFormat) => {
      if (!selectedRange || !editorRef.current) return;

      const text = editorRef.current.textContent || "";

      // 현재 캐럿 위치 저장
      const savedPosition = caret.saveCaret("format");
      // 변수 사용 - 디버깅 목적
      if (import.meta.env.DEV) {
        console.log("Saved caret position for formatting:", savedPosition);
      }

      // 여기서는 간소화된 구현
      // 실제로는 Notion 포맷 배열을 수정해야 함
      const newValue: Array<[string, Array<TextFormat>]> = [
        [text, [formatType]], // 전체 텍스트에 포맷 적용
      ];

      onChange(newValue);

      // 포맷 적용 후 캐럿 위치 복원
      setTimeout(() => {
        caret.restoreCaret("format");
      }, 0);
    },
    [editorRef, onChange, selectedRange, caret],
  );

  // 마크다운 자동 변환 처리
  const processMarkdown = useCallback(
    (text: string): boolean => {
      // 캐럿 위치 저장
      const caretPosition = caret.saveCaret("markdown");

      // 마크다운 변환을 위한 규칙
      const markdownRules = [
        // 제목
        { pattern: /^# (.+)$/, action: () => onChangeType?.("heading_1") },
        { pattern: /^## (.+)$/, action: () => onChangeType?.("heading_2") },
        { pattern: /^### (.+)$/, action: () => onChangeType?.("heading_3") },

        // 목록
        { pattern: /^- (.+)$/, action: () => onChangeType?.("bulleted_list") },
        { pattern: /^\* (.+)$/, action: () => onChangeType?.("bulleted_list") },
        {
          pattern: /^1\. (.+)$/,
          action: () => onChangeType?.("numbered_list"),
        },

        // 체크박스
        { pattern: /^\[ \] (.+)$/, action: () => onChangeType?.("to_do") },
        { pattern: /^\[x\] (.+)$/, action: () => onChangeType?.("to_do") },

        // 블록 요소
        { pattern: /^> (.+)$/, action: () => onChangeType?.("quote") },

        // 구분선
        { pattern: /^---$/, action: () => onChangeType?.("divider") },
        { pattern: /^___$/, action: () => onChangeType?.("divider") },
        { pattern: /^\*\*\*$/, action: () => onChangeType?.("divider") },
      ];

      // 스페이스가 마크다운 변환 트리거
      if (text.endsWith(" ")) {
        const textWithoutSpace = text.slice(0, -1);

        for (const rule of markdownRules) {
          if (rule.pattern.test(textWithoutSpace)) {
            // 일치하는 패턴 실행
            rule.action();

            // 특수 문자 제거하고 내용만 반환
            const match = textWithoutSpace.match(rule.pattern);
            if (match && match[1]) {
              // 변환 후 텍스트 설정
              setTimeout(() => {
                if (editorRef.current) {
                  editorRef.current.textContent = match[1];
                  onChange([[match[1], []]]);
                  // 변환 후 캐럿 위치 복원 또는 이동
                  setTimeout(() => {
                    if (caretPosition) {
                      caret.setCaretPosition({
                        node: caretPosition.node,
                        offset: Math.min(caretPosition.offset, match[1].length),
                      });
                    } else {
                      caret.moveToEnd();
                    }
                  }, 0);
                }
              }, 0);
            } else if (
              rule.pattern.toString().includes("---") ||
              rule.pattern.toString().includes("___") ||
              rule.pattern.toString().includes("\\*\\*\\*")
            ) {
              // 구분선의 경우 내용 비우기
              setTimeout(() => {
                if (editorRef.current) {
                  editorRef.current.textContent = "";
                  onChange([["", []]]);
                }
              }, 0);
            }
            return true;
          }
        }
      }
      return false;
    },
    [editorRef, caret, onChange, onChangeType],
  );

  // 줄바꿈 삽입
  const insertLineBreak = useCallback(() => {
    if (!editorRef.current) return;

    const text = editorRef.current.textContent || "";
    const position = caret.getCaretPosition();
    if (!position) return;

    const cursorPos = position.offset;

    // 커서 위치에 줄바꿈 삽입
    const newText =
      text.substring(0, cursorPos) + "\n" + text.substring(cursorPos);
    editorRef.current.textContent = newText;

    // 커서 위치 조정
    setTimeout(() => {
      // 캐럿 위치를 줄바꿈 다음으로 이동
      const updatedPosition: CaretPosition = {
        node: editorRef.current?.firstChild || (editorRef.current as Node),
        offset: cursorPos + 1,
      };
      caret.setCaretPosition(updatedPosition);
    }, 0);

    // 부모 컴포넌트에 변경 알림
    onChange([[newText, []]]);
  }, [editorRef, caret, onChange]);

  // 링크 삽입
  const promptForLink = useCallback(() => {
    if (!selectedRange) return;

    // 현재 캐럿 위치 저장
    const savedPosition = caret.saveCaret("link");
    // 변수 사용 - 디버깅 목적
    if (import.meta.env.DEV) {
      console.log("Saved caret position for link:", savedPosition);
    }

    // 간소화된 링크 입력, 실제로는 모달 컴포넌트 사용 권장
    const url = window.prompt("링크 URL을 입력하세요:", "https://");

    if (url && url.trim() !== "") {
      applyFormat(["a", url]);

      // 링크 삽입 후 커서 위치 조정 (링크 다음으로)
      setTimeout(() => {
        const currentPos = caret.getCaretPosition();
        if (currentPos && currentPos.node) {
          const newPos: CaretPosition = {
            node: currentPos.node,
            offset: currentPos.offset + selectedRange.text.length,
          };
          caret.setCaretPosition(newPos);
        }
      }, 0);
    } else {
      // 취소한 경우 원래 위치로 복원
      setTimeout(() => {
        caret.restoreCaret("link");
      }, 0);
    }
  }, [applyFormat, selectedRange, caret]);

  // 현재 커서 위치의 단어 선택
  const selectWord = useCallback(() => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const node = range.startContainer;

    // 텍스트 노드가 아니면 처리하지 않음
    if (node.nodeType !== Node.TEXT_NODE) return;

    const text = node.textContent || "";
    const cursorPos = range.startOffset;

    // 현재 커서가 있는 단어의 시작과 끝 찾기
    let start = cursorPos;
    let end = cursorPos;

    // 단어 시작 찾기 (왼쪽으로)
    while (start > 0 && !/\s/.test(text.charAt(start - 1))) {
      start--;
    }

    // 단어 끝 찾기 (오른쪽으로)
    while (end < text.length && !/\s/.test(text.charAt(end))) {
      end++;
    }

    // 새 범위 설정
    const newRange = document.createRange();
    newRange.setStart(node, start);
    newRange.setEnd(node, end);

    selection.removeAllRanges();
    selection.addRange(newRange);

    // 선택 정보 업데이트
    setSelectedRange({
      start,
      end,
      text: text.substring(start, end),
    });
  }, [editorRef]);

  // 블록 전체 선택
  const selectEntireBlock = useCallback(() => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();
    range.selectNodeContents(editorRef.current);

    selection.removeAllRanges();
    selection.addRange(range);

    // 선택 정보 업데이트
    const text = editorRef.current.textContent || "";
    setSelectedRange({
      start: 0,
      end: text.length,
      text,
    });
  }, [editorRef]);

  return {
    selectedRange,
    activeFormats,
    lastKeyPressTime,
    detectSelection,
    applyFormat,
    processMarkdown,
    moveCursorToEnd: caret.moveToEnd,
    insertLineBreak,
    promptForLink,
    selectWord,
    selectEntireBlock,
  };
}
