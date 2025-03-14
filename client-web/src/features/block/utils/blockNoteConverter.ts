/**
 * BlockNote 블록과 StepJourney 커스텀 블록 간 변환을 위한 유틸리티 함수
 */

import { Block as BlockNoteBlock } from "@blocknote/core";
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
  InlineContent,
  TextContent,
  TableCell,
  TableContent,
} from "../types";
import { generateBlockId } from "@/features/block/utils/blockUtils";

/**
 * BlockNote 인라인 콘텐츠를 StepJourney 인라인 콘텐츠로 변환
 */
export function convertBlockNoteInlineToCustomInline(
  content: any[],
): InlineContent[] {
  if (!content || !Array.isArray(content)) return [];

  return content.map((item) => {
    if (item.type === "text") {
      const textContent: TextContent = {
        type: "text",
        text: item.text || "",
        styles: {
          ...(item.styles || {}),
        },
      };
      return textContent;
    }
    // 다른 인라인 타입이 있으면 추가
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
  content: InlineContent[],
): any[] {
  if (!content || !Array.isArray(content)) return [];

  return content.map((item) => {
    if (item.type === "text") {
      return {
        type: "text",
        text: item.text || "",
        styles: {
          ...(item.styles || {}),
        },
      };
    }
    // 다른 인라인 타입이 있으면 추가
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
export function convertBlockNoteTableCellToCustom(cell: any): TableCell {
  return {
    type: "tableCell",
    content: convertBlockNoteInlineToCustomInline(cell.content || []),
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
export function convertCustomTableCellToBlockNote(cell: TableCell): any {
  return {
    type: "tableCell",
    content: convertCustomInlineToBlockNoteInline(cell.content || []),
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
  tableContent: any,
): TableContent {
  return {
    type: "tableContent",
    columnWidths: tableContent.columnWidths || [],
    rows: (tableContent.rows || []).map((row: any) => ({
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
  tableContent: TableContent,
): any {
  return {
    type: "tableContent",
    columnWidths: tableContent.columnWidths || [],
    rows: (tableContent.rows || []).map((row) => ({
      cells: Array.isArray(row.cells)
        ? row.cells.map(convertCustomTableCellToBlockNote)
        : [],
    })),
  };
}

/**
 * BlockNote 블록을 StepJourney 커스텀 블록으로 변환
 */
export function convertBlockNoteToCustomBlock(
  blockNoteBlock: BlockNoteBlock,
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

  // 블록 타입에 따른 변환
  switch (blockNoteBlock.type) {
    case "paragraph": {
      const paragraphBlock: ParagraphBlock = {
        ...baseBlock,
        type: BlockType.PARAGRAPH,
        properties: {
          textColor: blockNoteBlock.props?.textColor || "default",
          backgroundColor: blockNoteBlock.props?.backgroundColor || "default",
          textAlignment: (blockNoteBlock.props?.textAlignment as any) || "left",
        },
        content: convertBlockNoteInlineToCustomInline(
          blockNoteBlock.content || [],
        ),
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
      const headingBlock: HeadingBlock = {
        ...baseBlock,
        type: BlockType.HEADING,
        properties: {
          level: (blockNoteBlock.props?.level as any) || 1,
          textColor: blockNoteBlock.props?.textColor || "default",
          backgroundColor: blockNoteBlock.props?.backgroundColor || "default",
          textAlignment: (blockNoteBlock.props?.textAlignment as any) || "left",
        },
        content: convertBlockNoteInlineToCustomInline(
          blockNoteBlock.content || [],
        ),
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
      const bulletListBlock: BulletListItemBlock = {
        ...baseBlock,
        type: BlockType.BULLET_LIST_ITEM,
        properties: {
          textColor: blockNoteBlock.props?.textColor || "default",
          backgroundColor: blockNoteBlock.props?.backgroundColor || "default",
          textAlignment: (blockNoteBlock.props?.textAlignment as any) || "left",
        },
        content: convertBlockNoteInlineToCustomInline(
          blockNoteBlock.content || [],
        ),
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
      const numberedListBlock: NumberedListItemBlock = {
        ...baseBlock,
        type: BlockType.NUMBERED_LIST_ITEM,
        properties: {
          // 필수 속성인 start 추가 (컴파일 에러 해결)
          start: blockNoteBlock.props?.start,
          textColor: blockNoteBlock.props?.textColor || "default",
          backgroundColor: blockNoteBlock.props?.backgroundColor || "default",
          textAlignment: (blockNoteBlock.props?.textAlignment as any) || "left",
        },
        content: convertBlockNoteInlineToCustomInline(
          blockNoteBlock.content || [],
        ),
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
      const checkListBlock: CheckListItemBlock = {
        ...baseBlock,
        type: BlockType.CHECK_LIST_ITEM,
        properties: {
          checked: !!blockNoteBlock.props?.checked,
          textColor: blockNoteBlock.props?.textColor || "default",
          backgroundColor: blockNoteBlock.props?.backgroundColor || "default",
          textAlignment: (blockNoteBlock.props?.textAlignment as any) || "left",
        },
        content: convertBlockNoteInlineToCustomInline(
          blockNoteBlock.content || [],
        ),
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
      const codeBlock: CodeBlock = {
        ...baseBlock,
        type: BlockType.CODE_BLOCK,
        properties: {
          language: blockNoteBlock.props?.language || "plain",
        },
        content: convertBlockNoteInlineToCustomInline(
          blockNoteBlock.content || [],
        ),
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
      const tableBlock: TableBlock = {
        ...baseBlock,
        type: BlockType.TABLE,
        properties: {
          textColor: blockNoteBlock.props?.textColor || "default",
        },
        tableContent: convertBlockNoteTableContentToCustom(
          blockNoteBlock.content,
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
      const imageBlock: ImageBlock = {
        ...baseBlock,
        type: BlockType.IMAGE,
        properties: {
          name: blockNoteBlock.props?.name || "",
          url: blockNoteBlock.props?.url || "",
          caption: blockNoteBlock.props?.caption || "",
          showPreview: blockNoteBlock.props?.showPreview ?? true,
          previewWidth: blockNoteBlock.props?.previewWidth || 300,
          backgroundColor: blockNoteBlock.props?.backgroundColor || "default",
          textAlignment: (blockNoteBlock.props?.textAlignment as any) || "left",
          // textColor 속성 제거 (컴파일 에러 해결)
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
        content: convertBlockNoteInlineToCustomInline(
          blockNoteBlock.content || [],
        ),
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
): BlockNoteBlock {
  // 공통 블록 속성
  const baseBlockNote = {
    id: customBlock.id,
  };

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
        children: [], // 실제 children은 별도로 처리됨
      } as BlockNoteBlock;
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
        children: [], // 실제 children은 별도로 처리됨
      } as BlockNoteBlock;
    }

    case BlockType.BULLET_LIST_ITEM: {
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
        children: [], // 실제 children은 별도로 처리됨
      } as BlockNoteBlock;
    }

    case BlockType.NUMBERED_LIST_ITEM: {
      const numberedListBlock = customBlock as NumberedListItemBlock;
      return {
        ...baseBlockNote,
        type: "numberedListItem",
        props: {
          // start 속성 추가 (컴파일 에러 해결)
          start: numberedListBlock.properties.start,
          textColor: numberedListBlock.properties.textColor || "default",
          backgroundColor:
            numberedListBlock.properties.backgroundColor || "default",
          textAlignment: numberedListBlock.properties.textAlignment || "left",
        },
        content: convertCustomInlineToBlockNoteInline(
          numberedListBlock.content || [],
        ),
        children: [], // 실제 children은 별도로 처리됨
      } as BlockNoteBlock;
    }

    case BlockType.CHECK_LIST_ITEM: {
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
        children: [], // 실제 children은 별도로 처리됨
      } as BlockNoteBlock;
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
        children: [], // 실제 children은 별도로 처리됨
      } as BlockNoteBlock;
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
        children: [], // 실제 children은 별도로 처리됨
      } as BlockNoteBlock;
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
        children: [], // 실제 children은 별도로 처리됨
      } as BlockNoteBlock;
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
        children: [], // 실제 children은 별도로 처리됨
      } as BlockNoteBlock;
    }
  }
}

/**
 * BlockNote 블록 트리를 StepJourney 커스텀 블록들로 변환 (재귀적으로 처리)
 * @returns 변환된 모든 블록의 배열
 */
export function convertBlockNoteTreeToCustomBlocks(
  blockNoteBlocks: BlockNoteBlock[],
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
): BlockNoteBlock {
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
): BlockNoteBlock[] {
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
  blockNoteBlocks: BlockNoteBlock[],
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
