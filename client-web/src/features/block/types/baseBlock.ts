/**
 * 블록 데이터 모델의 기본 타입 정의
 */

// 블록의 고유 식별자
export type UUID = string;

// 블록에 첨부할 수 있는 미디어 객체
export interface Media {
  type: "image" | "gif" | "video";
  url: string;
  alt?: string;
  caption?: string;
}

// 모든 블록에 공통적인 타임스탬프 필드
export interface TimeStampFields {
  createdAt: string;
  updatedAt: string;
}

// 사용 가능한 블록 타입 열거형
export enum BlockType {
  JOURNEY = "journey",
  STEP_GROUP = "step_group",
  STEP = "step",
}

// 모든 블록 타입에 공통적인 기본 속성
export interface BaseBlockProperties {
  title?: string;
  description?: string;
}

// 공통 필드를 가진 기본 블록 인터페이스
export interface BaseBlock extends TimeStampFields {
  id: UUID;
  type: BlockType;
  workspaceId?: UUID;
  parentId?: UUID;
  content: UUID[];
  createdBy: UUID;
}
