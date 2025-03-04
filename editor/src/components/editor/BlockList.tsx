import { useCallback } from "react";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Block } from "./Editor";
import BlockItem from "./BlockItem";

interface BlockListProps {
  blocks: Block[];
  selectedBlockId: string | null;
  onBlockSelect: (id: string) => void;
  onBlockUpdate: (id: string, updates: Partial<Block>) => void;
  onBlockDelete: (id: string) => void;
  onBlockConvert: (
    id: string,
    newType: string,
    attrs?: Record<string, any>,
  ) => void;
  onBlockMove: (activeId: string, overId: string) => void;
  onBlockKeyDown: (e: React.KeyboardEvent, id: string, index: number) => void;
  placeholder?: string;
  editable?: boolean;
}

const BlockList = ({
  blocks,
  selectedBlockId,
  onBlockSelect,
  onBlockUpdate,
  onBlockDelete,
  onBlockConvert,
  onBlockMove,
  onBlockKeyDown,
  placeholder = "Type something...",
  editable = true,
}: BlockListProps) => {
  // Configure DnD sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8, // Start dragging after moving 8px
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // Start dragging after 250ms
        tolerance: 8, // or moving 8px
      },
    }),
    useSensor(KeyboardSensor),
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        onBlockMove(active.id as string, over.id as string);
      }
    },
    [onBlockMove],
  );

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext
        items={blocks.map((block) => block.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="blocks-container">
          {blocks.map((block, index) => (
            <BlockItem
              key={block.id}
              block={block}
              index={index}
              isSelected={block.id === selectedBlockId}
              editable={editable}
              placeholder={placeholder}
              onSelect={() => onBlockSelect(block.id)}
              onUpdate={(updates) => onBlockUpdate(block.id, updates)}
              onDelete={() => onBlockDelete(block.id)}
              onConvert={(newType, attrs) =>
                onBlockConvert(block.id, newType, attrs)
              }
              onKeyDown={(e) => onBlockKeyDown(e, block.id, index)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default BlockList;
