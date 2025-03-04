import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";

const QuoteBlock = ({ editor, node }: NodeViewProps) => {
  return (
    <NodeViewWrapper className="quote-block">
      <div
        className="quote-content"
        contentEditable="true"
        suppressContentEditableWarning
      />
    </NodeViewWrapper>
  );
};

export default QuoteBlock;
