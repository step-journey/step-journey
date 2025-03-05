/**
 * React에서 에디터 상태를 사용하기 위한 훅
 */
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
  const [state, setState] = useState<EditorState | null>(null);
  const controllerRef = useRef<EditorController | null>(null);
  const rootRef = useRef<HTMLElement | null>(null);

  // 컨트롤러 초기화
  useEffect(() => {
    const controller = new EditorController({
      documentId: pageId,
      blocks: initialBlocks,
    });

    controllerRef.current = controller;
    setState(controller.getState());

    // 변경 감지
    const unsubscribe = controller.onStateChange((newState) => {
      setState(newState);
      if (onChange) onChange(newState);
    });

    return () => {
      unsubscribe();
    };
  }, [pageId, onChange, initialBlocks]);

  // 루트 요소 설정
  const setRootElement = useCallback((element: HTMLElement | null) => {
    if (controllerRef.current) {
      controllerRef.current.setRootElement(element);
      rootRef.current = element;
    }
  }, []);

  // 선택 상태 변경 감지 및 DOM 동기화
  useEffect(() => {
    if (!state || !rootRef.current) return;

    // 선택 상태가 있으면 DOM에 적용
    if (state.selection) {
      applySelectionToDOM(state.selection, rootRef.current);
    }
  }, [state?.selection, state?.version]);

  // DOM 선택 변경 감지
  useEffect(() => {
    if (!rootRef.current || !controllerRef.current) return;

    const handleSelectionChange = () => {
      // 선택이 에디터 내부에 있는지 확인
      const selection = window.getSelection();
      if (!selection || !rootRef.current) return;

      // 선택 영역이 에디터 내부에 있는지 확인
      let isInEditor = false;
      for (let i = 0; i < selection.rangeCount; i++) {
        const range = selection.getRangeAt(i);
        if (rootRef.current.contains(range.commonAncestorContainer)) {
          isInEditor = true;
          break;
        }
      }

      if (isInEditor) {
        controllerRef.current?.updateSelectionFromDOM();
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  // 블록 목록 업데이트
  const updateBlocks = useCallback((blocks: Block[]) => {
    if (controllerRef.current) {
      controllerRef.current.updateBlocks(blocks);
    }
  }, []);

  // 트랜잭션 적용
  const applyTransaction = useCallback((transaction: Transaction) => {
    if (controllerRef.current) {
      controllerRef.current.applyTransaction(transaction);
    }
  }, []);

  // 트랜잭션 생성
  const createTransaction = useCallback(() => {
    if (!controllerRef.current) return null;
    return controllerRef.current.createTransaction();
  }, []);

  // 컨트롤러 API 제공
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
