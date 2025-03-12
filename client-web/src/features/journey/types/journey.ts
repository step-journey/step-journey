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
  createdAt: string;
  updatedAt: string;
}

// 삭제 관련 필드
interface DeletableFields {
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: UUID;
}

// Journey
export interface Journey extends TimeStampFields {
  id: UUID;
  title: string;
  description: string;
  pinnedProblem?: PinnedProblem | string;
  stepGroups: StepGroup[];
}

// Step
export interface Step extends TimeStampFields {
  id: UUID;
  journeyId: UUID;
  title: string;
  description?: string;
  content: string[]; // 항상 배열로 저장
  createdBy: UUID;

  // UI 필드
  label?: string;
  desc?: string;
  highlightedKeywordsInProblem?: string[];
}

// FlattenedStep (UI 전용, 통합 Step 모델 확장)
export interface FlattenedStep extends Step {
  groupId: string;
  globalIndex: number;
  stepIdInGroup: number;
}

export interface StepGroup {
  groupId: string;
  groupLabel: string;
  steps: Step[];
}

// 사이드바 DOM 관리 (UI 전용)
export type StepContainerMap = Record<string, HTMLDivElement | null>;
