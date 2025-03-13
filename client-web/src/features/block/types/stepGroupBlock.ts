/**
 * StepGroup 블록 관련 타입 및 유틸리티 함수
 */

import { BaseBlock, BaseBlockProperties, BlockType } from "./baseBlock";

// StepGroup 블록 전용 속성
export interface StepGroupBlockProperties extends BaseBlockProperties {
  title?: string;
}

// StepGroup 블록 - 관련 단계들을 그룹화
export interface StepGroupBlock extends BaseBlock {
  type: BlockType.STEP_GROUP;
  properties: StepGroupBlockProperties;
}

/**
 * StepGroup 블록을 위한 타입 가드
 * @param block 확인할 블록
 * @returns 블록이 StepGroupBlock이면 true 반환
 */
export function isStepGroupBlock(block: any): block is StepGroupBlock {
  return block?.type === BlockType.STEP_GROUP;
}

/**
 * StepGroup 블록의 레이블 가져오기
 * @param block StepGroup 블록
 * @returns 대체 값이 있는 레이블 문자열
 */
export function getStepGroupTitle(block: StepGroupBlock): string {
  return block.properties.title || "제목 없는 그룹";
}
