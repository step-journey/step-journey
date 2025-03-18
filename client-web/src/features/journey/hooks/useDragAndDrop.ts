import { useState } from "react";
import {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { Block, BlockType, StepBlock } from "@/features/block/types";
import { updateBlock } from "@/features/block/services/blockService";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";

interface DragAndDropState {
  activeId: string | null;
  activeBlock: Block | null;
  activeGroupId: string | null;
  overGroupId: string | null;
  insertPosition: { groupId: string; index: number } | null;
}

interface UseDragAndDropProps {
  journeyId: string | undefined;
  allBlocks: Block[];
  onExpandGroup?: (groupId: string) => void;
}

export const useDragAndDrop = ({
  journeyId,
  allBlocks,
  onExpandGroup,
}: UseDragAndDropProps) => {
  const queryClient = useQueryClient();

  // State for drag & drop
  const [state, setState] = useState<DragAndDropState>({
    activeId: null,
    activeBlock: null,
    activeGroupId: null,
    overGroupId: null,
    insertPosition: null,
  });

  // Sensors configuration for dnd-kit - 더 민감하게 반응하도록 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px of movement required before drag starts
      },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;

    const stepData = active.data.current;
    if (stepData && stepData.block) {
      setState({
        activeId: active.id as string,
        activeBlock: stepData.block as Block,
        activeGroupId: stepData.block.parentId,
        overGroupId: null,
        insertPosition: null,
      });
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setState((prev) => ({
        ...prev,
        overGroupId: null,
        insertPosition: null,
      }));
      return;
    }

    // Get the data from the over element
    const overData = over.data.current;
    if (!overData) return;

    // Handle hovering over a step group
    if (overData.type === "stepGroup") {
      setState((prev) => ({
        ...prev,
        overGroupId: overData.groupId,
        insertPosition: null,
      }));
    }
    // Handle hovering over a gap between steps
    else if (overData.type === "stepGap") {
      setState((prev) => ({
        ...prev,
        overGroupId: null,
        insertPosition: {
          groupId: overData.groupId,
          index: overData.index,
        },
      }));
    }
    // Reset when hovering elsewhere
    else {
      setState((prev) => ({
        ...prev,
        overGroupId: null,
        insertPosition: null,
      }));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    // Store current state before resetting
    const { activeId, activeGroupId: previousGroupId } = state;

    // Reset states first
    setState({
      activeId: null,
      activeBlock: null,
      activeGroupId: null,
      overGroupId: null,
      insertPosition: null,
    });

    // Get the active step
    if (!over || !active || !journeyId || !previousGroupId || !activeId) return;

    const stepBlock = allBlocks.find((block) => block.id === activeId) as
      | StepBlock
      | undefined;
    if (!stepBlock) return;

    try {
      // Handle dropping onto a step group
      if (over.data.current?.type === "stepGroup") {
        const targetGroupId = over.data.current.groupId;

        // If dropping to the same group, do nothing
        if (targetGroupId === previousGroupId) return;

        // Find the target group
        const targetGroup = allBlocks.find(
          (block) => block.id === targetGroupId,
        );
        if (!targetGroup) return;

        // Find the source group and remove the step
        const sourceGroup = allBlocks.find(
          (block) => block.id === previousGroupId,
        );
        if (!sourceGroup) return;

        // Update source group by removing the step
        await updateBlock({
          id: previousGroupId,
          childrenIds: sourceGroup.childrenIds.filter((id) => id !== activeId),
        });

        // Update target group by adding the step
        await updateBlock({
          id: targetGroupId,
          childrenIds: [...targetGroup.childrenIds, activeId],
        });

        await updateBlock({
          id: activeId,
          parentId: targetGroupId,
          properties: {
            ...stepBlock.properties,
            // Global index will be updated when the journey is reloaded
          },
        });

        // Auto-expand the target group if it's collapsed
        if (onExpandGroup) {
          onExpandGroup(targetGroupId);
        }
      }
      // Handle dropping between steps
      else if (over.data.current?.type === "stepGap" && state.insertPosition) {
        const { groupId: targetGroupId } = state.insertPosition;

        // Find the target group
        const targetGroup = allBlocks.find(
          (block) => block.id === targetGroupId,
        );
        if (!targetGroup) return;

        // Find step blocks in the target group
        const stepsInTargetGroup = allBlocks.filter(
          (block) =>
            block.parentId === targetGroupId && block.type === BlockType.STEP,
        ) as StepBlock[];

        // Sort steps by their globalIndex
        stepsInTargetGroup.sort(
          (a, b) =>
            (a.properties.globalIndex ?? 0) - (b.properties.globalIndex ?? 0),
        );

        // Remove step from source group if it's a different group
        if (previousGroupId !== targetGroupId) {
          const sourceGroup = allBlocks.find(
            (block) => block.id === previousGroupId,
          );
          if (!sourceGroup) return;

          await updateBlock({
            id: previousGroupId,
            childrenIds: sourceGroup.childrenIds.filter(
              (id) => id !== activeId,
            ),
          });

          // Insert step into target group
          const newChildrenIds = [...targetGroup.childrenIds];
          if (!newChildrenIds.includes(activeId)) {
            newChildrenIds.push(activeId);
          }

          await updateBlock({
            id: targetGroupId,
            childrenIds: newChildrenIds,
          });

          // Update step's parentId
          await updateBlock({
            id: activeId,
            parentId: targetGroupId,
          });

          // Auto-expand the target group if it's collapsed
          if (onExpandGroup) {
            onExpandGroup(targetGroupId);
          }
        }

        // The globalIndex values will be recalculated when journey data is reloaded
        // So we don't need to manually update them here

        // Wait for all updates to complete
        await queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.journeys.detail(journeyId),
        });

        toast.success("Step position updated");
      }
    } catch (error) {
      console.error("Failed to update step position:", error);
      toast.error("Failed to update step position");
    }
  };

  return {
    ...state,
    sensors,
    collisionDetection: closestCenter,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
};
