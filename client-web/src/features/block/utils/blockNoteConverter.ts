/**
 * BlockNote 블록과 StepJourney 커스텀 블록 간 변환을 위한 유틸리티 함수
 */

import {
  DefaultBlockSchema,
  DefaultInlineContentSchema,
  DefaultStyleSchema,
  InlineContent,
  Link,
  StyledText,
  TableCell,
  TableContent,
  BlockNoDefaults,
} from "@blocknote/core";
import {
  Block,
  BlockType,
  ParagraphBlock,
  HeadingBlock,
  BulletListItemBlock,
  NumberedListItemBlock,
  CheckListItemBlock,
  CodeBlock,
  TableBlock,
  ImageBlock,
  ColumnBlock,
  ColumnListBlock,
  AlertBlock,
} from "../types";
import { generateBlockId } from "@/features/block/utils/blockUtils";

// BlockNote 타입 정의

type BlockNoteInlineContent = InlineContent<
  DefaultInlineContentSchema,
  DefaultStyleSchema
>;

type BlockNoteStyledText = StyledText<DefaultStyleSchema>;

type BlockNoteLink = Link<DefaultStyleSchema>;

type BlockNoteTableCell = TableCell<
  DefaultInlineContentSchema,
  DefaultStyleSchema
>;

type BlockNoteTableContent = TableContent<
  DefaultInlineContentSchema,
  DefaultStyleSchema
>;

type BlockNoteGenericBlock = BlockNoDefaults<
  DefaultBlockSchema,
  DefaultInlineContentSchema,
  DefaultStyleSchema
>;

// 멀티컬럼 타입을 위한 확장 인터페이스
interface ExtendedBlockNoteBlock {
  id: string;
  type: string;
  props?: Record<string, any>;
  content?: any;
  children?: ExtendedBlockNoteBlock[];
}

/**
 * BlockNote 인라인 콘텐츠를 StepJourney 인라인 콘텐츠로 변환
 * 블록 콘텐츠용: 모든 인라인 콘텐츠를 StyledText로 변환
 */
export function convertBlockNoteInlineToCustomInline(
  content: BlockNoteInlineContent[],
): BlockNoteStyledText[] {
  if (!content || !Array.isArray(content)) return [];

  return content.map((item) => {
    if (item.type === "text") {
      const textItem = item as BlockNoteStyledText;
      return {
        type: "text",
        text: textItem.text || "",
        styles: {
          ...(textItem.styles || {}),
        },
      };
    } else if (item.type === "link") {
      // Link 타입을 StyledText로 변환
      const linkItem = item as BlockNoteLink;
      const linkText =
        linkItem.content && Array.isArray(linkItem.content)
          ? linkItem.content.map((c) => c.text || "").join("")
          : "";
      return {
        type: "text",
        text: `${linkText} (${linkItem.href || ""})`,
        styles: {
          // 링크 스타일 적용
          underline: true,
        },
      };
    }
    // 다른 인라인 타입도 텍스트로 변환
    return {
      type: "text",
      text: JSON.stringify(item),
      styles: {},
    };
  });
}

/**
 * 테이블 셀을 위한 BlockNote 인라인 콘텐츠를 StepJourney 인라인 콘텐츠로 변환
 */
export function convertTableCellContentToCustom(
  content: BlockNoteInlineContent[],
): BlockNoteInlineContent[] {
  if (!content || !Array.isArray(content)) return [];

  return content.map((item) => {
    if (item.type === "text") {
      const textItem = item as BlockNoteStyledText;
      return {
        type: "text",
        text: textItem.text || "",
        styles: {
          ...(textItem.styles || {}),
        },
      };
    } else if (item.type === "link") {
      // Link 타입 처리
      const linkItem = item as BlockNoteLink;
      const linkContent: BlockNoteLink = {
        type: "link",
        href: linkItem.href || "",
        content: convertBlockNoteInlineToCustomInline(linkItem.content || []),
      };
      return linkContent;
    }
    // 기본 텍스트로 반환
    return {
      type: "text",
      text: JSON.stringify(item),
      styles: {},
    };
  });
}

/**
 * StepJourney 인라인 콘텐츠를 BlockNote 인라인 콘텐츠로 변환
 */
export function convertCustomInlineToBlockNoteInline(
  content: BlockNoteStyledText[],
): BlockNoteInlineContent[] {
  if (!content || !Array.isArray(content)) return [];

  return content.map((item) => {
    return {
      type: "text",
      text: item.text || "",
      styles: {
        ...(item.styles || {}),
      },
    };
  });
}

/**
 * 테이블 셀 콘텐츠용 변환 함수
 */
export function convertTableCellContentToBlockNoteInline(
  content: BlockNoteInlineContent[],
): BlockNoteInlineContent[] {
  if (!content || !Array.isArray(content)) return [];

  return content.map((item) => {
    if (item.type === "text") {
      const textItem = item as BlockNoteStyledText;
      return {
        type: "text",
        text: textItem.text || "",
        styles: {
          ...(textItem.styles || {}),
        },
      };
    } else if (item.type === "link") {
      // Link 타입 처리
      const linkItem = item as BlockNoteLink;
      return {
        type: "link",
        href: linkItem.href || "",
        content: linkItem.content.map((textItem) => ({
          type: "text",
          text: textItem.text || "",
          styles: textItem.styles || {},
        })),
      };
    }
    // 기본 빈 텍스트로 반환
    return {
      type: "text",
      text: "",
      styles: {},
    };
  });
}

/**
 * BlockNote 테이블 셀을 StepJourney 테이블 셀로 변환
 */
export function convertBlockNoteTableCellToCustom(
  cell: Partial<BlockNoteTableCell>,
): BlockNoteTableCell {
  return {
    type: "tableCell",
    content: convertTableCellContentToCustom(cell.content || []),
    props: {
      colspan: cell.props?.colspan || 1,
      rowspan: cell.props?.rowspan || 1,
      backgroundColor: cell.props?.backgroundColor || "default",
      textColor: cell.props?.textColor || "default",
      textAlignment: cell.props?.textAlignment || "left",
    },
  };
}

/**
 * StepJourney 테이블 셀을 BlockNote 테이블 셀로 변환
 */
export function convertCustomTableCellToBlockNote(
  cell: BlockNoteTableCell,
): BlockNoteTableCell {
  return {
    type: "tableCell",
    content: convertTableCellContentToBlockNoteInline(cell.content),
    props: {
      colspan: cell.props?.colspan || 1,
      rowspan: cell.props?.rowspan || 1,
      backgroundColor: cell.props?.backgroundColor || "default",
      textColor: cell.props?.textColor || "default",
      textAlignment: cell.props?.textAlignment || "left",
    },
  };
}

/**
 * BlockNote 테이블 콘텐츠를 StepJourney 테이블 콘텐츠로 변환
 */
export function convertBlockNoteTableContentToCustom(
  tableContent: Partial<BlockNoteTableContent>,
): BlockNoteTableContent {
  return {
    type: "tableContent",
    columnWidths: tableContent.columnWidths || [],
    rows: (tableContent.rows || []).map((row) => ({
      cells: Array.isArray(row.cells)
        ? row.cells.map(convertBlockNoteTableCellToCustom)
        : [],
    })),
  };
}

/**
 * StepJourney 테이블 콘텐츠를 BlockNote 테이블 콘텐츠로 변환
 */
export function convertCustomTableContentToBlockNote(
  tableContent: BlockNoteTableContent,
): BlockNoteTableContent {
  return {
    type: "tableContent",
    columnWidths: tableContent.columnWidths || [],
    rows: (tableContent.rows || []).map((row) => ({
      cells: Array.isArray(row.cells)
        ? row.cells.map((cell) =>
            convertCustomTableCellToBlockNote(cell as BlockNoteTableCell),
          )
        : [],
    })),
  };
}

/**
 * BlockNote 프로퍼티 타입
 */
interface BlockNoteProps {
  textColor?: string;
  backgroundColor?: string;
  textAlignment?: "left" | "center" | "right" | "justify";
  level?: 1 | 2 | 3; // 수정: 명확한 유니온 타입으로 정의
  language?: string;
  checked?: boolean;
  start?: number;
  url?: string;
  name?: string;
  caption?: string;
  showPreview?: boolean;
  previewWidth?: number;
  width?: number; // 추가: 컬럼 너비를 위한 속성
}

/**
 * 멀티컬럼 블록인지 확인
 */
function isMultiColumnBlock(block: any): boolean {
  return block.type === "columnList" || block.type === "column";
}

function isAlertBlockType(block: any): boolean {
  return block.type === "alert";
}

/**
 * BlockNote 블록을 StepJourney 커스텀 블록으로 변환
 */
export function convertBlockNoteToCustomBlock(
  blockNoteBlock: BlockNoteGenericBlock | ExtendedBlockNoteBlock,
  parentId: string,
  createdBy: string = "user",
): Block {
  const now = new Date().toISOString();
  // BlockNote ID가 있으면 사용하고, 없으면 새로 생성
  const blockId = blockNoteBlock.id || generateBlockId();

  // 공통 블록 속성
  const baseBlock = {
    id: blockId,
    parentId,
    childrenIds: [] as string[],
    createdBy,
    createdAt: now,
    updatedAt: now,
  };

  // 멀티컬럼 블록 처리
  if (isMultiColumnBlock(blockNoteBlock)) {
    if (blockNoteBlock.type === "columnList") {
      const columnListBlock: ColumnListBlock = {
        ...baseBlock,
        type: BlockType.COLUMN_LIST,
        properties: {}, // 컬럼 리스트는 특별한 속성이 없음
      };

      // 자식 컬럼들 처리
      if (blockNoteBlock.children && blockNoteBlock.children.length > 0) {
        columnListBlock.childrenIds = blockNoteBlock.children.map(
          (child: ExtendedBlockNoteBlock) => child.id,
        );
      }

      return columnListBlock;
    } else if (blockNoteBlock.type === "column") {
      const props = blockNoteBlock.props || {};
      const columnBlock: ColumnBlock = {
        ...baseBlock,
        type: BlockType.COLUMN,
        properties: {
          width: props.width ?? 1, // 기본 너비는 1
        },
      };

      // 자식 블록들 처리
      if (blockNoteBlock.children && blockNoteBlock.children.length > 0) {
        columnBlock.childrenIds = blockNoteBlock.children.map(
          (child: ExtendedBlockNoteBlock) => child.id,
        );
      }

      return columnBlock;
    }
  }

  // Alert 블록 처리 추가
  if (isAlertBlockType(blockNoteBlock)) {
    const props = blockNoteBlock.props as BlockNoteProps & { type?: string };
    const alertBlock: AlertBlock = {
      ...baseBlock,
      type: BlockType.ALERT,
      properties: {
        textAlignment: props?.textAlignment || "left",
        textColor: props?.textColor || "default",
        type:
          (props?.type as "warning" | "error" | "info" | "success") ||
          "warning",
      },
      content: Array.isArray(blockNoteBlock.content)
        ? convertBlockNoteInlineToCustomInline(
            blockNoteBlock.content as BlockNoteInlineContent[],
          )
        : [],
    };

    // BlockNote의 children 처리
    if (blockNoteBlock.children && blockNoteBlock.children.length > 0) {
      alertBlock.childrenIds = blockNoteBlock.children.map((child) => child.id);
    }

    return alertBlock;
  }

  // 기존 블록 타입에 따른 변환
  switch (blockNoteBlock.type) {
    case "paragraph": {
      const props = blockNoteBlock.props as BlockNoteProps;
      const paragraphBlock: ParagraphBlock = {
        ...baseBlock,
        type: BlockType.PARAGRAPH,
        properties: {
          textColor: props?.textColor || "default",
          backgroundColor: props?.backgroundColor || "default",
          textAlignment: props?.textAlignment || "left",
        },
        content: Array.isArray(blockNoteBlock.content)
          ? convertBlockNoteInlineToCustomInline(
              blockNoteBlock.content as BlockNoteInlineContent[],
            )
          : [],
      };

      // BlockNote의 children 처리 - ID만 참조
      if (blockNoteBlock.children && blockNoteBlock.children.length > 0) {
        paragraphBlock.childrenIds = blockNoteBlock.children.map(
          (child) => child.id,
        );
      }

      return paragraphBlock;
    }

    case "heading": {
      const props = blockNoteBlock.props as BlockNoteProps;
      const headingBlock: HeadingBlock = {
        ...baseBlock,
        type: BlockType.HEADING,
        properties: {
          // 에러 수정: heading level은 1, 2, 3 중 하나만 가능
          level: (props?.level && [1, 2, 3].includes(props.level)
            ? props.level
            : 1) as 1 | 2 | 3,
          textColor: props?.textColor || "default",
          backgroundColor: props?.backgroundColor || "default",
          textAlignment: props?.textAlignment || "left",
        },
        content: Array.isArray(blockNoteBlock.content)
          ? convertBlockNoteInlineToCustomInline(
              blockNoteBlock.content as BlockNoteInlineContent[],
            )
          : [],
      };

      // BlockNote의 children 처리 - ID만 참조
      if (blockNoteBlock.children && blockNoteBlock.children.length > 0) {
        headingBlock.childrenIds = blockNoteBlock.children.map(
          (child) => child.id,
        );
      }

      return headingBlock;
    }

    case "bulletListItem": {
      const props = blockNoteBlock.props as BlockNoteProps;
      const bulletListBlock: BulletListItemBlock = {
        ...baseBlock,
        type: BlockType.BULLET_LIST,
        properties: {
          textColor: props?.textColor || "default",
          backgroundColor: props?.backgroundColor || "default",
          textAlignment: props?.textAlignment || "left",
        },
        content: Array.isArray(blockNoteBlock.content)
          ? convertBlockNoteInlineToCustomInline(
              blockNoteBlock.content as BlockNoteInlineContent[],
            )
          : [],
      };

      // BlockNote의 children 처리 - ID만 참조
      if (blockNoteBlock.children && blockNoteBlock.children.length > 0) {
        bulletListBlock.childrenIds = blockNoteBlock.children.map(
          (child) => child.id,
        );
      }

      return bulletListBlock;
    }

    case "numberedListItem": {
      const props = blockNoteBlock.props as BlockNoteProps;
      const numberedListBlock: NumberedListItemBlock = {
        ...baseBlock,
        type: BlockType.NUMBERED_LIST,
        properties: {
          // 에러 수정: start 속성이 undefined일 수 없음, 기본값 제공
          start: props?.start ?? 1,
          textColor: props?.textColor || "default",
          backgroundColor: props?.backgroundColor || "default",
          textAlignment: props?.textAlignment || "left",
        },
        content: Array.isArray(blockNoteBlock.content)
          ? convertBlockNoteInlineToCustomInline(
              blockNoteBlock.content as BlockNoteInlineContent[],
            )
          : [],
      };

      // BlockNote의 children 처리 - ID만 참조
      if (blockNoteBlock.children && blockNoteBlock.children.length > 0) {
        numberedListBlock.childrenIds = blockNoteBlock.children.map(
          (child) => child.id,
        );
      }

      return numberedListBlock;
    }

    case "checkListItem": {
      const props = blockNoteBlock.props as BlockNoteProps;
      const checkListBlock: CheckListItemBlock = {
        ...baseBlock,
        type: BlockType.CHECK_LIST,
        properties: {
          checked: !!props?.checked,
          textColor: props?.textColor || "default",
          backgroundColor: props?.backgroundColor || "default",
          textAlignment: props?.textAlignment || "left",
        },
        content: Array.isArray(blockNoteBlock.content)
          ? convertBlockNoteInlineToCustomInline(
              blockNoteBlock.content as BlockNoteInlineContent[],
            )
          : [],
      };

      // BlockNote의 children 처리 - ID만 참조
      if (blockNoteBlock.children && blockNoteBlock.children.length > 0) {
        checkListBlock.childrenIds = blockNoteBlock.children.map(
          (child) => child.id,
        );
      }

      return checkListBlock;
    }

    case "codeBlock": {
      const props = blockNoteBlock.props as BlockNoteProps;
      const codeBlock: CodeBlock = {
        ...baseBlock,
        type: BlockType.CODE_BLOCK,
        properties: {
          language: props?.language || "plain",
        },
        content: Array.isArray(blockNoteBlock.content)
          ? convertBlockNoteInlineToCustomInline(
              blockNoteBlock.content as BlockNoteInlineContent[],
            )
          : [],
      };

      // BlockNote의 children 처리 - ID만 참조 (코드 블록은 일반적으로 자식이 없음)
      if (blockNoteBlock.children && blockNoteBlock.children.length > 0) {
        codeBlock.childrenIds = blockNoteBlock.children.map(
          (child) => child.id,
        );
      }

      return codeBlock;
    }

    case "table": {
      const props = blockNoteBlock.props as BlockNoteProps;
      const tableBlock: TableBlock = {
        ...baseBlock,
        type: BlockType.TABLE,
        properties: {
          textColor: props?.textColor || "default",
        },
        tableContent: convertBlockNoteTableContentToCustom(
          blockNoteBlock.content as BlockNoteTableContent,
        ),
      };

      // BlockNote의 children 처리 - ID만 참조 (테이블은 일반적으로 자식이 없음)
      if (blockNoteBlock.children && blockNoteBlock.children.length > 0) {
        tableBlock.childrenIds = blockNoteBlock.children.map(
          (child) => child.id,
        );
      }

      return tableBlock;
    }

    case "image": {
      const props = blockNoteBlock.props as BlockNoteProps;
      const imageBlock: ImageBlock = {
        ...baseBlock,
        type: BlockType.IMAGE,
        properties: {
          name: props?.name || "",
          url: props?.url || "",
          caption: props?.caption || "",
          showPreview: props?.showPreview ?? true,
          previewWidth: props?.previewWidth || 300,
          backgroundColor: props?.backgroundColor || "default",
          textAlignment: props?.textAlignment || "left",
        },
      };

      // BlockNote의 children 처리 - ID만 참조 (이미지는 일반적으로 자식이 없음)
      if (blockNoteBlock.children && blockNoteBlock.children.length > 0) {
        imageBlock.childrenIds = blockNoteBlock.children.map(
          (child) => child.id,
        );
      }

      return imageBlock;
    }

    // 기본: 지원하지 않는 타입이면 단락으로 변환
    default: {
      console.warn(
        `Unsupported BlockNote block type: ${blockNoteBlock.type}. Converting to paragraph.`,
      );
      const fallbackBlock: ParagraphBlock = {
        ...baseBlock,
        type: BlockType.PARAGRAPH,
        properties: {
          textColor: "default",
          backgroundColor: "default",
          textAlignment: "left",
        },
        content: Array.isArray(blockNoteBlock.content)
          ? convertBlockNoteInlineToCustomInline(
              blockNoteBlock.content as BlockNoteInlineContent[],
            )
          : [],
      };

      if (blockNoteBlock.children && blockNoteBlock.children.length > 0) {
        fallbackBlock.childrenIds = blockNoteBlock.children.map(
          (child) => child.id,
        );
      }

      return fallbackBlock;
    }
  }
}

/**
 * StepJourney 커스텀 블록을 BlockNote 블록으로 변환
 */
export function convertCustomToBlockNoteBlock(
  customBlock: Block,
): BlockNoteGenericBlock | ExtendedBlockNoteBlock {
  // 공통 블록 속성
  const baseBlockNote = {
    id: customBlock.id,
    children: [] as BlockNoteGenericBlock[],
  };

  // 멀티컬럼 블록 처리
  if (customBlock.type === BlockType.COLUMN_LIST) {
    return {
      ...baseBlockNote,
      type: "columnList",
      props: {},
      content: undefined,
    } as unknown as ExtendedBlockNoteBlock;
  } else if (customBlock.type === BlockType.COLUMN) {
    const columnBlock = customBlock as ColumnBlock;
    return {
      ...baseBlockNote,
      type: "column",
      props: {
        width: columnBlock.properties.width || 1,
      },
      content: undefined,
    } as unknown as ExtendedBlockNoteBlock;
  }

  // Alert 블록 처리 추가
  if (customBlock.type === BlockType.ALERT) {
    const alertBlock = customBlock as AlertBlock;
    return {
      ...baseBlockNote,
      type: "alert",
      props: {
        textAlignment: alertBlock.properties.textAlignment || "left",
        textColor: alertBlock.properties.textColor || "default",
        type: alertBlock.properties.type || "warning",
      },
      content: convertCustomInlineToBlockNoteInline(alertBlock.content || []),
    } as unknown as ExtendedBlockNoteBlock;
  }

  // 블록 타입에 따른 변환
  switch (customBlock.type) {
    case BlockType.PARAGRAPH: {
      const paragraphBlock = customBlock as ParagraphBlock;
      return {
        ...baseBlockNote,
        type: "paragraph",
        props: {
          textColor: paragraphBlock.properties.textColor || "default",
          backgroundColor:
            paragraphBlock.properties.backgroundColor || "default",
          textAlignment: paragraphBlock.properties.textAlignment || "left",
        },
        content: convertCustomInlineToBlockNoteInline(
          paragraphBlock.content || [],
        ),
      } as BlockNoteGenericBlock;
    }

    case BlockType.HEADING: {
      const headingBlock = customBlock as HeadingBlock;
      return {
        ...baseBlockNote,
        type: "heading",
        props: {
          level: headingBlock.properties.level || 1,
          textColor: headingBlock.properties.textColor || "default",
          backgroundColor: headingBlock.properties.backgroundColor || "default",
          textAlignment: headingBlock.properties.textAlignment || "left",
        },
        content: convertCustomInlineToBlockNoteInline(
          headingBlock.content || [],
        ),
      } as BlockNoteGenericBlock;
    }

    case BlockType.BULLET_LIST: {
      const bulletListBlock = customBlock as BulletListItemBlock;
      return {
        ...baseBlockNote,
        type: "bulletListItem",
        props: {
          textColor: bulletListBlock.properties.textColor || "default",
          backgroundColor:
            bulletListBlock.properties.backgroundColor || "default",
          textAlignment: bulletListBlock.properties.textAlignment || "left",
        },
        content: convertCustomInlineToBlockNoteInline(
          bulletListBlock.content || [],
        ),
      } as BlockNoteGenericBlock;
    }

    case BlockType.NUMBERED_LIST: {
      const numberedListBlock = customBlock as NumberedListItemBlock;
      return {
        ...baseBlockNote,
        type: "numberedListItem",
        props: {
          // start 속성 수정 - undefined일 수 없음
          start: numberedListBlock.properties.start ?? 1,
          textColor: numberedListBlock.properties.textColor || "default",
          backgroundColor:
            numberedListBlock.properties.backgroundColor || "default",
          textAlignment: numberedListBlock.properties.textAlignment || "left",
        },
        content: convertCustomInlineToBlockNoteInline(
          numberedListBlock.content || [],
        ),
      } as BlockNoteGenericBlock;
    }

    case BlockType.CHECK_LIST: {
      const checkListBlock = customBlock as CheckListItemBlock;
      return {
        ...baseBlockNote,
        type: "checkListItem",
        props: {
          checked: checkListBlock.properties.checked,
          textColor: checkListBlock.properties.textColor || "default",
          backgroundColor:
            checkListBlock.properties.backgroundColor || "default",
          textAlignment: checkListBlock.properties.textAlignment || "left",
        },
        content: convertCustomInlineToBlockNoteInline(
          checkListBlock.content || [],
        ),
      } as BlockNoteGenericBlock;
    }

    case BlockType.CODE_BLOCK: {
      const codeBlock = customBlock as CodeBlock;
      return {
        ...baseBlockNote,
        type: "codeBlock",
        props: {
          language: codeBlock.properties.language || "plain",
        },
        content: convertCustomInlineToBlockNoteInline(codeBlock.content || []),
      } as BlockNoteGenericBlock;
    }

    case BlockType.TABLE: {
      const tableBlock = customBlock as TableBlock;
      return {
        ...baseBlockNote,
        type: "table",
        props: {
          textColor: tableBlock.properties.textColor || "default",
        },
        content: convertCustomTableContentToBlockNote(tableBlock.tableContent),
      } as BlockNoteGenericBlock;
    }

    case BlockType.IMAGE: {
      const imageBlock = customBlock as ImageBlock;
      return {
        ...baseBlockNote,
        type: "image",
        props: {
          name: imageBlock.properties.name || "",
          url: imageBlock.properties.url || "",
          caption: imageBlock.properties.caption || "",
          showPreview: imageBlock.properties.showPreview ?? true,
          previewWidth: imageBlock.properties.previewWidth || 300,
          // textColor 속성 제거 (컴파일 에러 해결)
          backgroundColor: imageBlock.properties.backgroundColor || "default",
          textAlignment: imageBlock.properties.textAlignment || "left",
        },
        // content undefined로 설정 (컴파일 에러 해결)
        content: undefined,
      } as BlockNoteGenericBlock;
    }

    // 기본: 지원하지 않는 타입이면 단락으로 변환
    default: {
      console.warn(
        `Unsupported custom block type: ${customBlock.type}. Converting to paragraph.`,
      );
      return {
        ...baseBlockNote,
        type: "paragraph",
        props: {
          textColor: "default",
          backgroundColor: "default",
          textAlignment: "left",
        },
        content: [],
      } as BlockNoteGenericBlock;
    }
  }
}

/**
 * BlockNote 블록 트리를 StepJourney 커스텀 블록들로 변환 (재귀적으로 처리)
 * @returns 변환된 모든 블록의 배열
 */
export function convertBlockNoteTreeToCustomBlocks(
  blockNoteBlocks: (BlockNoteGenericBlock | ExtendedBlockNoteBlock)[],
  parentId: string,
  createdBy: string = "user",
): Block[] {
  if (
    !blockNoteBlocks ||
    !Array.isArray(blockNoteBlocks) ||
    blockNoteBlocks.length === 0
  ) {
    return [];
  }

  const result: Block[] = [];

  // 모든 블록을 순회하면서 커스텀 블록으로 변환
  for (const bnBlock of blockNoteBlocks) {
    // 현재 블록 변환
    const customBlock = convertBlockNoteToCustomBlock(
      bnBlock,
      parentId,
      createdBy,
    );
    result.push(customBlock);

    // 자식 블록들이 있으면 재귀적으로 처리
    if (bnBlock.children && bnBlock.children.length > 0) {
      // 자식 블록들 중 ID가 없는 경우 미리 생성
      bnBlock.children = bnBlock.children.map((child) => {
        if (!child.id) {
          child.id = generateBlockId();
        }
        return child;
      });

      const childBlocks = convertBlockNoteTreeToCustomBlocks(
        bnBlock.children,
        customBlock.id,
        createdBy,
      );
      result.push(...childBlocks);
    }
  }

  return result;
}

/**
 * StepJourney 커스텀 블록에서 BlockNote 블록 트리로 변환 (재귀적으로 자식 포함)
 * @param customBlock 변환할 커스텀 블록
 * @param allBlocks 모든 블록 목록 (자식 블록 조회용)
 * @returns BlockNote 블록 트리
 */
export function buildBlockNoteTree(
  customBlock: Block,
  allBlocks: Block[],
): BlockNoteGenericBlock | ExtendedBlockNoteBlock {
  // 현재 블록을 BlockNote 형식으로 변환
  const blockNoteBlock = convertCustomToBlockNoteBlock(customBlock);

  // 자식 블록 처리
  if (customBlock.childrenIds && customBlock.childrenIds.length > 0) {
    blockNoteBlock.children = customBlock.childrenIds
      .map((childId) => allBlocks.find((block) => block.id === childId))
      .filter(Boolean)
      .map((childBlock) => buildBlockNoteTree(childBlock!, allBlocks));
  }

  return blockNoteBlock;
}

/**
 * 특정 스텝의 모든 콘텐츠 블록을 BlockNote 블록 트리로 변환
 * @param stepBlock 스텝 블록
 * @param allBlocks 모든 블록 목록
 * @returns BlockNote 블록 배열
 */
export function getBlockNoteBlocksFromStep(
  stepBlock: Block,
  allBlocks: Block[],
): (BlockNoteGenericBlock | ExtendedBlockNoteBlock)[] {
  // 스텝 블록의 자식 블록들 가져오기
  const contentBlocks = stepBlock.childrenIds
    .map((childId) => allBlocks.find((block) => block.id === childId))
    .filter(Boolean) as Block[];

  // 각 콘텐츠 블록을 BlockNote 트리로 변환
  return contentBlocks.map((block) => buildBlockNoteTree(block, allBlocks));
}

/**
 * BlockNote 블록 배열에서 저장 가능한 커스텀 블록 목록으로 변환
 * (모든 중첩 블록을 평면화하여 저장 가능한 형태로 변환)
 */
export async function prepareBlocksForSaving(
  blockNoteBlocks: (BlockNoteGenericBlock | ExtendedBlockNoteBlock)[],
  parentId: string,
  createdBy: string = "user",
): Promise<Block[]> {
  // BlockNote 블록 트리를 평면화된 커스텀 블록 배열로 변환
  return convertBlockNoteTreeToCustomBlocks(
    blockNoteBlocks,
    parentId,
    createdBy,
  );
}
