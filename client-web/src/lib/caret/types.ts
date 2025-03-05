/**
 * @file 캐럿 위치와 선택 관련 타입 정의
 */

// 문서 내 캐럿 위치 표현
export interface CaretPosition {
  // 기본 DOM 위치 정보
  node: Node | null;
  offset: number;

  // 블록 컨텍스트 정보
  blockId?: string;

  // 고급 위치 정보 (줄/열)
  lineIndex?: number;
  columnIndex?: number;
}

// 선택 영역 표현
export interface CaretSelection {
  start: CaretPosition;
  end: CaretPosition;
  isCollapsed: boolean;
  direction: "forward" | "backward";
}

// 캐럿 위치 계산을 위한 컨텍스트
export interface CaretContext {
  blockId: string;
  parentBlockId?: string;
  blockType: string;
  isFirstBlock: boolean;
  isLastBlock: boolean;
}

// 캐럿 동작 로깅을 위한 타입
export type CaretOperation =
  | "GET"
  | "SET"
  | "SAVE"
  | "RESTORE"
  | "MOVE_START"
  | "MOVE_END"
  | "MOVE_UP"
  | "MOVE_DOWN"
  | "MOVE_BLOCK";

// 캐럿 이벤트 타입
export interface CaretEvent {
  operation: CaretOperation;
  position?: CaretPosition;
  selection?: CaretSelection;
  context?: CaretContext;
  timestamp: number;
}

// 캐럿 상태 저장소 인터페이스
export interface CaretStore {
  get(key: string): CaretPosition | null;
  set(key: string, position: CaretPosition): void;
  remove(key: string): void;
  clear(): void;
}
