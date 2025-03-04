import React, { useState, useEffect, useCallback, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { IconPlus } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { useEditorContext } from "./EditorContext";
import BlockTypeMenu from "./BlockTypeMenu";
import BlockList from "./BlockList";

export interface Block {
  id: string;
  type: string;
  content: string;
  attrs?: Record<string, any>;
}

export interface EditorProps {
  initialContent?: Block[];
  onChange?: (blocks: Block[]) => void;
  placeholder?: string;
  editable?: boolean;
}

export function Editor({
  initialContent,
  onChange,
  placeholder = "Type '/' for commands...",
  editable = true,
}: EditorProps) {
  // 초기 컨텐츠가 없으면 기본 텍스트 블록 생성
  const defaultContent = useMemo(
    () => [{ id: uuidv4(), type: "paragraph", content: "", attrs: {} }],
    [],
  );

  const [blocks, setBlocks] = useState<Block[]>(
    initialContent || defaultContent,
  );
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(
    initialContent?.[0]?.id || defaultContent[0].id || null,
  );
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [addMenuAnchorPoint, setAddMenuAnchorPoint] = useState({ x: 0, y: 0 });
  const { setIsEditing } = useEditorContext();

  // Set editable state
  useEffect(() => {
    setIsEditing(editable);
  }, [editable, setIsEditing]);

  // Handle block updates
  const updateBlock = useCallback((id: string, updates: Partial<Block>) => {
    setBlocks((prevBlocks) => {
      return prevBlocks.map((block) => {
        if (block.id === id) {
          return { ...block, ...updates };
        }
        return block;
      });
    });
  }, []);

  // Add a new block after the specified block
  const addBlockAfter = useCallback(
    (afterId: string, newBlock: Omit<Block, "id">) => {
      const id = uuidv4();
      setBlocks((prevBlocks) => {
        const index = prevBlocks.findIndex((block) => block.id === afterId);
        if (index === -1) return prevBlocks;

        const newBlocks = [...prevBlocks];
        newBlocks.splice(index + 1, 0, { id, ...newBlock });
        return newBlocks;
      });

      // Select the new block
      setTimeout(() => {
        setSelectedBlockId(id);
      }, 0);
    },
    [],
  );

  // Delete a block by ID
  const deleteBlock = useCallback((id: string) => {
    setBlocks((prevBlocks) => {
      // Don't allow deleting the last block
      if (prevBlocks.length <= 1) return prevBlocks;

      const index = prevBlocks.findIndex((block) => block.id === id);
      if (index === -1) return prevBlocks;

      const newBlocks = [...prevBlocks];
      newBlocks.splice(index, 1);

      // Select previous or next block
      const nextSelectedIndex = Math.max(0, index - 1);
      setTimeout(() => {
        setSelectedBlockId(newBlocks[nextSelectedIndex].id);
      }, 0);

      return newBlocks;
    });
  }, []);

  // Convert a block to a different type
  const convertBlock = useCallback(
    (id: string, newType: string, attrs: Record<string, any> = {}) => {
      setBlocks((prevBlocks) => {
        return prevBlocks.map((block) => {
          if (block.id === id) {
            return {
              ...block,
              type: newType,
              attrs: { ...block.attrs, ...attrs },
            };
          }
          return block;
        });
      });
    },
    [],
  );

  // Move a block to a new position
  const moveBlock = useCallback((activeId: string, overId: string) => {
    setBlocks((prevBlocks) => {
      const oldIndex = prevBlocks.findIndex((block) => block.id === activeId);
      const newIndex = prevBlocks.findIndex((block) => block.id === overId);

      if (oldIndex === -1 || newIndex === -1) return prevBlocks;

      const newBlocks = [...prevBlocks];
      const [removed] = newBlocks.splice(oldIndex, 1);
      newBlocks.splice(newIndex, 0, removed);

      return newBlocks;
    });
  }, []);

  // Handle editor content change
  useEffect(() => {
    onChange?.(blocks);
  }, [blocks, onChange]);

  // Handle block selection
  const handleBlockSelect = useCallback((id: string) => {
    setSelectedBlockId(id);
  }, []);

  // Handle add block button click
  const handleAddBlockClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setAddMenuAnchorPoint({ x: rect.left, y: rect.bottom });
    setShowAddMenu(true);
  }, []);

  // Handle new block type selection
  const handleBlockTypeSelect = useCallback(
    (type: string) => {
      if (!selectedBlockId) return;

      addBlockAfter(selectedBlockId, {
        type,
        content: "",
        attrs: {},
      });

      setShowAddMenu(false);
    },
    [selectedBlockId, addBlockAfter],
  );

  // Handle key press in blocks
  const handleBlockKeyDown = useCallback(
    (e: React.KeyboardEvent, id: string, index: number) => {
      const currentBlock = blocks.find((block) => block.id === id);
      if (!currentBlock) return;

      // Enter key handling
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();

        // Add a new paragraph block after the current one
        addBlockAfter(id, {
          type: "paragraph",
          content: "",
          attrs: {},
        });
      }

      // Backspace key handling (at the beginning of a block)
      if (
        e.key === "Backspace" &&
        (e.currentTarget as HTMLElement).textContent === ""
      ) {
        e.preventDefault();
        deleteBlock(id);
      }

      // Slash command handling
      if (
        e.key === "/" &&
        (e.currentTarget as HTMLElement).textContent === ""
      ) {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        setAddMenuAnchorPoint({ x: rect.left, y: rect.bottom });
        setShowAddMenu(true);
      }

      // Arrow keys for navigation between blocks
      if (e.key === "ArrowUp" && index > 0) {
        e.preventDefault();
        setSelectedBlockId(blocks[index - 1].id);
      }

      if (e.key === "ArrowDown" && index < blocks.length - 1) {
        e.preventDefault();
        setSelectedBlockId(blocks[index + 1].id);
      }
    },
    [blocks, addBlockAfter, deleteBlock],
  );

  return (
    <div className="noble-editor border border-border rounded-md overflow-hidden bg-background">
      <BlockList
        blocks={blocks}
        selectedBlockId={selectedBlockId}
        onBlockSelect={handleBlockSelect}
        onBlockUpdate={updateBlock}
        onBlockDelete={deleteBlock}
        onBlockConvert={convertBlock}
        onBlockMove={moveBlock}
        onBlockKeyDown={handleBlockKeyDown}
        placeholder={placeholder}
        editable={editable}
      />

      <div className="flex justify-center my-2">
        <button
          onClick={handleAddBlockClick}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-muted transition-colors",
          )}
        >
          <IconPlus size={18} />
        </button>
      </div>

      {showAddMenu && (
        <BlockTypeMenu
          position={addMenuAnchorPoint}
          onSelect={handleBlockTypeSelect}
          onClose={() => setShowAddMenu(false)}
        />
      )}
    </div>
  );
}

export default Editor;
