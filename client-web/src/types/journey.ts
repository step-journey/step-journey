export interface Media {
  type: "image" | "gif" | "video"; // 미디어 타입
  url: string; // 파일 경로
  alt?: string; // 대체 텍스트
  caption?: string; // 캡션 텍스트
}

// 디버그 변수 타입 정의
export interface DebugVariable {
  name: string;
  value: string | number | boolean | null;
  type: string;
  children?: DebugVariable[];
  expanded?: boolean;
}

export interface Step {
  id: number;
  label: string;
  desc: string;
  media?: Media; // 미디어 정보 추가
  example?: string; // 예시 코드나 텍스트
  debugVariables?: DebugVariable[]; // 디버그 변수 추가
  content?: string | string[];
}

export interface GroupData {
  groupId: string;
  groupLabel: string;
  mapDescription: string;
  steps: Step[];
}

export interface FlattenedStep extends Step {
  groupId: string;
  globalIndex: number;
  stepIdInGroup: number;
}

export interface Journey {
  id: string;
  title: string;
  description: string;
  groups: GroupData[];
}

export type StepContainerMap = Record<string, HTMLDivElement | null>;
