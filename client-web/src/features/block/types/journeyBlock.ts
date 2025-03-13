/**
 * Journey 블록 관련 타입 및 유틸리티 함수
 */

import { BaseBlock, BaseBlockProperties, BlockType } from "./baseBlock";

// Journey 블록 전용 속성
export interface JourneyBlockProperties extends BaseBlockProperties {
  description?: string;
}

// Journey 블록 - 최상위 컨테이너
export interface JourneyBlock extends BaseBlock {
  type: BlockType.JOURNEY;
  properties: JourneyBlockProperties;
}

/**
 * Journey 블록을 위한 타입 가드
 * @param block 확인할 블록
 * @returns 블록이 JourneyBlock이면 true 반환
 */
export function isJourneyBlock(block: any): block is JourneyBlock {
  return block?.type === BlockType.JOURNEY;
}

/**
 * Journey 블록의 제목 가져오기
 * @param block Journey 블록
 * @returns 대체 값이 있는 제목 문자열
 */
export function getJourneyTitle(block: JourneyBlock): string {
  return block.properties.title || "제목 없는 Journey";
}

/**
 * Journey 블록의 설명 가져오기
 * @param block Journey 블록
 * @returns 설명 문자열(설정되지 않은 경우 빈 문자열)
 */
export function getJourneyDescription(block: JourneyBlock): string {
  return block.properties.description || "";
}
