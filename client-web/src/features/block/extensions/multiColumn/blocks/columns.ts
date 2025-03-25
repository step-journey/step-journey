import { createBlockSpecFromStronglyTypedTiptapNode } from "@blocknote/core";
import { Column } from "../pm-nodes/column";
import { ColumnList } from "../pm-nodes/columnList";

export const ColumnBlock = createBlockSpecFromStronglyTypedTiptapNode(Column, {
  width: {
    default: 1,
  },
});

export const ColumnListBlock = createBlockSpecFromStronglyTypedTiptapNode(
  ColumnList,
  {},
);
