import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";

const TableBlock = ({ editor, node }: NodeViewProps) => {
  return (
    <NodeViewWrapper className="table-block">
      <div className="table-wrapper overflow-x-auto">
        {/* 테이블 콘텐츠는 Tiptap에서 자동으로 처리됨 */}
      </div>
    </NodeViewWrapper>
  );
};

export default TableBlock;
