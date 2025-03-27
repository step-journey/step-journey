import { BlockType } from "./baseBlock";
import { BlockNoteInlineContentBlock } from "./blockNoteBaseTypes";

export interface AlertBlock extends BlockNoteInlineContentBlock {
  type: BlockType.ALERT;
  properties: {
    textAlignment?: "left" | "center" | "right" | "justify";
    textColor?: string;
    type: "warning" | "error" | "info" | "success";
  };
}

// 타입 가드 함수
export function isAlertBlock(block: any): block is AlertBlock {
  return block?.type === BlockType.ALERT;
}

// Alert 블록의 타입 문자열을 가져오는 유틸리티 함수
export function getAlertType(block: AlertBlock): string {
  return block.properties.type || "warning";
}
