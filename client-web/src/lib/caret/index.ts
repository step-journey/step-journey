/**
 * @file 캐럿 관리 시스템 통합 내보내기
 */

// 타입 내보내기
export * from "./types";

// 유틸리티 함수 내보내기
export {
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
  logCaretPosition,
} from "./caretUtils";

// 저장소 내보내기
export {
  memoryCaretStore,
  localCaretStore,
  defaultCaretStore,
} from "./caretStore";

// React Hook 내보내기
export { useCaretManager } from "./useCaretManager";
