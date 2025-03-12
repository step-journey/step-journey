type UUID = string;

interface Media {
  type: "image" | "gif" | "video"; // 미디어 타입
  url: string; // 파일 경로
  alt?: string; // 대체 텍스트
  caption?: string; // 캡션 텍스트
}

export interface PinnedProblem {
  text: string;
  media?: Media;
}

// 기본 타임스탬프 필드
interface TimeStampFields {
  created_at: string;
  updated_at: string;
}

// 삭제 관련 필드
interface DeletableFields {
  is_deleted: boolean;
  deleted_at?: string;
  deleted_by?: UUID;
}

// Journey
export interface Journey extends TimeStampFields {
  id: UUID;
  title: string;
  description: string;
  step_order: UUID[];
  groups: GroupData[];
  pinnedProblem?: PinnedProblem | string;
}

// Step
export interface Step extends TimeStampFields {
  id: UUID;
  journey_id: UUID;
  title: string;
  description?: string;
  content: string[]; // 항상 배열로 저장
  created_by: UUID;

  // UI 필드
  label?: string;
  desc?: string;
  highlightedKeywordsInProblem?: string[];
}

// Block
export interface Block extends TimeStampFields, DeletableFields {
  id: UUID;
  parent_id: UUID | null;
  content: UUID[];
  created_by: UUID;
  updated_by: UUID;
  type: string;
  properties: Record<string, any>;
}

export interface GroupData {
  groupId: string;
  groupLabel: string;
  mapDescription: string;
  steps: Step[];
}

// FlattenedStep (UI 전용, 통합 Step 모델 확장)
export interface FlattenedStep extends Step {
  groupId: string;
  globalIndex: number;
  stepIdInGroup: number;
}

// 사이드바 DOM 관리 (UI 전용)
export type StepContainerMap = Record<string, HTMLDivElement | null>;
