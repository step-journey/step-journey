/**
 * 드래그 앤 드롭 요소 타입 상수
 * 여러 컴포넌트 간에 타입 문자열의 일관성을 보장합니다.
 */
export const DND_TYPES = {
  STEP: "step",
  STEP_GROUP: "stepGroup",
  STEP_GAP: "stepGap",
} as const;

/**
 * 드래그 앤 드롭 요소 타입
 * 타입 안전성을 위한 TypeScript 타입 정의
 */
export type DndItemType = (typeof DND_TYPES)[keyof typeof DND_TYPES];
