/**
 * EditorState 관련 타입 정의
 */
import { Block, TextFormat } from "@/types/block";

export interface EditorStateOptions {
  documentId: string;
  blocks?: Block[];
  selection?: SelectionState | null;
}

/**
 * 에디터 상태 타입 - 문서 내용과 선택 상태를 포함
 */
export interface EditorState {
  readonly documentId: string;
  readonly blocks: Block[];
  readonly selection: SelectionState | null;
  readonly version: number;
}

/**
 * 선택 상태 모델
 */
export interface SelectionState {
  // 선택 범위 (시작과 끝)
  readonly anchor: NodePosition;
  readonly focus: NodePosition;
  // 편의 속성
  readonly isCollapsed: boolean;
  readonly isBackward: boolean;
}

/**
 * 노드 위치 모델 (블록 ID와 텍스트 오프셋으로 위치 표현)
 */
export interface NodePosition {
  readonly blockId: string;
  readonly offset: number;
  readonly type: "text" | "element";
}

/**
 * 트랜잭션 타입 - 불변 상태 업데이트를 위한 변경사항 모음
 */
export interface Transaction {
  readonly operations: Operation[];
  readonly meta: Record<string, any>;
  readonly selectionUpdate: SelectionState | null;
}

/**
 * 작업 타입 - 트랜잭션을 구성하는 단위 작업
 */
export type Operation =
  | InsertTextOperation
  | DeleteTextOperation
  | FormatTextOperation
  | InsertBlockOperation
  | DeleteBlockOperation
  | UpdateBlockOperation
  | MoveBlockOperation;

/**
 * 텍스트 삽입 작업
 */
export interface InsertTextOperation {
  type: "insert_text";
  blockId: string;
  offset: number;
  text: string;
}

/**
 * 텍스트 삭제 작업
 */
export interface DeleteTextOperation {
  type: "delete_text";
  blockId: string;
  offset: number;
  length: number;
}

/**
 * 텍스트 서식 작업
 */
export interface FormatTextOperation {
  type: "format_text";
  blockId: string;
  offset: number;
  length: number;
  format: TextFormat;
  isRemove?: boolean;
}

/**
 * 블록 삽입 작업
 */
export interface InsertBlockOperation {
  type: "insert_block";
  block: Block;
  parentId: string | null;
  index: number;
}

/**
 * 블록 삭제 작업
 */
export interface DeleteBlockOperation {
  type: "delete_block";
  blockId: string;
}

/**
 * 블록 업데이트 작업
 */
export interface UpdateBlockOperation {
  type: "update_block";
  blockId: string;
  properties: Partial<Block>;
}

/**
 * 블록 이동 작업
 */
export interface MoveBlockOperation {
  type: "move_block";
  blockId: string;
  targetParentId: string | null;
  targetIndex: number;
}

/**
 * 에디터 상태 변경 핸들러 타입
 */
export type EditorStateChangeHandler = (
  newState: EditorState,
  prevState: EditorState,
) => void;

/**
 * 에디터 이벤트 타입
 */
export type EditorEventType =
  | "selection"
  | "transaction"
  | "block-added"
  | "block-deleted"
  | "block-updated"
  | "content-changed";

/**
 * 에디터 이벤트 핸들러 타입
 */
export type EditorEventHandler = (payload: any) => void;
