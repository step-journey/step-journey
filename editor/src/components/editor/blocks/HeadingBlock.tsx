import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";

const HeadingBlock = ({ editor, node }: NodeViewProps) => {
  const level = node.attrs.level || 1;

  return (
    <NodeViewWrapper className={`heading-block heading-level-${level}`}>
      <div
        className="heading-content"
        contentEditable="true"
        suppressContentEditableWarning
      />
    </NodeViewWrapper>
  );
};

export default HeadingBlock;
