/**
 * 드래그 앤 드롭 요소 타입 상수
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
