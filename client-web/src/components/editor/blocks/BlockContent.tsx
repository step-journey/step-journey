import React from "react";
import { Block, BlockType } from "@/types/block";
import TextEditor from "../TextEditor";
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { useCaretManager } from "@/lib/caret";
import { EditorState, SelectionState } from "@/lib/editor";

interface BlockContentProps {
  block: Block;
  blockType: BlockType;
  isExpanded: boolean;
  toggleExpand: () => void;
  handleContentChange: (value: Array<[string, any[]]>) => Promise<void>;
  handleAddBlock: () => void;
  handleIndent: () => void;
  handleOutdent: () => void;
  handleDeleteBlock?: () => void;
  handleChangeType: (type: BlockType) => void;
  toggleTodo?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  caretManager?: ReturnType<typeof useCaretManager>;
  editorState?: EditorState | null;
  editorController?: {
    updateSelection: (selection: SelectionState | null) => void;
  } | null;
}

const BlockContent: React.FC<BlockContentProps> = ({
  block,
  blockType,
  isExpanded,
  toggleExpand,
  handleContentChange,
  handleAddBlock,
  handleIndent,
  handleOutdent,
  handleDeleteBlock,
  handleChangeType,
  toggleTodo,
  onArrowUp,
  onArrowDown,
  caretManager,
  editorState,
  editorController,
}) => {
  const renderContent = () => {
    switch (blockType) {
      case "to_do":
        return renderTodoBlock();
      case "toggle":
        return renderToggleBlock();
      case "divider":
        return <hr className="border-t border-border my-2 w-full" />;
      case "callout":
        return renderCalloutBlock();
      case "quote":
        return renderQuoteBlock();
      case "table":
        return renderTableBlock();
      case "heading_1":
      case "heading_2":
      case "heading_3":
        return renderHeadingBlock();
      case "bulleted_list":
      case "numbered_list":
        return renderListBlock();
      default:
        return renderTextBlock();
    }
  };

  const renderTodoBlock = () => (
    <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
      <input
        type="checkbox"
        checked={block.properties.checked?.[0]?.[0] === "Yes"}
        onChange={toggleTodo}
        style={{ marginRight: "8px", marginTop: "2px" }}
      />
      <div style={{ flex: 1 }}>
        <TextEditor
          value={block.properties.title || [["", []]]}
          onChange={handleContentChange}
          blockType={blockType}
          blockId={block.id}
          onEnter={handleAddBlock}
          onTab={handleIndent}
          onShiftTab={handleOutdent}
          onDelete={handleDeleteBlock}
          onChangeType={handleChangeType}
          onArrowUp={onArrowUp}
          onArrowDown={onArrowDown}
          caretManager={caretManager}
          editorState={editorState}
          editorController={editorController}
        />
      </div>
    </div>
  );

  const renderToggleBlock = () => (
    <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
      <button
        className="p-0.5 hover:bg-accent/50 rounded-sm"
        onClick={toggleExpand}
        style={{ marginRight: "8px", marginTop: "2px" }}
      >
        {isExpanded ? (
          <IconChevronDown className="h-4 w-4" />
        ) : (
          <IconChevronRight className="h-4 w-4" />
        )}
      </button>
      <div style={{ flex: 1 }}>
        <TextEditor
          value={block.properties.title || [["", []]]}
          onChange={handleContentChange}
          blockType="text"
          blockId={block.id}
          onEnter={handleAddBlock}
          onTab={handleIndent}
          onShiftTab={handleOutdent}
          onDelete={handleDeleteBlock}
          onChangeType={handleChangeType}
          onArrowUp={onArrowUp}
          onArrowDown={onArrowDown}
          caretManager={caretManager}
          editorState={editorState}
          editorController={editorController}
        />
      </div>
    </div>
  );

  const renderCalloutBlock = () => (
    <div className="flex items-start gap-2 p-3 bg-accent/20 rounded-md w-full">
      <span className="text-xl">💡</span>
      <div className="flex-1">
        <TextEditor
          value={block.properties.title || [["", []]]}
          onChange={handleContentChange}
          blockType="text"
          blockId={block.id}
          onEnter={handleAddBlock}
          onTab={handleIndent}
          onShiftTab={handleOutdent}
          onDelete={handleDeleteBlock}
          onChangeType={handleChangeType}
          onArrowUp={onArrowUp}
          onArrowDown={onArrowDown}
          caretManager={caretManager}
          editorState={editorState}
          editorController={editorController}
        />
      </div>
    </div>
  );

  const renderQuoteBlock = () => (
    <div className="border-l-4 border-border pl-4 italic">
      <TextEditor
        value={block.properties.title || [["", []]]}
        onChange={handleContentChange}
        blockType={blockType}
        blockId={block.id}
        onEnter={handleAddBlock}
        onTab={handleIndent}
        onShiftTab={handleOutdent}
        onDelete={handleDeleteBlock}
        onChangeType={handleChangeType}
        onArrowUp={onArrowUp}
        onArrowDown={onArrowDown}
        caretManager={caretManager}
        editorState={editorState}
        editorController={editorController}
      />
    </div>
  );

  const renderTableBlock = () => (
    <div className="w-full overflow-x-auto">
      <div className="border border-border rounded-md p-2 text-center text-muted-foreground">
        Table block placeholder
      </div>
    </div>
  );

  const renderHeadingBlock = () => (
    <TextEditor
      value={block.properties.title || [["", []]]}
      onChange={handleContentChange}
      blockType={blockType}
      blockId={block.id}
      onEnter={handleAddBlock}
      onTab={handleIndent}
      onShiftTab={handleOutdent}
      onDelete={handleDeleteBlock}
      onChangeType={handleChangeType}
      onArrowUp={onArrowUp}
      onArrowDown={onArrowDown}
      caretManager={caretManager}
      editorState={editorState}
      editorController={editorController}
    />
  );

  const renderListBlock = () => (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        width: "100%",
        paddingLeft: "2px",
      }}
    >
      <div contentEditable={false} className="flex-shrink-0 mr-2 mt-1.5">
        {blockType === "bulleted_list" ? (
          <div className="bullet-disc">•</div>
        ) : (
          <div className="number-bullet">1.</div>
        )}
      </div>
      <div className="flex-grow">
        <TextEditor
          value={block.properties.title || [["", []]]}
          onChange={handleContentChange}
          blockType={blockType}
          blockId={block.id}
          onEnter={handleAddBlock}
          onTab={handleIndent}
          onShiftTab={handleOutdent}
          onDelete={handleDeleteBlock}
          onChangeType={handleChangeType}
          onArrowUp={onArrowUp}
          onArrowDown={onArrowDown}
          caretManager={caretManager}
          editorState={editorState}
          editorController={editorController}
        />
      </div>
    </div>
  );

  const renderTextBlock = () => (
    <TextEditor
      value={block.properties.title || [["", []]]}
      onChange={handleContentChange}
      blockType={blockType}
      blockId={block.id}
      onEnter={() => {
        // CARET: Enter 키로 블록 추가 시 캐럿 위치 관리
        const currentPosition = caretManager?.getCaretPosition();

        if (currentPosition) {
          // 현재 위치 저장
          caretManager?.saveCaret("beforeSplit");

          // 블록 분할
          handleAddBlock();

          // 캐럿 관리 로깅
          if (import.meta.env.DEV) {
            console.log("[CARET:SPLIT]", {
              blockId: block.id,
              splitPosition: currentPosition.offset,
            });
          }
        } else {
          // 위치 알 수 없는 경우 그냥 블록 추가
          handleAddBlock();
        }
      }}
      onTab={handleIndent}
      onShiftTab={handleOutdent}
      onDelete={handleDeleteBlock}
      onChangeType={handleChangeType}
      onArrowUp={onArrowUp}
      onArrowDown={onArrowDown}
      caretManager={caretManager}
      editorState={editorState}
      editorController={editorController}
    />
  );

  return <div className="w-full">{renderContent()}</div>;
};

export default BlockContent;
