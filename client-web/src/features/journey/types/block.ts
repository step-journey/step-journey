/**
 * 블록 데이터 모델
 *
 * StepJourney 애플리케이션 전반에서 사용되는 블록 기반 콘텐츠 모델의 핵심 데이터 구조를 정의합니다.
 * 여러 블록 변형(Journey, StepGroup, Step), 블록 작업을 위한 유틸리티,
 * 그리고 블록 속성에 타입 안전하게 접근하는 헬퍼 함수를 포함합니다.
 */

// =========================================================
// 기본 타입
// =========================================================

/** 블록의 고유 식별자 */
export type UUID = string;

/** 블록에 첨부할 수 있는 미디어 객체 */
export interface Media {
  type: "image" | "gif" | "video";
  url: string;
  alt?: string;
  caption?: string;
}

/** 모든 블록에 공통적인 타임스탬프 필드 */
interface TimeStampFields {
  createdAt: string;
  updatedAt: string;
}

// =========================================================
// 블록 타입
// =========================================================

/** 사용 가능한 블록 타입 열거형 */
export enum BlockType {
  JOURNEY = "journey",
  STEP_GROUP = "step_group",
  STEP = "step",
}

// =========================================================
// 블록 속성
// =========================================================

/** 모든 블록 타입에 공통적인 기본 속성 */
export interface BaseBlockProperties {
  title?: string;
  description?: string;
}

/** Journey 블록 전용 속성 */
export interface JourneyBlockProperties extends BaseBlockProperties {
  pinnedProblem?: {
    text: string;
    media?: Media;
  };
}

/** StepGroup 블록 전용 속성 */
export interface StepGroupBlockProperties extends BaseBlockProperties {
  groupLabel?: string;
}

/** Step 블록 전용 속성 */
export interface StepBlockProperties extends BaseBlockProperties {
  label?: string; // 단계 레이블
  desc?: string; // 단계 설명
  content?: string[]; // 단계의 실제 내용
  stepIdInGroup?: number; // 그룹 내 순서
  highlightedKeywordsInProblem?: string[]; // 문제에서 강조할 키워드
}

// =========================================================
// 블록 인터페이스
// =========================================================

/** 공통 필드를 가진 기본 블록 인터페이스 */
export interface BaseBlock extends TimeStampFields {
  id: UUID;
  type: BlockType;
  workspaceId?: UUID;
  parentId?: UUID;
  content: UUID[];
  createdBy: UUID;
}

/** Journey 블록 - 최상위 컨테이너 */
export interface JourneyBlock extends BaseBlock {
  type: BlockType.JOURNEY;
  properties: JourneyBlockProperties;
}

/** StepGroup 블록 - 관련 단계들을 그룹화 */
export interface StepGroupBlock extends BaseBlock {
  type: BlockType.STEP_GROUP;
  properties: StepGroupBlockProperties;
}

/** Step 블록 - 개별 콘텐츠 단위 */
export interface StepBlock extends BaseBlock {
  type: BlockType.STEP;
  properties: StepBlockProperties;
}

/** 모든 가능한 블록 타입의 유니온 타입 */
export type Block = JourneyBlock | StepGroupBlock | StepBlock;

/** UI 렌더링을 위한 전역 인덱스가 포함된 강화된 Step 블록 */
export interface FlattenedBlock extends StepBlock {
  globalIndex: number;
}

/** DOM 조작을 위한 단계 컨테이너 참조 맵 */
export type StepContainerMap = Record<string, HTMLDivElement | null>;

// =========================================================
// JSON 형식 (직렬화/역직렬화용)
// =========================================================

/** 블록의 원시 JSON 표현 */
export interface RawJsonBlock {
  id: string;
  type: string; // 문자열 값으로서의 "journey", "step_group", "step"
  parentId?: string;
  properties: {
    title?: string;
    description?: string;
    pinnedProblem?: {
      text: string;
    };
    groupLabel?: string;
    label?: string;
    desc?: string;
    content?: string[];
    stepIdInGroup?: number;
    highlightedKeywordsInProblem?: string[];
  };
  content: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// =========================================================
// 타입 가드
// =========================================================

/**
 * Journey 블록을 위한 타입 가드
 * @param block 확인할 블록
 * @returns 블록이 JourneyBlock이면 true 반환
 */
export function isJourneyBlock(block: Block): block is JourneyBlock {
  return block.type === BlockType.JOURNEY;
}

/**
 * StepGroup 블록을 위한 타입 가드
 * @param block 확인할 블록
 * @returns 블록이 StepGroupBlock이면 true 반환
 */
export function isStepGroupBlock(block: Block): block is StepGroupBlock {
  return block.type === BlockType.STEP_GROUP;
}

/**
 * Step 블록을 위한 타입 가드
 * @param block 확인할 블록
 * @returns 블록이 StepBlock이면 true 반환
 */
export function isStepBlock(block: Block): block is StepBlock {
  return block.type === BlockType.STEP;
}

// =========================================================
// 변환 유틸리티
// =========================================================

/**
 * 원시 JSON 블록을 타입이 지정된 Block으로 변환
 * @param rawBlock 블록의 JSON 표현
 * @returns 타입이 지정된 Block 인스턴스
 */
export function rawJsonToBlock(rawBlock: RawJsonBlock): Block {
  // 공통 필드가 있는 기본 블록 생성
  const baseBlock: BaseBlock = {
    id: rawBlock.id,
    type:
      rawBlock.type === "journey"
        ? BlockType.JOURNEY
        : rawBlock.type === "step_group"
          ? BlockType.STEP_GROUP
          : BlockType.STEP,
    parentId: rawBlock.parentId,
    content: Array.isArray(rawBlock.content) ? rawBlock.content : [],
    createdAt: rawBlock.createdAt || new Date().toISOString(),
    updatedAt: rawBlock.updatedAt || new Date().toISOString(),
    createdBy: rawBlock.createdBy || "system",
  };

  // type 필드에 따라 특정 블록 타입 생성
  switch (baseBlock.type) {
    case BlockType.JOURNEY:
      return {
        ...baseBlock,
        type: BlockType.JOURNEY,
        properties: {
          title: rawBlock.properties.title,
          description: rawBlock.properties.description,
          pinnedProblem: rawBlock.properties.pinnedProblem
            ? {
                text: rawBlock.properties.pinnedProblem.text || "",
              }
            : undefined,
        },
      };

    case BlockType.STEP_GROUP:
      return {
        ...baseBlock,
        type: BlockType.STEP_GROUP,
        properties: {
          title: rawBlock.properties.title,
          description: rawBlock.properties.description,
          groupLabel: rawBlock.properties.groupLabel,
        },
      };

    case BlockType.STEP:
      return {
        ...baseBlock,
        type: BlockType.STEP,
        properties: {
          title: rawBlock.properties.title,
          description: rawBlock.properties.description,
          label: rawBlock.properties.label,
          desc: rawBlock.properties.desc,
          content: rawBlock.properties.content,
          stepIdInGroup: rawBlock.properties.stepIdInGroup,
          highlightedKeywordsInProblem:
            rawBlock.properties.highlightedKeywordsInProblem,
        },
      };

    default:
      throw new Error(`알 수 없는 블록 타입: ${rawBlock.type}`);
  }
}

// =========================================================
// 블록 관계 유틸리티
// =========================================================

/**
 * 부모 블록의 모든 자식 블록 가져오기
 * @param parentBlock 부모 블록
 * @param allBlocks 사용 가능한 모든 블록 배열
 * @returns 자식 블록 배열
 */
export function getChildBlocks(
  parentBlock: Block,
  allBlocks: Block[],
): Block[] {
  return parentBlock.content
    .map((id) => allBlocks.find((block) => block.id === id))
    .filter(Boolean) as Block[];
}

/**
 * 특정 타입의 자식 블록 가져오기
 * @param parentBlock 부모 블록
 * @param allBlocks 사용 가능한 모든 블록 배열
 * @param type 필터링할 블록 타입
 * @returns 지정된 타입의 자식 블록 배열
 */
export function getChildBlocksByType<T extends Block>(
  parentBlock: Block,
  allBlocks: Block[],
  type: BlockType,
): T[] {
  return getChildBlocks(parentBlock, allBlocks).filter(
    (block) => block.type === type,
  ) as T[];
}

/**
 * 블록 계층 구조의 평면화된 표현 생성
 * @param journeyBlock 최상위 Journey 블록
 * @param allBlocks 사용 가능한 모든 블록 배열
 * @returns 전역 인덱스가 있는 평면화된 단계 블록 배열
 */
export function flattenBlocks(
  journeyBlock: Block,
  allBlocks: Block[],
): FlattenedBlock[] {
  if (!isJourneyBlock(journeyBlock)) {
    throw new Error("Journey 블록이 아닙니다");
  }

  const result: FlattenedBlock[] = [];
  let globalIndex = 0;

  // StepGroup 블록 가져오기
  const stepGroupBlocks = getChildBlocksByType<StepGroupBlock>(
    journeyBlock,
    allBlocks,
    BlockType.STEP_GROUP,
  );

  // 각 StepGroup에 대해 Step 블록 가져오기
  stepGroupBlocks.forEach((groupBlock) => {
    const stepBlocks = getChildBlocksByType<StepBlock>(
      groupBlock,
      allBlocks,
      BlockType.STEP,
    );

    // 각 Step을 globalIndex와 함께 결과에 추가
    stepBlocks.forEach((stepBlock) => {
      const flatBlock: FlattenedBlock = {
        ...stepBlock,
        globalIndex,
      };

      result.push(flatBlock);
      globalIndex++;
    });
  });

  return result;
}

// =========================================================
// 속성 접근 유틸리티
// =========================================================

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

/**
 * Journey 블록의 고정된 문제 가져오기
 * @param block Journey 블록
 * @returns 고정된 문제 객체 또는 undefined
 */
export function getJourneyProblem(block: JourneyBlock) {
  return block.properties.pinnedProblem;
}

/**
 * StepGroup 블록의 레이블 가져오기
 * @param block StepGroup 블록
 * @returns 대체 값이 있는 레이블 문자열
 */
export function getStepGroupLabel(block: StepGroupBlock): string {
  return block.properties.groupLabel || "제목 없는 그룹";
}

/**
 * Step 블록의 레이블 가져오기
 * @param block Step 블록
 * @returns 대체 값이 있는 레이블 문자열
 */
export function getStepLabel(block: StepBlock): string {
  return block.properties.label || "제목 없는 단계";
}

/**
 * Step 블록의 내용 가져오기
 * @param block Step 블록
 * @returns 내용 배열(설정되지 않은 경우 빈 배열)
 */
export function getStepContent(block: StepBlock): string[] {
  return block.properties.content || [];
}

/**
 * 모든 블록 타입의 제목/레이블을 가져오는 다형적 함수
 * @param block 모든 블록 타입
 * @returns 대체 값이 있는 적절한 제목 또는 레이블
 */
export function getBlockTitle(block: Block): string {
  if (isJourneyBlock(block)) {
    return getJourneyTitle(block);
  } else if (isStepGroupBlock(block)) {
    return block.properties.title || getStepGroupLabel(block);
  } else if (isStepBlock(block)) {
    return block.properties.title || getStepLabel(block);
  }

  return "제목 없는 블록";
}
