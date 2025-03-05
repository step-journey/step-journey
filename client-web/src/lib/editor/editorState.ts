/**
 * 에디터 상태 관리 핵심 클래스
 */
import { Block } from "@/types/block";
import {
  EditorEventHandler,
  EditorEventType,
  EditorState,
  EditorStateChangeHandler,
  EditorStateOptions,
  SelectionState,
  Transaction,
} from "./types";
import {
  applyTransaction,
  createTransaction,
  TransactionBuilder,
} from "./transaction";
import { getDOMSelection } from "./selection";

/**
 * 에디터 상태 생성
 */
export function createEditorState(options: EditorStateOptions): EditorState {
  return {
    documentId: options.documentId,
    blocks: options.blocks || [],
    selection: options.selection || null,
    version: 1,
  };
}

/**
 * 에디터 컨트롤러 클래스 - 상태 관리 및 업데이트 담당
 */
export class EditorController {
  private state: EditorState;
  private stateChangeHandlers: EditorStateChangeHandler[] = [];
  private eventHandlers: Map<EditorEventType, EditorEventHandler[]> = new Map();
  private rootElement: HTMLElement | null = null;

  constructor(initialState: EditorStateOptions) {
    this.state = createEditorState(initialState);
  }

  /**
   * 현재 에디터 상태 반환
   */
  getState(): EditorState {
    return this.state;
  }

  /**
   * 에디터 루트 요소 설정
   */
  setRootElement(element: HTMLElement | null): void {
    this.rootElement = element;
  }

  /**
   * 에디터 루트 요소 반환
   */
  getRootElement(): HTMLElement | null {
    return this.rootElement;
  }

  /**
   * 트랜잭션 생성 시작
   */
  createTransaction(): TransactionBuilder {
    return createTransaction(this.state);
  }

  /**
   * 트랜잭션 적용하여 상태 업데이트
   */
  applyTransaction(transaction: Transaction): void {
    const prevState = this.state;
    const newState = applyTransaction(prevState, transaction);
    this.updateState(newState, transaction);
  }

  /**
   * 트랜잭션으로 직접 블록 목록 업데이트
   */
  updateBlocks(blocks: Block[]): void {
    const transaction = this.createTransaction()
      .setMeta("type", "blocks-update")
      .build();

    const newState: EditorState = {
      ...this.state,
      blocks,
      version: this.state.version + 1,
    };

    this.updateState(newState, transaction);
  }

  /**
   * DOM 선택 영역에서 에디터 선택 상태 업데이트
   */
  updateSelectionFromDOM(): void {
    if (!this.rootElement) return;

    const selection = getDOMSelection(this.state, this.rootElement);
    if (!selection) return;

    const transaction = this.createTransaction()
      .setSelection(selection)
      .setMeta("source", "user-selection")
      .build();

    this.applyTransaction(transaction);
  }

  /**
   * 수동으로 선택 영역 설정
   */
  updateSelection(selection: SelectionState | null): void {
    const transaction = this.createTransaction()
      .setSelection(selection)
      .setMeta("source", "programmatic")
      .build();

    this.applyTransaction(transaction);
  }

  /**
   * 상태 변경 핸들러 등록
   */
  onStateChange(handler: EditorStateChangeHandler): () => void {
    this.stateChangeHandlers.push(handler);
    return () => {
      this.stateChangeHandlers = this.stateChangeHandlers.filter(
        (h) => h !== handler,
      );
    };
  }

  /**
   * 이벤트 핸들러 등록
   */
  on(eventType: EditorEventType, handler: EditorEventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }

    const handlers = this.eventHandlers.get(eventType)!;
    handlers.push(handler);

    return () => {
      const currentHandlers = this.eventHandlers.get(eventType) || [];
      this.eventHandlers.set(
        eventType,
        currentHandlers.filter((h) => h !== handler),
      );
    };
  }

  /**
   * 새 상태 설정 및 이벤트 발생
   */
  private updateState(newState: EditorState, transaction: Transaction): void {
    const prevState = this.state;
    this.state = newState;

    // 핸들러에 알림
    this.stateChangeHandlers.forEach((handler) => {
      try {
        handler(newState, prevState);
      } catch (e) {
        console.error("Error in state change handler:", e);
      }
    });

    // 이벤트 타입에 따라 이벤트 발생
    this.emitEvent("transaction", { transaction, state: newState });

    // 선택 영역 변경 이벤트
    if (transaction.selectionUpdate !== undefined) {
      this.emitEvent("selection", {
        selection: newState.selection,
        prevSelection: prevState.selection,
      });
    }

    // 작업 유형에 따른 이벤트 발생
    const hasContentChange = transaction.operations.some(
      (op) =>
        op.type === "insert_text" ||
        op.type === "delete_text" ||
        op.type === "format_text",
    );

    if (hasContentChange) {
      this.emitEvent("content-changed", { state: newState });
    }

    const hasBlockAdd = transaction.operations.some(
      (op) => op.type === "insert_block",
    );
    const hasBlockDelete = transaction.operations.some(
      (op) => op.type === "delete_block",
    );
    const hasBlockUpdate = transaction.operations.some(
      (op) => op.type === "update_block" || op.type === "move_block",
    );

    if (hasBlockAdd) {
      this.emitEvent("block-added", { state: newState });
    }

    if (hasBlockDelete) {
      this.emitEvent("block-deleted", { state: newState });
    }

    if (hasBlockUpdate) {
      this.emitEvent("block-updated", { state: newState });
    }
  }

  /**
   * 이벤트 발생
   */
  private emitEvent(eventType: EditorEventType, payload: any): void {
    const handlers = this.eventHandlers.get(eventType) || [];
    handlers.forEach((handler) => {
      try {
        handler(payload);
      } catch (e) {
        console.error(`Error in ${eventType} event handler:`, e);
      }
    });
  }
}
