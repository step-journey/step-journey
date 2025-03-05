/**
 * 트랜잭션 시스템 - 불변 상태 업데이트 로직
 */
import { Block, TextFormat } from "@/types/block";
import {
  DeleteBlockOperation,
  DeleteTextOperation,
  EditorState,
  FormatTextOperation,
  InsertBlockOperation,
  InsertTextOperation,
  MoveBlockOperation,
  Operation,
  SelectionState,
  Transaction,
  UpdateBlockOperation,
} from "./types";

/**
 * 새 트랜잭션 생성
 */
export function createTransaction(state: EditorState): TransactionBuilder {
  return new TransactionBuilder(state);
}

/**
 * 트랜잭션 빌더 클래스 - 여러 작업을 모아 트랜잭션 구성
 */
export class TransactionBuilder {
  private operations: Operation[] = [];
  private meta: Record<string, any> = {};
  private selectionUpdate: SelectionState | null = null;
  private readonly state: EditorState;

  constructor(state: EditorState) {
    this.state = state;
  }

  /**
   * 텍스트 삽입 작업 추가
   */
  insertText(
    blockId: string,
    offset: number,
    text: string,
  ): TransactionBuilder {
    this.operations.push({
      type: "insert_text",
      blockId,
      offset,
      text,
    } as InsertTextOperation);
    return this;
  }

  /**
   * 텍스트 삭제 작업 추가
   */
  deleteText(
    blockId: string,
    offset: number,
    length: number,
  ): TransactionBuilder {
    this.operations.push({
      type: "delete_text",
      blockId,
      offset,
      length,
    } as DeleteTextOperation);
    return this;
  }

  /**
   * 텍스트 서식 작업 추가
   */
  formatText(
    blockId: string,
    offset: number,
    length: number,
    format: TextFormat,
    isRemove = false,
  ): TransactionBuilder {
    this.operations.push({
      type: "format_text",
      blockId,
      offset,
      length,
      format,
      isRemove,
    } as FormatTextOperation);
    return this;
  }

  /**
   * 블록 삽입 작업 추가
   */
  insertBlock(
    block: Block,
    parentId: string | null,
    index: number,
  ): TransactionBuilder {
    this.operations.push({
      type: "insert_block",
      block,
      parentId,
      index,
    } as InsertBlockOperation);
    return this;
  }

  /**
   * 블록 삭제 작업 추가
   */
  deleteBlock(blockId: string): TransactionBuilder {
    this.operations.push({
      type: "delete_block",
      blockId,
    } as DeleteBlockOperation);
    return this;
  }

  /**
   * 블록 업데이트 작업 추가
   */
  updateBlock(blockId: string, properties: Partial<Block>): TransactionBuilder {
    this.operations.push({
      type: "update_block",
      blockId,
      properties,
    } as UpdateBlockOperation);
    return this;
  }

  /**
   * 블록 이동 작업 추가
   */
  moveBlock(
    blockId: string,
    targetParentId: string | null,
    targetIndex: number,
  ): TransactionBuilder {
    this.operations.push({
      type: "move_block",
      blockId,
      targetParentId,
      targetIndex,
    } as MoveBlockOperation);
    return this;
  }

  /**
   * 선택 영역 업데이트 설정
   */
  setSelection(selection: SelectionState | null): TransactionBuilder {
    this.selectionUpdate = selection;
    return this;
  }

  /**
   * 메타데이터 추가
   */
  setMeta(key: string, value: any): TransactionBuilder {
    this.meta[key] = value;
    return this;
  }

  /**
   * 트랜잭션 구성 완료
   */
  build(): Transaction {
    return {
      operations: [...this.operations],
      meta: { ...this.meta },
      selectionUpdate: this.selectionUpdate,
    };
  }

  /**
   * 현재 상태에 트랜잭션 적용
   */
  apply(): EditorState {
    const transaction = this.build();
    return applyTransaction(this.state, transaction);
  }
}

/**
 * 트랜잭션을 에디터 상태에 적용
 */
export function applyTransaction(
  state: EditorState,
  transaction: Transaction,
): EditorState {
  // 블록 맵 생성 (성능 향상을 위해 블록 ID로 인덱싱)
  const blocksMap = new Map<string, Block>();
  state.blocks.forEach((block) => blocksMap.set(block.id, { ...block }));

  // 부모 맵 생성 (블록 관계 추적을 위해)
  const parentChildMap = new Map<string | null, string[]>();
  state.blocks.forEach((block) => {
    const parent = block.parent || null;
    if (!parentChildMap.has(parent)) {
      parentChildMap.set(parent, []);
    }
    parentChildMap.get(parent)!.push(block.id);
  });

  // 모든 작업 적용
  for (const operation of transaction.operations) {
    applyOperation(operation, blocksMap, parentChildMap);
  }

  // 최종 블록 목록 재구성
  const rootBlocks = parentChildMap.get(null) || [];
  const blocks = rebuildBlockList(rootBlocks, blocksMap, parentChildMap);

  // 새 상태 반환
  return {
    documentId: state.documentId,
    blocks,
    selection:
      transaction.selectionUpdate !== undefined
        ? transaction.selectionUpdate
        : state.selection,
    version: state.version + 1,
  };
}

/**
 * 단일 작업을 블록 맵에 적용
 */
function applyOperation(
  operation: Operation,
  blocksMap: Map<string, Block>,
  parentChildMap: Map<string | null, string[]>,
): void {
  switch (operation.type) {
    case "insert_text":
      applyInsertText(operation, blocksMap);
      break;
    case "delete_text":
      applyDeleteText(operation, blocksMap);
      break;
    case "format_text":
      applyFormatText(operation, blocksMap);
      break;
    case "insert_block":
      applyInsertBlock(operation, blocksMap, parentChildMap);
      break;
    case "delete_block":
      applyDeleteBlock(operation, blocksMap, parentChildMap);
      break;
    case "update_block":
      applyUpdateBlock(operation, blocksMap);
      break;
    case "move_block":
      applyMoveBlock(operation, blocksMap, parentChildMap);
      break;
  }
}

/**
 * 텍스트 삽입 작업 적용
 */
function applyInsertText(
  operation: InsertTextOperation,
  blocksMap: Map<string, Block>,
): void {
  const block = blocksMap.get(operation.blockId);
  if (!block) return;

  // 대부분의 블록은 title 속성에 텍스트를 저장
  if (block.properties.title && block.properties.title[0]) {
    const [text, formats] = block.properties.title[0];
    const newText =
      text.slice(0, operation.offset) +
      operation.text +
      text.slice(operation.offset);

    block.properties.title[0] = [newText, formats];
  }

  block.updated_at = new Date().toISOString();
}

/**
 * 텍스트 삭제 작업 적용
 */
function applyDeleteText(
  operation: DeleteTextOperation,
  blocksMap: Map<string, Block>,
): void {
  const block = blocksMap.get(operation.blockId);
  if (!block) return;

  if (block.properties.title && block.properties.title[0]) {
    const [text, formats] = block.properties.title[0];
    const newText =
      text.slice(0, operation.offset) +
      text.slice(operation.offset + operation.length);

    block.properties.title[0] = [newText, formats];
  }

  block.updated_at = new Date().toISOString();
}

/**
 * 텍스트 서식 작업 적용 (간소화된 구현)
 */
function applyFormatText(
  operation: FormatTextOperation,
  blocksMap: Map<string, Block>,
): void {
  const block = blocksMap.get(operation.blockId);
  if (!block) return;

  // 실제 구현에서는 여기서 Notion 스타일의 텍스트 포맷 배열 업데이트 필요
  // 간소화를 위해 기본 구현만 제공
  if (block.properties.title && block.properties.title[0]) {
    const [text, formats] = block.properties.title[0];

    // 현재는 간단한 구현만 제공
    // 실제로는 포맷 범위를 올바르게 처리해야 함
    if (!operation.isRemove) {
      formats.push(operation.format);
    } else {
      // 형식 제거 로직 (간소화됨)
      const formatType = operation.format[0];
      const formatIndex = formats.findIndex((f) => f[0] === formatType);
      if (formatIndex !== -1) {
        formats.splice(formatIndex, 1);
      }
    }

    block.properties.title[0] = [text, formats];
  }

  block.updated_at = new Date().toISOString();
}

/**
 * 블록 삽입 작업 적용
 */
function applyInsertBlock(
  operation: InsertBlockOperation,
  blocksMap: Map<string, Block>,
  parentChildMap: Map<string | null, string[]>,
): void {
  const { block, parentId, index } = operation;

  // 블록 맵에 새 블록 추가
  blocksMap.set(block.id, { ...block, parent: parentId });

  // 부모-자식 관계 업데이트
  if (!parentChildMap.has(parentId)) {
    parentChildMap.set(parentId, []);
  }

  const siblings = parentChildMap.get(parentId)!;
  siblings.splice(index, 0, block.id);

  // 부모 블록이 있으면 content 배열도 업데이트
  if (parentId) {
    const parentBlock = blocksMap.get(parentId);
    if (parentBlock) {
      parentBlock.content = [...siblings];
      parentBlock.updated_at = new Date().toISOString();
    }
  }
}

/**
 * 블록 삭제 작업 적용
 */
function applyDeleteBlock(
  operation: DeleteBlockOperation,
  blocksMap: Map<string, Block>,
  parentChildMap: Map<string | null, string[]>,
): void {
  const blockId = operation.blockId;
  const block = blocksMap.get(blockId);
  if (!block) return;

  // 부모에서 이 블록 ID 제거
  const parentId = block.parent || null;
  if (parentChildMap.has(parentId)) {
    const siblings = parentChildMap.get(parentId)!;
    const blockIndex = siblings.indexOf(blockId);
    if (blockIndex !== -1) {
      siblings.splice(blockIndex, 1);

      // 부모 블록이 있으면 content 배열도 업데이트
      if (parentId) {
        const parentBlock = blocksMap.get(parentId);
        if (parentBlock) {
          parentBlock.content = [...siblings];
          parentBlock.updated_at = new Date().toISOString();
        }
      }
    }
  }

  // 자식 블록도 재귀적으로 삭제
  if (parentChildMap.has(blockId)) {
    const children = [...(parentChildMap.get(blockId) || [])];
    for (const childId of children) {
      applyDeleteBlock(
        { type: "delete_block", blockId: childId },
        blocksMap,
        parentChildMap,
      );
    }
  }

  // 블록 맵에서 블록 제거
  blocksMap.delete(blockId);
}

/**
 * 블록 업데이트 작업 적용
 */
function applyUpdateBlock(
  operation: UpdateBlockOperation,
  blocksMap: Map<string, Block>,
): void {
  const { blockId, properties } = operation;
  const block = blocksMap.get(blockId);
  if (!block) return;

  // 블록 속성 업데이트
  Object.assign(block, properties);
  block.updated_at = new Date().toISOString();
}

/**
 * 블록 이동 작업 적용
 */
function applyMoveBlock(
  operation: MoveBlockOperation,
  blocksMap: Map<string, Block>,
  parentChildMap: Map<string | null, string[]>,
): void {
  const { blockId, targetParentId, targetIndex } = operation;
  const block = blocksMap.get(blockId);
  if (!block) return;

  const currentParentId = block.parent || null;

  // 같은 부모 내에서 이동하는 경우
  if (
    currentParentId === targetParentId &&
    parentChildMap.has(currentParentId)
  ) {
    const siblings = parentChildMap.get(currentParentId)!;
    const currentIndex = siblings.indexOf(blockId);

    if (currentIndex !== -1) {
      // 현재 위치에서 제거
      siblings.splice(currentIndex, 1);

      // 새 위치에 추가 (targetIndex 조정 필요, 제거한 위치에 따라)
      const adjustedIndex =
        currentIndex < targetIndex ? targetIndex - 1 : targetIndex;
      siblings.splice(adjustedIndex, 0, blockId);

      // 부모 블록이 있으면 content 배열도 업데이트
      if (currentParentId) {
        const parentBlock = blocksMap.get(currentParentId);
        if (parentBlock) {
          parentBlock.content = [...siblings];
          parentBlock.updated_at = new Date().toISOString();
        }
      }
    }
  }
  // 다른 부모로 이동하는 경우
  else {
    // 현재 부모에서 제거
    if (parentChildMap.has(currentParentId)) {
      const oldSiblings = parentChildMap.get(currentParentId)!;
      const currentIndex = oldSiblings.indexOf(blockId);
      if (currentIndex !== -1) {
        oldSiblings.splice(currentIndex, 1);

        // 이전 부모 블록 업데이트
        if (currentParentId) {
          const parentBlock = blocksMap.get(currentParentId);
          if (parentBlock) {
            parentBlock.content = [...oldSiblings];
            parentBlock.updated_at = new Date().toISOString();
          }
        }
      }
    }

    // 새 부모에 추가
    if (!parentChildMap.has(targetParentId)) {
      parentChildMap.set(targetParentId, []);
    }
    const newSiblings = parentChildMap.get(targetParentId)!;
    newSiblings.splice(targetIndex, 0, blockId);

    // 새 부모 블록 업데이트
    if (targetParentId) {
      const parentBlock = blocksMap.get(targetParentId);
      if (parentBlock) {
        parentBlock.content = [...newSiblings];
        parentBlock.updated_at = new Date().toISOString();
      }
    }

    // 블록의 부모 참조 업데이트
    block.parent = targetParentId;
    block.updated_at = new Date().toISOString();
  }
}

/**
 * 부모-자식 관계 맵에서 블록 목록 재구성
 */
function rebuildBlockList(
  rootBlockIds: string[],
  blocksMap: Map<string, Block>,
  parentChildMap: Map<string | null, string[]>,
): Block[] {
  const result: Block[] = [];

  // 재귀적으로 트리 순회하며 블록 목록 구성
  function traverseBlocks(blockIds: string[]) {
    for (const blockId of blockIds) {
      const block = blocksMap.get(blockId);
      if (block) {
        result.push(block);

        // 자식 블록이 있으면 순회
        if (parentChildMap.has(blockId)) {
          traverseBlocks(parentChildMap.get(blockId) || []);
        }
      }
    }
  }

  traverseBlocks(rootBlockIds);
  return result;
}
