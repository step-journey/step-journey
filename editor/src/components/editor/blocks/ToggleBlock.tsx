import { useState } from "react";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { IconChevronRight, IconChevronDown } from "@tabler/icons-react";

const ToggleBlock = ({ editor, node, updateAttributes }: NodeViewProps) => {
  const [isOpen, setIsOpen] = useState(node.attrs.open);

  const toggleOpen = () => {
    const newValue = !isOpen;
    setIsOpen(newValue);
    updateAttributes({ open: newValue });
  };

  return (
    <NodeViewWrapper className="toggle-block">
      <div
        className="toggle-summary flex items-center gap-2 cursor-pointer text-foreground font-medium mb-1"
        onClick={toggleOpen}
      >
        {isOpen ? (
          <IconChevronDown size={16} className="flex-shrink-0" />
        ) : (
          <IconChevronRight size={16} className="flex-shrink-0" />
        )}
        <div
          className="toggle-summary-content outline-none"
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => updateAttributes({ summary: e.target.textContent })}
        >
          {node.attrs.summary}
        </div>
      </div>
      <div
        className={`toggle-content pl-6 ${isOpen ? "block" : "hidden"} border-l border-border ml-[7px]`}
      >
        <div className="toggle-content-inner pt-1" />
      </div>
    </NodeViewWrapper>
  );
};

export default ToggleBlock;
