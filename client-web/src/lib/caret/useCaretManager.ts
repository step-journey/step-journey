/**
 * @file 캐럿 관리를 위한 React Hook
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { CaretPosition } from "./types";
import {
  getCurrentCaretPosition,
  setCaretPosition,
  moveCaretToStart,
  moveCaretToEnd,
  saveCaretPosition,
  restoreCaretPosition,
  saveColumnPositionForBlockNavigation,
  getColumnPositionForBlockNavigation,
  clearColumnPositionForBlockNavigation,
  subscribeToCaretEvents,
  isCaretAtBlockStart,
  isCaretAtBlockEnd,
  scrollCaretIntoView,
  emitCaretEvent,
} from "./caretUtils";

interface UseCaretManagerOptions {
  editorRef: React.RefObject<HTMLElement>;
  blockId?: string;
  onFocus?: () => void;
  debug?: boolean;
}

/**
 * 캐럿 관리를 위한 React Hook
 *
 * @param options 설정 옵션
 * @returns 캐럿 관리 함수들
 */
export function useCaretManager({
  editorRef,
  blockId,
  onFocus,
  debug = false,
}: UseCaretManagerOptions) {
  // 내부 상태 및 참조
  const caretStateRef = useRef<{
    lastPosition: CaretPosition | null;
    isSelecting: boolean;
    active: boolean;
    restorePending: boolean;
  }>({
    lastPosition: null,
    isSelecting: false,
    active: false,
    restorePending: false,
  });

  // 블록 데이터 캐싱
  const [blockState, setBlockState] = useState<{
    isEmpty: boolean;
    lastContent: string | null;
  }>({
    isEmpty: true,
    lastContent: null,
  });

  // contentEditable 요소 참조 얻기
  const getEditableElement = useCallback((): HTMLElement | null => {
    if (!editorRef.current) return null;

    // CARET: contentEditable 요소 찾기
    if (editorRef.current.getAttribute("contenteditable") === "true") {
      return editorRef.current;
    }

    // 자식 중 contentEditable 찾기
    return editorRef.current.querySelector('[contenteditable="true"]');
  }, [editorRef]);

  // DOM 변경 감지로 캐럿 복원 지원
  useEffect(() => {
    const element = getEditableElement();
    if (!element) return;

    // CARET: DOM 변경 감지를 위한 MutationObserver
    const observer = new MutationObserver(() => {
      const currentContent = element.textContent || "";
      const wasEmpty = blockState.isEmpty;
      const isEmpty = currentContent.trim() === "";

      if (wasEmpty !== isEmpty || blockState.lastContent !== currentContent) {
        setBlockState({
          isEmpty,
          lastContent: currentContent,
        });

        // 캐럿 복원 필요시 (ex: React 리렌더링 후)
        if (
          caretStateRef.current.restorePending &&
          caretStateRef.current.lastPosition
        ) {
          // 안전하게 다음 틱에 복원
          setTimeout(() => {
            restoreCaret("lastPosition");
            caretStateRef.current.restorePending = false;
          }, 0);
        }
      }
    });

    observer.observe(element, {
      characterData: true,
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [getEditableElement, blockState.isEmpty, blockState.lastContent]);

  // 현재 캐럿 위치 가져오기
  const getCaretPosition = useCallback((): CaretPosition | null => {
    // CARET: 현재 위치 가져오기
    const position = getCurrentCaretPosition();
    if (position) {
      caretStateRef.current.lastPosition = position;
    }
    return position;
  }, []);

  // 특정 위치로 캐럿 설정하기
  const setCaretPos = useCallback((position: CaretPosition): boolean => {
    // CARET: 캐럿 위치 설정
    const result = setCaretPosition(position);
    if (result) {
      caretStateRef.current.lastPosition = position;
      // 보이는 영역으로 스크롤
      setTimeout(() => scrollCaretIntoView(), 10);
    }
    return result;
  }, []);

  // 캐럿을 요소의 시작 위치로 이동
  const moveToStart = useCallback((): boolean => {
    // CARET: 블록 시작으로 이동
    const element = getEditableElement();
    if (!element) return false;

    const result = moveCaretToStart(element);
    if (result && onFocus) {
      onFocus();
    }

    caretStateRef.current.active = true;
    return result;
  }, [getEditableElement, onFocus]);

  // 캐럿을 요소의 끝 위치로 이동
  const moveToEnd = useCallback((): boolean => {
    // CARET: 블록 끝으로 이동
    const element = getEditableElement();
    if (!element) return false;

    const result = moveCaretToEnd(element);
    if (result && onFocus) {
      onFocus();
    }

    caretStateRef.current.active = true;
    return result;
  }, [getEditableElement, onFocus]);

  // 현재 캐럿 위치 저장하기
  const saveCaret = useCallback(
    (key: string = "default"): CaretPosition | null => {
      // CARET: 위치 저장
      const element = getEditableElement();
      if (!element) return null;

      if (document.activeElement !== element) return null;

      const prefixedKey = blockId ? `${blockId}:${key}` : key;
      const position = saveCaretPosition(prefixedKey);

      if (key === "default" && position) {
        caretStateRef.current.lastPosition = position;
      }

      return position;
    },
    [blockId, getEditableElement],
  );

  // 저장된 캐럿 위치 복원하기
  const restoreCaret = useCallback(
    (key: string = "default"): boolean => {
      // CARET: 저장된 위치 복원
      const element = getEditableElement();
      if (!element) {
        caretStateRef.current.restorePending = true;
        return false;
      }

      element.focus();

      const prefixedKey = blockId ? `${blockId}:${key}` : key;
      const result = restoreCaretPosition(prefixedKey);

      if (result && onFocus) {
        onFocus();
        caretStateRef.current.active = true;
      }

      return result;
    },
    [blockId, getEditableElement, onFocus],
  );

  // 블록 간 이동을 위한 열 위치 저장
  const saveColumnForBlockNavigation = useCallback(
    (position?: number): void => {
      // CARET: 블록 간 이동용 열 위치 저장
      if (position === undefined) {
        const currentPos = getCaretPosition();
        if (currentPos) {
          saveColumnPositionForBlockNavigation(currentPos.offset);
        }
      } else {
        saveColumnPositionForBlockNavigation(position);
      }
    },
    [getCaretPosition],
  );

  // 블록 간 이동 후 열 위치 복원
  const restoreColumnAfterBlockNavigation = useCallback(() => {
    // CARET: 블록 간 이동 후 열 위치 복원
    const column = getColumnPositionForBlockNavigation();
    if (column === null) return;

    const element = getEditableElement();
    if (!element) return;

    element.focus();

    try {
      const range = document.createRange();
      const targetNode = element.firstChild || element;
      const maxLength = targetNode.textContent?.length || 0;
      const safeOffset = Math.min(column, maxLength);

      range.setStart(targetNode, safeOffset);
      range.collapse(true);

      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);

        // DOM에 반영되도록 스크롤
        setTimeout(() => scrollCaretIntoView(), 10);

        clearColumnPositionForBlockNavigation();
        caretStateRef.current.active = true;
      }
    } catch (e) {
      console.error("Failed to restore caret column position", e);
      moveToStart();
    }
  }, [getEditableElement, moveToStart]);

  // 줄의 시작 위치인지 확인
  const isAtLineStart = useCallback((): boolean => {
    // CARET: 줄 시작 확인
    const element = getEditableElement();
    if (!element) return false;

    const position = getCaretPosition();
    if (!position) return false;

    if (position.offset === 0) return true;

    if (position.node?.nodeType === Node.TEXT_NODE) {
      const text = position.node.textContent || "";
      return position.offset === 0 || text.charAt(position.offset - 1) === "\n";
    }

    return false;
  }, [getEditableElement, getCaretPosition]);

  // 줄의 끝 위치인지 확인
  const isAtLineEnd = useCallback((): boolean => {
    // CARET: 줄 끝 확인
    const element = getEditableElement();
    if (!element) return false;

    const position = getCaretPosition();
    if (!position || !position.node) return false;

    const nodeLength =
      position.node.nodeType === Node.TEXT_NODE
        ? position.node.textContent?.length || 0
        : position.node.childNodes.length;

    if (position.offset === nodeLength) return true;

    if (position.node.nodeType === Node.TEXT_NODE) {
      const text = position.node.textContent || "";
      return (
        position.offset === text.length || text.charAt(position.offset) === "\n"
      );
    }

    return false;
  }, [getEditableElement, getCaretPosition]);

  // 캐럿이 블록 시작에 있는지 확인
  const isAtBlockStart = useCallback((): boolean => {
    // CARET: 블록 시작 확인
    const element = getEditableElement();
    if (!element) return false;

    return isCaretAtBlockStart(element);
  }, [getEditableElement]);

  // 캐럿이 블록 끝에 있는지 확인
  const isAtBlockEnd = useCallback((): boolean => {
    // CARET: 블록 끝 확인
    const element = getEditableElement();
    if (!element) return false;

    return isCaretAtBlockEnd(element);
  }, [getEditableElement]);

  // 블록 포커스 및 캐럿 강제 이동
  const forceFocusAndCaret = useCallback(
    (position: "start" | "end" = "start"): boolean => {
      // CARET: 강제 포커스 및 캐럿 배치
      const element = getEditableElement();
      if (!element) return false;

      setTimeout(() => {
        element.focus();

        if (position === "start") {
          moveToStart();
          // 이벤트 로깅 추가 - 필요한 모든 속성 포함
          emitCaretEvent("MOVE_START", {
            context: {
              blockId: blockId || "unknown",
              blockType: element.getAttribute("data-block-type") || "text",
              isFirstBlock: true,
              isLastBlock: false,
            },
          });
        } else {
          moveToEnd();
          // 이벤트 로깅 추가 - 필요한 모든 속성 포함
          emitCaretEvent("MOVE_END", {
            context: {
              blockId: blockId || "unknown",
              blockType: element.getAttribute("data-block-type") || "text",
              isFirstBlock: false,
              isLastBlock: true,
            },
          });
        }

        scrollCaretIntoView();
        caretStateRef.current.active = true;
        if (onFocus) onFocus();
      }, 10);

      return true;
    },
    [getEditableElement, moveToStart, moveToEnd, onFocus, blockId],
  );

  // 디버깅 로깅 설정
  useEffect(() => {
    if (debug) {
      return subscribeToCaretEvents((event) => {
        console.log(`%c[CARET DEBUG]`, "background: #ffcc00; color: #000", {
          operation: event.operation,
          blockId,
          position: event.position,
          timestamp: new Date(event.timestamp).toISOString(),
        });
      });
    }
    return undefined;
  }, [debug, blockId]);

  // 블록 활성화 상태 모니터링
  useEffect(() => {
    // CARET: 블록 포커스 이벤트 처리
    const handleFocus = () => {
      caretStateRef.current.active = true;

      // 복원 필요 시 마지막 저장 위치로 복원
      if (caretStateRef.current.lastPosition) {
        setCaretPos(caretStateRef.current.lastPosition);
      }
    };

    const handleBlur = () => {
      // 포커스 잃기 전 위치 저장
      saveCaret("lastPosition");
      caretStateRef.current.active = false;
    };

    const element = getEditableElement();
    if (element) {
      element.addEventListener("focus", handleFocus);
      element.addEventListener("blur", handleBlur);

      return () => {
        element.removeEventListener("focus", handleFocus);
        element.removeEventListener("blur", handleBlur);
      };
    }
  }, [getEditableElement, saveCaret, setCaretPos]);

  return {
    // 기본 위치 관리
    getCaretPosition,
    setCaretPosition: setCaretPos,
    moveToStart,
    moveToEnd,

    // 저장 및 복원
    saveCaret,
    restoreCaret,

    // 블록 탐색 지원
    saveColumnForBlockNavigation,
    restoreColumnAfterBlockNavigation,

    // 위치 확인 유틸리티
    isAtLineStart,
    isAtLineEnd,
    isAtBlockStart,
    isAtBlockEnd,

    // 강제 포커스 기능
    forceFocusAndCaret,

    // 요소 접근
    getEditableElement,

    // 블록 상태 정보
    blockState,
  };
}
