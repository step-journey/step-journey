import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Block } from "@/types/block";
import { EditorController } from "./editorState";
import { EditorState, SelectionState, Transaction } from "./types";
import { applySelectionToDOM } from "./selection";

interface UseEditorStateOptions {
  pageId: string;
  initialBlocks?: Block[];
  onChange?: (state: EditorState) => void;
}

/**
 * 에디터 상태 관리 훅
 */
export function useEditorState({
  pageId,
  initialBlocks = [],
  onChange,
}: UseEditorStateOptions) {
  // EditorState (null 이면 아직 초기화 전)
  const [state, setState] = useState<EditorState | null>(null);

  // EditorController 참조
  const controllerRef = useRef<EditorController | null>(null);

  // 에디터 루트 DOM
  const rootRef = useRef<HTMLElement | null>(null);

  // 1) EditorController를 생성 & 구독
  useEffect(() => {
    // EditorController 생성
    const controller = new EditorController({
      documentId: pageId,
      blocks: initialBlocks,
    });

    // ref에 저장
    controllerRef.current = controller;

    // ★주의★ 여기서 controller.getState()를 곧바로 setState하면,
    // onStateChange가 그 뒤 동일 값 setState → 무한루프 위험
    // => 아래 onStateChange 구독 내에서만 setState 하도록

    // onStateChange 구독
    const unsubscribe = controller.onStateChange((newState) => {
      setState(newState);
      onChange?.(newState);
    });

    return () => {
      unsubscribe();
    };
  }, [pageId, initialBlocks, onChange]);

  // 2) 루트 DOM 요소 설정
  const setRootElement = useCallback((element: HTMLElement | null) => {
    if (controllerRef.current) {
      controllerRef.current.setRootElement(element);
      rootRef.current = element;
    }
  }, []);

  // 3) EditorState -> DOM Selection 동기화 (선택영역)
  //    state?.selection 바뀔 때만 적용
  useEffect(() => {
    if (!state || !rootRef.current) return;
    if (state.selection) {
      // DOM 반영
      applySelectionToDOM(state.selection, rootRef.current);
    }
  }, [state?.selection, state?.version]);

  // 4) DOM selection -> EditorController
  //    글로벌 selectionchange 이벤트로 감지
  useEffect(() => {
    if (!rootRef.current || !controllerRef.current) return;

    const handleSelectionChange = () => {
      if (!rootRef.current || !controllerRef.current) return; // 재확인
      const selection = window.getSelection();
      if (!selection) return;

      // 선택영역이 에디터 내부에 있는지 확인
      let isInEditor = false;
      for (let i = 0; i < selection.rangeCount; i++) {
        const range = selection.getRangeAt(i);
        if (rootRef.current.contains(range.commonAncestorContainer)) {
          isInEditor = true;
          break;
        }
      }
      if (isInEditor) {
        // editorController가 DOM selection을 읽어 에디터 상태에 반영
        controllerRef.current.updateSelectionFromDOM();
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [rootRef, controllerRef]);

  // 5) 블록 목록 업데이트
  const updateBlocks = useCallback((blocks: Block[]) => {
    controllerRef.current?.updateBlocks(blocks);
  }, []);

  // 6) 트랜잭션 적용
  const applyTransaction = useCallback((transaction: Transaction) => {
    controllerRef.current?.applyTransaction(transaction);
  }, []);

  // 7) 트랜잭션 생성
  const createTransaction = useCallback(() => {
    return controllerRef.current?.createTransaction() ?? null;
  }, []);

  // 8) 통합 컨트롤러
  const controller = useMemo(() => {
    if (!controllerRef.current) return null;

    return {
      getState: () => controllerRef.current!.getState(),
      updateBlocks,
      applyTransaction,
      createTransaction,
      setRootElement,
      updateSelection: (selection: SelectionState | null) => {
        controllerRef.current?.updateSelection(selection);
      },
    };
  }, [updateBlocks, applyTransaction, createTransaction, setRootElement]);

  return {
    state,
    controller,
    setRootElement,
  };
}
