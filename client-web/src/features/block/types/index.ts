/**
 * 블록 데이터 모델 타입 정의
 *
 * 모든 블록 관련 타입들을 재내보내기
 */

// 기본 타입 및 인터페이스 재내보내기
export * from "./baseBlock";

// Journey 블록 관련 타입 및 함수 재내보내기
export * from "./journeyBlock";

// StepGroup 블록 관련 타입 및 함수 재내보내기
export * from "./stepGroupBlock";

// Step 블록 관련 타입 및 함수 재내보내기
export * from "./stepBlock";

// 모든 가능한 블록 타입의 유니온 타입
import { JourneyBlock } from "./journeyBlock";
import { StepGroupBlock } from "./stepGroupBlock";
import { StepBlock } from "./stepBlock";

export type Block = JourneyBlock | StepGroupBlock | StepBlock;
