import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEditor, EditorContent } from "@tiptap/react";
import { createBlockExtension } from "@/lib/editor/config";
import { Block } from "./Editor";
import BlockControls from "./BlockControls";
import { IconGripVertical, IconPlus } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { useEditorContext } from "./EditorContext";

interface BlockItemProps {
  block: Block;
  index: number;
  isSelected: boolean;
  editable: boolean;
  placeholder: string;
  onSelect: () => void;
  onUpdate: (updates: Partial<Block>) => void;
  onDelete: () => void;
  onConvert: (newType: string, attrs?: Record<string, any>) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

const BlockItem = ({
  block,
  index,
  isSelected,
  editable,
  placeholder,
  onSelect,
  onUpdate,
  onDelete,
  onConvert,
  onKeyDown,
}: BlockItemProps) => {
  const { id, type, content, attrs } = block;
  const [showControls, setShowControls] = useState(false);
  const blockRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef(content);
  const initializedRef = useRef(false);
  const { isEditing } = useEditorContext();

  // Configure sortable
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  // Create a Tiptap editor for this block
  const editor = useEditor({
    extensions: createBlockExtension(type, placeholder),
    content: content,
    editable: isEditing && editable,
    onUpdate: ({ editor }) => {
      if (!initializedRef.current) return;

      const newContent = editor.getHTML();
      // 중요: content가 실제로 변경된 경우에만 업데이트를 트리거합니다
      if (newContent !== contentRef.current) {
        contentRef.current = newContent;
        onUpdate({ content: newContent });
      }
    },
  });

  // Setup the editor when it's created
  useEffect(() => {
    if (editor && !initializedRef.current) {
      editor.commands.setContent(content);
      initializedRef.current = true;
    }
  }, [editor, content]);

  // Update editability
  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing && editable);
    }
  }, [editor, isEditing, editable]);

  // Focus on the block when selected
  useEffect(() => {
    if (isSelected && editor && isEditing && editable) {
      editor.commands.focus("end");
    }
  }, [isSelected, editor, isEditing, editable]);

  // Handle mouse events
  const handleMouseEnter = useCallback(() => {
    setShowControls(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setShowControls(false);
  }, []);

  // Apply DnD styles
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (!editor) {
    return <div className="p-2 text-muted-foreground">Loading block...</div>;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "block-item group relative px-2 py-1",
        "hover:bg-muted/20 transition-colors",
        isSelected && "bg-muted/30",
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onSelect}
    >
      {/* Block handle (drag) */}
      <div
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          "flex items-center",
        )}
        {...attributes}
        {...listeners}
      >
        <div className="p-1 cursor-grab text-muted-foreground hover:text-foreground">
          <IconGripVertical size={16} />
        </div>
      </div>

      {/* Add block button */}
      <div
        className={cn(
          "absolute left-0 top-0 -translate-y-1/2 translate-x-1/2",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          "flex items-center",
        )}
      >
        <button
          className="p-1 rounded-full bg-background border border-border shadow-sm text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            onConvert("paragraph");
          }}
        >
          <IconPlus size={12} />
        </button>
      </div>

      {/* Block controls */}
      {showControls && isSelected && (
        <BlockControls
          block={block}
          onConvert={onConvert}
          onDelete={onDelete}
        />
      )}

      {/* Block content */}
      <div ref={blockRef} className="block-content" onKeyDown={onKeyDown}>
        <EditorContent
          editor={editor}
          className={`block-editor-content block-type-${type}`}
        />
      </div>
    </div>
  );
};

export default BlockItem;
