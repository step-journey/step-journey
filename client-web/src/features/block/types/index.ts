import { JourneyBlock } from "./journeyBlock";
import { StepGroupBlock } from "./stepGroupBlock";
import { StepBlock } from "./stepBlock";
import { ParagraphBlock } from "./paragraphBlock";
import { HeadingBlock } from "./headingBlock";
import { BulletListItemBlock } from "./bulletListItemBlock";
import { NumberedListItemBlock } from "./numberedListItemBlock";
import { CheckListItemBlock } from "./checkListItemBlock";
import { CodeBlock } from "./codeBlock";
import { TableBlock } from "./tableBlock";
import { ImageBlock } from "./imageBlock";
import { ColumnBlock, ColumnListBlock } from "./multiColumnBlock";
import { AlertBlock } from "./alertBlock";

/**
 * 블록 타입 시스템의 중앙 진입점 (Barrel Pattern)
 *
 * 이 파일은 모든 블록 관련 타입을 하나의 모듈로 통합하여 외부에 노출함
 * 이를 통해 앱 전반에서 @/features/block/types 경로로 블록 타입 접근 가능
 */

// 기본 타입 및 인터페이스 재내보내기
export * from "./baseBlock";

// BlockNote 기반 블록의 기본 타입 재내보내기
export * from "./blockNoteBaseTypes";

// 개별 블록 타입 재내보내기
export * from "./journeyBlock";
export * from "./stepGroupBlock";
export * from "./stepBlock";
export * from "./paragraphBlock";
export * from "./headingBlock";
export * from "./bulletListItemBlock";
export * from "./numberedListItemBlock";
export * from "./checkListItemBlock";
export * from "./codeBlock";
export * from "./tableBlock";
export * from "./imageBlock";
export * from "./multiColumnBlock";
export * from "./alertBlock";

// 모든 가능한 블록 타입의 유니온 타입
export type Block =
  | JourneyBlock
  | StepGroupBlock
  | StepBlock
  | ParagraphBlock
  | HeadingBlock
  | BulletListItemBlock
  | NumberedListItemBlock
  | CheckListItemBlock
  | CodeBlock
  | TableBlock
  | ImageBlock
  | ColumnBlock
  | ColumnListBlock
  | AlertBlock;
