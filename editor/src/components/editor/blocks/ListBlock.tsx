import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";

const ListBlock = ({ editor, node }: NodeViewProps) => {
  const isOrdered = node.type.name === "orderedList";
  const isBullet = node.type.name === "bulletList";
  const isTask = node.type.name === "taskList";

  return (
    <NodeViewWrapper className={`list-block ${node.type.name}`}>
      <div className="list-content">
        {/* 실제 리스트 콘텐츠는 Tiptap에서 자동으로 처리됨 */}
      </div>
    </NodeViewWrapper>
  );
};

export default ListBlock;
