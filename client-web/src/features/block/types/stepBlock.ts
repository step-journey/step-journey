/**
 * Step 블록 관련 타입 및 유틸리티 함수
 */

import { BaseBlock, BaseBlockProperties, BlockType } from "./baseBlock";

// BlockNote 에디터 컨텐츠 타입
export interface BlockNoteContent {
  blocks: any[]; // BlockNote의 JSON 형식 (serialized)
  version: string;
}

// Step 블록 전용 속성
export interface StepBlockProperties extends BaseBlockProperties {
  desc?: string; // 단계 설명
  content?: string[]; // 단계의 실제 내용 (텍스트 기반)
  editorContent?: BlockNoteContent; // BlockNote 에디터 컨텐츠 (블록 기반)
  stepIdInGroup?: number; // 그룹 내 순서
}

// Step 블록 - 개별 콘텐츠 단위
export interface StepBlock extends BaseBlock {
  type: BlockType.STEP;
  properties: StepBlockProperties;
}

// UI 렌더링을 위한 전역 인덱스가 포함된 강화된 Step 블록
export interface FlattenedBlock extends StepBlock {
  globalIndex: number;
}

// DOM 조작을 위한 단계 컨테이너 참조 맵
export type StepContainerMap = Record<string, HTMLDivElement | null>;

/**
 * Step 블록을 위한 타입 가드
 * @param block 확인할 블록
 * @returns 블록이 StepBlock이면 true 반환
 */
export function isStepBlock(block: any): block is StepBlock {
  return block?.type === BlockType.STEP;
}

/**
 * Step 블록의 타이틀 가져오기
 * @param block Step 블록
 */
export function getStepTitle(block: StepBlock): string {
  return block.properties.title || "제목 없는 단계";
}

/**
 * Step 블록의 내용 가져오기
 * @param block Step 블록
 * @returns 내용 배열(설정되지 않은 경우 빈 배열)
 */
export function getStepContent(block: StepBlock): string[] {
  return block.properties.content || [];
}
