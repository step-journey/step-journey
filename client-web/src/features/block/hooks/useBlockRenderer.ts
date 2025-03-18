import { useMemo } from "react";
import { BlockType, Block, StepBlock } from "../types";
import { findBlockById, findChildBlocksByType } from "../utils/renderUtils";

/**
 * 블록 렌더링에 필요한 데이터를 제공하는 훅
 *
 * @param journeyId 여정 ID
 * @param allBlocks 모든 블록 목록
 * @param flattenedSteps 평면화된 스텝 목록
 * @param currentStepOrder 현재 활성화된 스텝의 정렬 순서
 * @returns 렌더링에 필요한 데이터 객체
 */
export function useBlockRenderer(
  journeyId: string,
  allBlocks: Block[],
  flattenedSteps: StepBlock[],
  currentStepOrder: number,
) {
  // 여정 블록 찾기
  const journeyBlock = useMemo(() => {
    return findBlockById(journeyId, allBlocks);
  }, [journeyId, allBlocks]);

  // 현재 스텝 찾기
  const currentStep = useMemo(() => {
    return flattenedSteps[currentStepOrder] || null;
  }, [flattenedSteps, currentStepOrder]);

  // 스텝 그룹 블록들 찾기
  const stepGroupBlocks = useMemo(() => {
    if (!journeyBlock) return [];
    return findChildBlocksByType(
      journeyBlock.id,
      BlockType.STEP_GROUP,
      allBlocks,
    );
  }, [journeyBlock, allBlocks]);

  // 현재 스텝의 부모 그룹 찾기
  const currentStepGroup = useMemo(() => {
    if (!currentStep || !currentStep.parentId) return null;
    return findBlockById(currentStep.parentId, allBlocks);
  }, [currentStep, allBlocks]);

  return {
    journeyBlock,
    currentStep,
    stepGroupBlocks,
    currentStepGroup,
  };
}
