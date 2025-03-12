import { useMemo } from "react";
import {
  Block,
  BlockType,
  JourneyBlock,
  StepGroupBlock,
  StepBlock,
} from "../types";

/**
 * 블록 데이터를 다양한 방법으로 필터링하고 조회하는 훅
 *
 * @param allBlocks 모든 블록 목록
 * @returns 블록 데이터 조회 및 필터링 메서드
 */
export function useBlockData(allBlocks: Block[]) {
  // 모든 여정 블록 찾기
  const journeyBlocks = useMemo(() => {
    return allBlocks.filter(
      (block) => block.type === BlockType.JOURNEY,
    ) as JourneyBlock[];
  }, [allBlocks]);

  // 모든 스텝 그룹 블록 찾기
  const stepGroupBlocks = useMemo(() => {
    return allBlocks.filter(
      (block) => block.type === BlockType.STEP_GROUP,
    ) as StepGroupBlock[];
  }, [allBlocks]);

  // 모든 스텝 블록 찾기
  const stepBlocks = useMemo(() => {
    return allBlocks.filter(
      (block) => block.type === BlockType.STEP,
    ) as StepBlock[];
  }, [allBlocks]);

  // 특정 ID의 블록 찾기
  const getBlockById = (id: string) => {
    return allBlocks.find((block) => block.id === id);
  };

  // 특정 부모 ID를 가진 블록들 찾기
  const getChildBlocks = (parentId: string) => {
    return allBlocks.filter((block) => block.parentId === parentId);
  };

  // 특정 부모 ID와 타입을 가진 블록들 찾기
  const getChildBlocksByType = <T extends Block>(
    parentId: string,
    type: BlockType,
  ) => {
    return allBlocks.filter(
      (block) => block.parentId === parentId && block.type === type,
    ) as T[];
  };

  return {
    journeyBlocks,
    stepGroupBlocks,
    stepBlocks,
    getBlockById,
    getChildBlocks,
    getChildBlocksByType,
  };
}
