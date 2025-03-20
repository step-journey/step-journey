/**
 * 블록 데이터 모델의 기본 타입 정의
 */

// 블록의 고유 식별자
export type UUID = string;

// 모든 블록에 공통적인 타임스탬프 필드
export interface TimeStampFields {
  createdAt: string;
  updatedAt: string;
}

// 사용 가능한 블록 타입 열거형
export enum BlockType {
  JOURNEY = "journey",
  STEP_GROUP = "stepGroup",
  STEP = "step",
  // BlockNote 블록 타입들
  PARAGRAPH = "paragraph",
  HEADING = "heading",
  BULLET_LIST = "bulletList",
  NUMBERED_LIST = "numberedList",
  CHECK_LIST = "checkList",
  CODE_BLOCK = "code",
  TABLE = "table",
  IMAGE = "image",
  // 멀티컬럼 블록 타입들
  COLUMN = "column",
  COLUMN_LIST = "columnList",
}

// 모든 블록 타입에 공통적인 기본 속성 (아직 없음)
export type BaseBlockProperties = object;

// 공통 필드를 가진 기본 블록 인터페이스
export interface BaseBlock extends TimeStampFields {
  id: UUID;
  type: BlockType;
  parentId?: UUID;
  childrenIds: UUID[];
  createdBy: UUID;
}
