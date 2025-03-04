import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { IconInfoCircle } from "@tabler/icons-react";

const CalloutBlock = ({
  editor,
  node,
  updateAttributes,
  getPos,
}: NodeViewProps) => {
  return (
    <NodeViewWrapper className="callout-block">
      <div className="flex items-start gap-2">
        <div className="callout-icon text-blue-500 mt-1 flex-shrink-0">
          <IconInfoCircle size={20} />
        </div>
        <div
          className="callout-content flex-grow"
          data-placeholder="Write something informative..."
        />
      </div>
    </NodeViewWrapper>
  );
};

export default CalloutBlock;
