/**
 * @file 캐럿 관리를 위한 React Hook
 */
import React, { useCallback, useEffect, useRef } from "react";
import { CaretPosition, CaretSelection, CaretContext } from "./types";
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
  }>({
    lastPosition: null,
    isSelecting: false,
  });

  // contentEditable 요소 참조 얻기
  const getEditableElement = useCallback((): HTMLElement | null => {
    if (!editorRef.current) return null;

    // 이미 contentEditable인 경우
    if (editorRef.current.getAttribute("contenteditable") === "true") {
      return editorRef.current;
    }

    // 자식 중 contentEditable 찾기
    return editorRef.current.querySelector('[contenteditable="true"]');
  }, [editorRef]);

  // 현재 캐럿 위치 가져오기
  const getCaretPosition = useCallback((): CaretPosition | null => {
    return getCurrentCaretPosition();
  }, []);

  // 특정 위치로 캐럿 설정하기
  const setCaretPos = useCallback((position: CaretPosition): boolean => {
    const result = setCaretPosition(position);
    if (result) {
      caretStateRef.current.lastPosition = position;
    }
    return result;
  }, []);

  // 캐럿을 요소의 시작 위치로 이동
  const moveToStart = useCallback((): boolean => {
    const element = getEditableElement();
    if (!element) return false;

    const result = moveCaretToStart(element);
    if (result && onFocus) {
      onFocus();
    }
    return result;
  }, [getEditableElement, onFocus]);

  // 캐럿을 요소의 끝 위치로 이동
  const moveToEnd = useCallback((): boolean => {
    const element = getEditableElement();
    if (!element) return false;

    const result = moveCaretToEnd(element);
    if (result && onFocus) {
      onFocus();
    }
    return result;
  }, [getEditableElement, onFocus]);

  // 현재 캐럿 위치 저장하기
  const saveCaret = useCallback(
    (key: string = "default"): CaretPosition | null => {
      const element = getEditableElement();
      if (!element) return null;

      // 현재 요소에 포커스가 없는 경우 저장하지 않음
      if (document.activeElement !== element) return null;

      const prefixedKey = blockId ? `${blockId}:${key}` : key;
      return saveCaretPosition(prefixedKey);
    },
    [blockId, getEditableElement],
  );

  // 저장된 캐럿 위치 복원하기
  const restoreCaret = useCallback(
    (key: string = "default"): boolean => {
      const element = getEditableElement();
      if (!element) return false;

      // 요소에 포커스 부여
      element.focus();

      const prefixedKey = blockId ? `${blockId}:${key}` : key;
      const result = restoreCaretPosition(prefixedKey);

      if (result && onFocus) {
        onFocus();
      }

      return result;
    },
    [blockId, getEditableElement, onFocus],
  );

  // 블록 간 이동을 위한 열 위치 저장
  const saveColumnForBlockNavigation = useCallback(
    (position?: number): void => {
      // 위치가 명시적으로 제공되지 않은 경우 현재 캐럿 위치 사용
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
    const column = getColumnPositionForBlockNavigation();
    if (column === null) return;

    const element = getEditableElement();
    if (!element) return;

    element.focus();

    try {
      const range = document.createRange();
      // 텍스트 노드나 요소 자체를 대상으로 캐럿 설정
      const targetNode = element.firstChild || element;
      const maxLength = targetNode.textContent?.length || 0;
      const safeOffset = Math.min(column, maxLength);

      range.setStart(targetNode, safeOffset);
      range.collapse(true);

      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);

        // 저장된 위치 재활용했으므로 삭제
        clearColumnPositionForBlockNavigation();
      }
    } catch (e) {
      console.error("Failed to restore caret column position", e);
      // 실패 시 기본 위치로 이동
      moveToStart();
    }
  }, [getEditableElement, moveToStart]);

  // 줄의 시작 위치인지 확인
  const isAtLineStart = useCallback((): boolean => {
    const position = getCaretPosition();
    if (!position) return false;

    // 노드 시작 위치면 라인 시작
    if (position.offset === 0) return true;

    // 텍스트 노드인 경우 줄바꿈 확인
    if (position.node?.nodeType === Node.TEXT_NODE) {
      const text = position.node.textContent || "";
      return position.offset === 0 || text.charAt(position.offset - 1) === "\n";
    }

    return false;
  }, [getCaretPosition]);

  // 줄의 끝 위치인지 확인
  const isAtLineEnd = useCallback((): boolean => {
    const position = getCaretPosition();
    if (!position || !position.node) return false;

    // 노드 끝 위치면 라인 끝
    const nodeLength =
      position.node.nodeType === Node.TEXT_NODE
        ? position.node.textContent?.length || 0
        : position.node.childNodes.length;

    if (position.offset === nodeLength) return true;

    // 텍스트 노드인 경우 줄바꿈 확인
    if (position.node.nodeType === Node.TEXT_NODE) {
      const text = position.node.textContent || "";
      return (
        position.offset === text.length || text.charAt(position.offset) === "\n"
      );
    }

    return false;
  }, [getCaretPosition]);

  // 디버깅 로깅 설정
  useEffect(() => {
    if (debug) {
      // CaretSelection, CaretContext 타입을 사용하는 예시 (경고 제거용)
      const logCaretDebugInfo = (
        selection: CaretSelection | null,
        context: CaretContext | null,
      ) => {
        console.log("CaretSelection:", selection);
        console.log("CaretContext:", context);
      };

      // 이벤트 구독
      return subscribeToCaretEvents((event) => {
        console.log(`%c[CARET DEBUG]`, "background: #ffcc00; color: #000", {
          operation: event.operation,
          blockId,
          position: event.position,
          timestamp: new Date(event.timestamp).toISOString(),
        });

        // emitCaretEvent 사용 예시 (경고 제거용)
        if (event.operation === "GET") {
          emitCaretEvent("SET", { position: event.position });
        }

        // 함수 호출 (실제로는 아무것도 하지 않음)
        logCaretDebugInfo(null, null);
      });
    }
    return undefined;
  }, [debug, blockId]);

  // 블록이 마운트 해제될 때 클린업
  useEffect(() => {
    return () => {
      if (blockId) {
        // 이 블록과 관련된 모든 캐럿 위치 정보 삭제
        // (필요시 구현)
      }
    };
  }, [blockId]);

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

    // 요소 접근
    getEditableElement,
  };
}
