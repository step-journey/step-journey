import { Block, BlockType, FlattenedBlock } from "../types";

/**
 * 현재 단계까지의 모든 내용을 누적하여 표시할 accumulatedContent 객체를 만드는 함수
 *
 * @param currentStep 현재 단계
 * @param allSteps 모든 단계 목록
 * @returns 현재 단계까지의 모든 내용이 누적된 객체 배열
 */
export function getAccumulatedContent(
  currentStep: FlattenedBlock | null,
  allSteps: FlattenedBlock[],
) {
  if (!currentStep) return [];

  const hasContent = !!currentStep.properties.content?.length;

  if (!hasContent) return [];

  return allSteps
    .filter(
      (step) =>
        step.globalIndex <= currentStep.globalIndex &&
        step.properties.content?.length,
    )
    .map((step) => {
      const isCurrentStep = step.globalIndex === currentStep.globalIndex;
      const content = step.properties.content?.join("\n") || "";

      return {
        step,
        content,
        isCurrentStep,
      };
    });
}

/**
 * 블록 ID에 해당하는 블록을 찾는 함수
 *
 * @param blockId 찾을 블록 ID
 * @param allBlocks 모든 블록 목록
 * @returns 찾은 블록 또는 undefined
 */
export function findBlockById(
  blockId: string,
  allBlocks: Block[],
): Block | undefined {
  return allBlocks.find((block) => block.id === blockId);
}

/**
 * 특정 블록 타입에 해당하는 자식 블록들을 찾는 함수
 *
 * @param parentId 부모 블록 ID
 * @param blockType 찾을 블록 타입
 * @param allBlocks 모든 블록 목록
 * @returns 찾은 블록 목록
 */
export function findChildBlocksByType(
  parentId: string,
  blockType: BlockType,
  allBlocks: Block[],
): Block[] {
  return allBlocks.filter(
    (block) => block.parentId === parentId && block.type === blockType,
  );
}
