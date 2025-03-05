/**
 * @file 캐럿 관리를 위한 핵심 유틸리티 함수
 */
import {
  CaretPosition,
  CaretSelection,
  CaretContext,
  CaretOperation,
  CaretEvent,
} from "./types";
import { defaultCaretStore } from "./caretStore";

// 이벤트 구독 시스템
const subscribers: ((event: CaretEvent) => void)[] = [];

/**
 * 캐럿 이벤트를 발생시키고 구독자에게 알림
 */
export function emitCaretEvent(
  operation: CaretOperation,
  data?: Partial<CaretEvent>,
): void {
  const event: CaretEvent = {
    operation,
    ...data,
    timestamp: Date.now(),
  };

  subscribers.forEach((subscriber) => subscriber(event));

  // 개발 모드에서 로깅 (필요시 활성화)
  if (import.meta.env.DEV) {
    console.log(
      `%c[CARET:${operation}]`,
      "color: #0066cc; font-weight: bold",
      event,
    );
  }
}

/**
 * 캐럿 이벤트 구독
 */
export function subscribeToCaretEvents(
  callback: (event: CaretEvent) => void,
): () => void {
  subscribers.push(callback);
  return () => {
    const index = subscribers.indexOf(callback);
    if (index !== -1) {
      subscribers.splice(index, 1);
    }
  };
}

/**
 * 현재 선택 영역에서 캐럿 위치 가져오기
 */
export function getCurrentCaretPosition(): CaretPosition | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);

  return {
    node: range.startContainer,
    offset: range.startOffset,
  };
}

/**
 * 현재 선택 영역 정보 가져오기
 */
export function getCurrentSelection(): CaretSelection | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);

  return {
    start: {
      node: range.startContainer,
      offset: range.startOffset,
    },
    end: {
      node: range.endContainer,
      offset: range.endOffset,
    },
    isCollapsed: range.collapsed,
    direction:
      selection.anchorNode === range.startContainer ? "forward" : "backward",
  };
}

/**
 * 지정된 위치로 캐럿 설정하기
 */
export function setCaretPosition(position: CaretPosition): boolean {
  if (!position.node) return false;

  try {
    const selection = window.getSelection();
    if (!selection) return false;

    const range = document.createRange();
    range.setStart(
      position.node,
      Math.min(position.offset, getNodeLength(position.node)),
    );
    range.collapse(true);

    selection.removeAllRanges();
    selection.addRange(range);

    emitCaretEvent("SET", { position });
    return true;
  } catch (e) {
    console.error("Failed to set caret position", e);
    return false;
  }
}

/**
 * 특정 DOM 요소의 시작 위치로 캐럿 설정
 */
export function moveCaretToStart(element: HTMLElement): boolean {
  const firstTextNode = findFirstTextNode(element);

  if (!firstTextNode) {
    try {
      const selection = window.getSelection();
      if (!selection) return false;

      const range = document.createRange();
      range.setStart(element, 0);
      range.collapse(true);

      selection.removeAllRanges();
      selection.addRange(range);

      emitCaretEvent("MOVE_START", {
        position: { node: element, offset: 0 },
      });
      return true;
    } catch (e) {
      console.error("Failed to move caret to start", e);
      return false;
    }
  }

  return setCaretPosition({
    node: firstTextNode,
    offset: 0,
  });
}

/**
 * 특정 DOM 요소의 끝 위치로 캐럿 설정
 */
export function moveCaretToEnd(element: HTMLElement): boolean {
  const lastTextNode = findLastTextNode(element);

  if (!lastTextNode) {
    try {
      const selection = window.getSelection();
      if (!selection) return false;

      const range = document.createRange();
      range.setStart(element, element.childNodes.length);
      range.collapse(true);

      selection.removeAllRanges();
      selection.addRange(range);

      emitCaretEvent("MOVE_END", {
        position: { node: element, offset: element.childNodes.length },
      });
      return true;
    } catch (e) {
      console.error("Failed to move caret to end", e);
      return false;
    }
  }

  const position = {
    node: lastTextNode,
    offset: lastTextNode.textContent?.length || 0,
  };

  return setCaretPosition(position);
}

/**
 * 현재 캐럿 위치를 저장소에 저장하기
 */
export function saveCaretPosition(key: string): CaretPosition | null {
  const position = getCurrentCaretPosition();

  if (position) {
    defaultCaretStore.set(key, position);
    emitCaretEvent("SAVE", { position });
  }

  return position;
}

/**
 * 저장소에서 캐럿 위치 복원하기
 */
export function restoreCaretPosition(key: string): boolean {
  const position = defaultCaretStore.get(key);

  if (!position) return false;

  const result = setCaretPosition(position);
  if (result) {
    emitCaretEvent("RESTORE", { position });
  }

  return result;
}

/**
 * 블록 간 이동을 위한 캐럿 열(column) 위치 저장
 */
export function saveColumnPositionForBlockNavigation(position: number): void {
  localStorage.setItem("caretColumn", position.toString());

  emitCaretEvent("MOVE_BLOCK", {
    position: { offset: position, node: null },
  });
}

/**
 * 블록 간 이동 후 저장된 열 위치 가져오기
 */
export function getColumnPositionForBlockNavigation(): number | null {
  const saved = localStorage.getItem("caretColumn");
  if (!saved) return null;

  try {
    return parseInt(saved, 10);
  } catch (e) {
    return null;
  }
}

/**
 * 블록 간 이동 후 저장된 열 위치 정보 삭제
 */
export function clearColumnPositionForBlockNavigation(): void {
  localStorage.removeItem("caretColumn");
}

/**
 * CaretContext 타입 사용 예제
 * 에디터 내에서 블록 간 이동 시 컨텍스트 기반 캐럿 위치 조정
 */
export function adjustCaretForBlockContext(context: CaretContext): void {
  console.log("Adjusting caret position for block context:", context);
  // 실제 구현은 여기에...
}

// 헬퍼 함수: 노드의 길이 계산
function getNodeLength(node: Node): number {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent?.length || 0;
  }
  return node.childNodes.length;
}

// 헬퍼 함수: 요소 내에서 첫 번째 텍스트 노드 찾기
function findFirstTextNode(element: HTMLElement): Node | null {
  if (element.nodeType === Node.TEXT_NODE) {
    return element;
  }

  if (element.firstChild) {
    const queue: Node[] = [element.firstChild];

    while (queue.length > 0) {
      const node = queue.shift()!;

      if (node.nodeType === Node.TEXT_NODE) {
        return node;
      }

      // 자식 노드 큐에 추가
      for (let i = 0; i < node.childNodes.length; i++) {
        queue.push(node.childNodes[i]);
      }
    }
  }

  return null;
}

// 헬퍼 함수: 요소 내에서 마지막 텍스트 노드 찾기
function findLastTextNode(element: HTMLElement): Node | null {
  if (element.nodeType === Node.TEXT_NODE) {
    return element;
  }

  if (element.lastChild) {
    const stack: Node[] = [element.lastChild];

    while (stack.length > 0) {
      const node = stack.pop()!;

      if (node.nodeType === Node.TEXT_NODE) {
        return node;
      }

      // 자식 노드를 스택에 역순으로 추가
      for (let i = node.childNodes.length - 1; i >= 0; i--) {
        stack.push(node.childNodes[i]);
      }
    }
  }

  return null;
}

// 캐럿 위치 로깅 헬퍼
export function logCaretPosition(prefix: string = "Caret"): void {
  if (!import.meta.env.DEV) return;

  const position = getCurrentCaretPosition();
  console.log(
    `%c[${prefix}]`,
    "color: #6600cc; font-weight: bold",
    position
      ? {
          node: position.node?.nodeName,
          nodeType: position.node?.nodeType,
          textContent:
            position.node?.textContent?.substring(0, 20) +
            (position.node?.textContent?.length || 0 > 20 ? "..." : ""),
          offset: position.offset,
        }
      : "No selection",
  );
}
