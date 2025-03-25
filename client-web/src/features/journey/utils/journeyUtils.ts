import { Block, BlockType, JourneyBlock } from "@/features/block/types";
import { GROUP_ORDER_MULTIPLIER } from "@/features/journey/constants/orderConstants";

/**
 * 특정 그룹의 기준 order 값을 계산하는 함수
 * 여정 내 그룹의 위치에 따라 적절한 order 오프셋 반환
 */
export const calculateStepGroupBaseOrder = (
  journeyBlock: JourneyBlock | Block | null | undefined,
  groupId: string,
  allBlocks: Block[],
): number => {
  if (!journeyBlock) return 0;

  // Step Group 만 필터링
  const stepGroupIds = journeyBlock.childrenIds.filter((id) => {
    const block = allBlocks.find((b) => b.id === id);
    return block && block.type === BlockType.STEP_GROUP;
  });

  // 현재 그룹의 인덱스 찾기
  const groupIndex = stepGroupIds.indexOf(groupId);

  // 그룹을 찾지 못한 경우 - 새로 생성된 그룹일 가능성이 있음
  if (groupIndex === -1) {
    // 새로 생성된 그룹이 마지막에 추가되었다고 가정
    const newIndex = stepGroupIds.length;
    return newIndex * GROUP_ORDER_MULTIPLIER;
  }

  // GROUP_ORDER_MULTIPLIER 를 곱하여 기준 order 값 반환
  return groupIndex * GROUP_ORDER_MULTIPLIER;
};
