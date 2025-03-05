/**
 * 에디터 상태 시스템 통합 내보내기
 */

// 타입 내보내기
export * from "./types";

// 에디터 상태 내보내기
export { createEditorState, EditorController } from "./editorState";

// 선택 영역 관리 내보내기
export {
  createSelection,
  getDOMSelection,
  applySelectionToDOM,
  createBlockStart,
  createBlockEnd,
  isSelectionEmpty,
} from "./selection";

// 트랜잭션 시스템 내보내기
export {
  createTransaction,
  TransactionBuilder,
  applyTransaction,
} from "./transaction";

// React Hook
export { useEditorState } from "./useEditorState";
