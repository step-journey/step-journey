/**
 * 선택 영역 모델 - DOM 기반 선택과 EditorState 선택 간 변환 담당
 */
import { NodePosition, SelectionState } from "./types";

/**
 * 새 선택 상태 객체 생성
 */
export function createSelection(
  anchor: NodePosition,
  focus: NodePosition = anchor,
): SelectionState {
  const isBackward =
    anchor.blockId === focus.blockId ? anchor.offset > focus.offset : false; // 서로 다른 블록일 때는 백워드 판단이 복잡하므로 일단 false로 처리

  return {
    anchor: isBackward ? focus : anchor,
    focus: isBackward ? anchor : focus,
    isCollapsed:
      anchor.blockId === focus.blockId && anchor.offset === focus.offset,
    isBackward,
  };
}

/**
 * 현재 DOM 선택을 EditorState 선택으로 변환
 */
export function getDOMSelection(root: HTMLElement): SelectionState | null {
  const domSelection = window.getSelection();
  if (!domSelection || domSelection.rangeCount === 0) return null;

  const range = domSelection.getRangeAt(0);
  const anchor = getNodePositionFromDOM(
    range.startContainer,
    range.startOffset,
    root,
  );
  const focus = getNodePositionFromDOM(
    range.endContainer,
    range.endOffset,
    root,
  );

  if (!anchor || !focus) return null;

  return createSelection(anchor, focus);
}

/**
 * DOM 노드와 오프셋에서 NodePosition 추출
 */
function getNodePositionFromDOM(
  node: Node,
  offset: number,
  root: HTMLElement,
): NodePosition | null {
  // 노드가 에디터 내부에 없는 경우
  if (!root.contains(node)) return null;

  // 가장 가까운 블록 요소 찾기
  let blockElement = findBlockElement(node);
  if (!blockElement) return null;

  const blockId = blockElement.getAttribute("data-block-id");
  if (!blockId) return null;

  const type = node.nodeType === Node.TEXT_NODE ? "text" : "element";

  return {
    blockId,
    offset,
    type,
  };
}

/**
 * NodePosition에 해당하는 DOM 위치로 선택 영역 설정
 */
export function applySelectionToDOM(
  selection: SelectionState,
  root: HTMLElement,
): boolean {
  if (!selection) return false;

  const domSelection = window.getSelection();
  if (!domSelection) return false;

  const anchorNode = findDOMNodeByPosition(selection.anchor, root);
  const focusNode = findDOMNodeByPosition(selection.focus, root);

  if (!anchorNode || !focusNode) return false;

  try {
    const range = document.createRange();
    range.setStart(anchorNode.node, anchorNode.offset);
    range.setEnd(focusNode.node, focusNode.offset);

    domSelection.removeAllRanges();
    domSelection.addRange(range);
    return true;
  } catch (e) {
    console.error("Failed to apply selection to DOM", e);
    return false;
  }
}

/**
 * NodePosition에 해당하는 DOM 노드와 오프셋 찾기
 */
function findDOMNodeByPosition(
  position: NodePosition,
  root: HTMLElement,
): { node: Node; offset: number } | null {
  const blockElement = root.querySelector(
    `[data-block-id="${position.blockId}"]`,
  );
  if (!blockElement) return null;

  const contentEditable = blockElement.querySelector(
    '[contenteditable="true"]',
  );
  const targetElement = contentEditable || blockElement;

  if (position.type === "text") {
    // 텍스트 노드에서의 위치
    if (
      targetElement.firstChild &&
      targetElement.firstChild.nodeType === Node.TEXT_NODE
    ) {
      return {
        node: targetElement.firstChild,
        offset: Math.min(
          position.offset,
          targetElement.firstChild.textContent?.length || 0,
        ),
      };
    } else {
      // 텍스트 노드가 없는 경우
      return {
        node: targetElement,
        offset: 0,
      };
    }
  } else {
    // 엘리먼트 레벨 위치
    return {
      node: targetElement,
      offset: Math.min(position.offset, targetElement.childNodes.length),
    };
  }
}

/**
 * 주어진 노드에서 가장 가까운 블록 요소 찾기
 */
function findBlockElement(node: Node): HTMLElement | null {
  let current: Node | null = node;

  // 노드에서 위로 올라가면서 data-block-id 속성이 있는 요소 찾기
  while (current && current !== document.body) {
    if (
      current.nodeType === Node.ELEMENT_NODE &&
      (current as HTMLElement).hasAttribute("data-block-id")
    ) {
      return current as HTMLElement;
    }
    current = current.parentNode;
  }

  return null;
}

/**
 * 에디터 선택 영역이 비어 있는지 확인
 */
export function isSelectionEmpty(selection: SelectionState | null): boolean {
  return !selection || selection.isCollapsed;
}

/**
 * 특정 블록의 시작 위치를 가리키는 NodePosition 생성
 */
export function createBlockStart(blockId: string): NodePosition {
  return {
    blockId,
    offset: 0,
    type: "text",
  };
}

/**
 * 특정 블록의 끝 위치를 가리키는 NodePosition 생성
 */
export function createBlockEnd(
  blockId: string,
  blockContent: string = "",
): NodePosition {
  return {
    blockId,
    offset: blockContent.length,
    type: "text",
  };
}
