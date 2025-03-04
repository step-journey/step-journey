import React from "react";
import { Block, BlockType } from "@/types/block";
import TextEditor from "../TextEditor";
import { Button } from "@/components/ui/button";
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";

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
      case "code":
        return renderCodeBlock();
      case "image":
        return renderImageBlock();
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
          onEnter={handleAddBlock}
          onTab={handleIndent}
          onShiftTab={handleOutdent}
          onDelete={handleDeleteBlock}
          onChangeType={handleChangeType}
          onArrowUp={onArrowUp}
          onArrowDown={onArrowDown}
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
          onEnter={handleAddBlock}
          onTab={handleIndent}
          onShiftTab={handleOutdent}
          onDelete={handleDeleteBlock}
          onChangeType={handleChangeType}
          onArrowUp={onArrowUp}
          onArrowDown={onArrowDown}
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
          onEnter={handleAddBlock}
          onTab={handleIndent}
          onShiftTab={handleOutdent}
          onDelete={handleDeleteBlock}
          onChangeType={handleChangeType}
          onArrowUp={onArrowUp}
          onArrowDown={onArrowDown}
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
        onEnter={handleAddBlock}
        onTab={handleIndent}
        onShiftTab={handleOutdent}
        onDelete={handleDeleteBlock}
        onChangeType={handleChangeType}
        onArrowUp={onArrowUp}
        onArrowDown={onArrowDown}
      />
    </div>
  );

  const renderCodeBlock = () => (
    <div className="font-mono bg-muted p-3 rounded overflow-x-auto">
      <TextEditor
        value={block.properties.title || [["", []]]}
        onChange={handleContentChange}
        blockType={blockType}
        onEnter={(e) => {
          // code 블록 내에서는 줄바꿈만 삽입
          const event = e as unknown as React.KeyboardEvent;
          if (!event.shiftKey) {
            e();
          }
        }}
        onTab={handleIndent}
        onShiftTab={handleOutdent}
        onDelete={handleDeleteBlock}
        onChangeType={handleChangeType}
        onArrowUp={onArrowUp}
        onArrowDown={onArrowDown}
      />
    </div>
  );

  const renderImageBlock = () => {
    return block.properties.source?.[0]?.[0] ? (
      <div className="w-full">
        <img
          src={block.properties.source[0][0]}
          alt={block.properties.caption?.[0]?.[0] || "Image"}
          className="max-w-full rounded-md"
        />
        <div className="text-sm text-muted-foreground mt-1">
          <TextEditor
            value={block.properties.caption || [["", []]]}
            onChange={(value) => handleContentChange(value)}
            blockType="text"
            placeholder="이미지 설명 추가..."
            onEnter={handleAddBlock}
            onTab={handleIndent}
            onShiftTab={handleOutdent}
            onArrowUp={onArrowUp}
            onArrowDown={onArrowDown}
          />
        </div>
      </div>
    ) : (
      <div className="border-2 border-dashed border-border rounded-md p-8 text-center">
        <div className="text-muted-foreground mb-2">
          이미지를 여기에 드래그하거나 클릭하여 업로드
        </div>
        <Button variant="outline" size="sm">
          이미지 업로드
        </Button>
      </div>
    );
  };

  const renderHeadingBlock = () => (
    <TextEditor
      value={block.properties.title || [["", []]]}
      onChange={handleContentChange}
      blockType={blockType}
      onEnter={handleAddBlock}
      onTab={handleIndent}
      onShiftTab={handleOutdent}
      onDelete={handleDeleteBlock}
      onChangeType={handleChangeType}
      onArrowUp={onArrowUp}
      onArrowDown={onArrowDown}
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
      <div
        contentEditable={false}
        className="notion-list-item-bullet flex-shrink-0 mr-2 mt-1.5"
      >
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
          onEnter={handleAddBlock}
          onTab={handleIndent}
          onShiftTab={handleOutdent}
          onDelete={handleDeleteBlock}
          onChangeType={handleChangeType}
          onArrowUp={onArrowUp}
          onArrowDown={onArrowDown}
        />
      </div>
    </div>
  );

  const renderTextBlock = () => (
    <TextEditor
      value={block.properties.title || [["", []]]}
      onChange={handleContentChange}
      blockType={blockType}
      onEnter={handleAddBlock}
      onTab={handleIndent}
      onShiftTab={handleOutdent}
      onDelete={handleDeleteBlock}
      onChangeType={handleChangeType}
      onArrowUp={onArrowUp}
      onArrowDown={onArrowDown}
    />
  );

  return <div className="w-full">{renderContent()}</div>;
};

export default BlockContent;
