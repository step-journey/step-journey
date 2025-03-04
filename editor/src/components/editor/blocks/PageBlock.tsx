import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";

const PageBlock = ({
  editor,
  node,
  updateAttributes,
  getPos,
}: NodeViewProps) => {
  return (
    <NodeViewWrapper className="page-block">
      <div className="page-block-content" />
    </NodeViewWrapper>
  );
};

export default PageBlock;
