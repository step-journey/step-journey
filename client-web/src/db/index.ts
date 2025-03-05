import Dexie from "dexie";
import { v4 as uuidv4 } from "uuid";
import { Block, cloneBlock } from "@/types/block";

class StepJourneyDatabase extends Dexie {
  blocks: Dexie.Table<Block, string>;
  workspace: Dexie.Table<any, string>; // 워크스페이스 메타데이터 저장
  history: Dexie.Table<
    {
      id: string;
      blockId: string;
      action: string;
      data: any;
      timestamp: string;
    },
    string
  >; // 변경 이력

  constructor() {
    super("StepJourney");

    this.version(1).stores({
      blocks: "id, type, parent, created_at, updated_at",
      workspace: "id, name, owner",
      history: "id, blockId, action, timestamp",
    });

    this.blocks = this.table("blocks");
    this.workspace = this.table("workspace");
    this.history = this.table("history");
  }

  async getBlock(id: string): Promise<Block | undefined> {
    return this.blocks.get(id);
  }

  async getBlocksWithParent(parentId: string | null): Promise<Block[]> {
    return this.blocks
      .where("parent")
      .equals(parentId ?? "null")
      .toArray();
  }

  async createBlock(block: Block): Promise<string> {
    await this.blocks.add(block);

    // 히스토리에 생성 이벤트 추가
    await this.addToHistory(block.id, "create", block);

    return block.id;
  }

  async updateBlock(id: string, changes: Partial<Block>): Promise<void> {
    // 현재 블록 상태 저장
    const oldBlock = await this.getBlock(id);

    // 변경사항 적용
    changes.updated_at = new Date().toISOString();
    await this.blocks.update(id, changes);

    // 히스토리에 업데이트 이벤트 추가
    if (oldBlock) {
      await this.addToHistory(id, "update", { old: oldBlock, changes });
    }
  }

  async deleteBlock(id: string): Promise<void> {
    // 현재 블록 상태 저장 (복구용)
    const block = await this.getBlock(id);

    // 먼저 자식 블록들을 삭제
    const childBlocks = await this.blocks.where("parent").equals(id).toArray();

    for (const child of childBlocks) {
      await this.deleteBlock(child.id);
    }

    // 부모 블록에서 이 블록 ID 제거
    if (block && block.parent) {
      const parent = await this.getBlock(block.parent);
      if (parent) {
        const newContent = parent.content.filter(
          (contentId) => contentId !== id,
        );
        await this.updateBlock(parent.id, { content: newContent });
      }
    }

    // 블록 삭제
    await this.blocks.delete(id);

    // 히스토리에 삭제 이벤트 추가
    if (block) {
      await this.addToHistory(id, "delete", block);
    }
  }

  async addBlockToParent(
    blockId: string,
    parentId: string,
    index?: number,
  ): Promise<void> {
    const parent = await this.getBlock(parentId);
    if (!parent) return;

    const newContent = [...parent.content];
    if (index !== undefined && index >= 0 && index <= newContent.length) {
      newContent.splice(index, 0, blockId);
    } else {
      newContent.push(blockId);
    }

    await this.updateBlock(parentId, { content: newContent });
    await this.updateBlock(blockId, { parent: parentId });
  }

  async moveBlock(
    blockId: string,
    newParentId: string,
    index?: number,
  ): Promise<void> {
    const block = await this.getBlock(blockId);
    if (!block) return;

    // 현재 부모에서 제거
    if (block.parent) {
      const currentParent = await this.getBlock(block.parent);
      if (currentParent) {
        const newParentContent = currentParent.content.filter(
          (id) => id !== blockId,
        );
        await this.updateBlock(currentParent.id, { content: newParentContent });
      }
    }

    // 새 부모에 추가
    await this.addBlockToParent(blockId, newParentId, index);
  }

  // 블록 트리 구조를 효율적으로 가져오는 메서드
  async getBlockTree(
    rootId: string,
    depth: number = 3,
  ): Promise<Block & { children?: Block[] }> {
    const root = await this.getBlock(rootId);
    if (!root) throw new Error(`Block ${rootId} not found`);

    if (depth > 0 && root.content.length > 0) {
      const children = await Promise.all(
        root.content.map((id) => this.getBlockTree(id, depth - 1)),
      );
      return { ...root, children }; // children 프로퍼티 추가하여 반환
    }

    return root;
  }

  // 최적화된 블록 이동 메서드 (같은 부모 내에서)
  async moveBlockInParent(blockId: string, targetIndex: number): Promise<void> {
    // 트랜잭션 처리로 원자성 보장
    return this.transaction("rw", this.blocks, async () => {
      const block = await this.getBlock(blockId);
      if (!block || !block.parent) throw new Error("Block or parent not found");

      const parent = await this.getBlock(block.parent);
      if (!parent) throw new Error("Parent block not found");

      // 현재 인덱스 찾기
      const currentIndex = parent.content.indexOf(blockId);
      if (currentIndex === -1)
        throw new Error("Block not found in parent content");

      // 인덱스가 같으면 이동할 필요 없음
      if (currentIndex === targetIndex) return;

      // 부모의 content 배열에서 블록 위치 변경
      const newContent = [...parent.content];
      // 현재 위치에서 제거
      newContent.splice(currentIndex, 1);
      // 새 위치에 삽입
      newContent.splice(targetIndex, 0, blockId);

      await this.updateBlock(parent.id, { content: newContent });
    });
  }

  // 블록을 들여쓰기 (이전 블록의 자식으로)
  async indentBlock(blockId: string): Promise<void> {
    const block = await this.getBlock(blockId);
    if (!block || !block.parent) return;

    const parent = await this.getBlock(block.parent);
    if (!parent) return;

    const blockIndex = parent.content.indexOf(blockId);
    if (blockIndex <= 0) return; // 첫 번째 블록은 들여쓰기 불가

    const prevSiblingId = parent.content[blockIndex - 1];
    const prevSibling = await this.getBlock(prevSiblingId);
    if (!prevSibling) return;

    // 현재 부모에서 블록 제거
    const newParentContent = parent.content.filter((id) => id !== blockId);
    await this.updateBlock(parent.id, { content: newParentContent });

    // 이전 블록의 자식으로 추가
    const newSiblingContent = [...prevSibling.content, blockId];
    await this.updateBlock(prevSibling.id, { content: newSiblingContent });

    // 블록의 부모 업데이트
    await this.updateBlock(blockId, { parent: prevSibling.id });
  }

  // 블록을 내어쓰기 (부모의 부모 자식으로)
  async outdentBlock(blockId: string): Promise<void> {
    const block = await this.getBlock(blockId);
    if (!block || !block.parent) return;

    const parent = await this.getBlock(block.parent);
    if (!parent || !parent.parent) return; // 부모가 없거나 부모의 부모가 없으면 내어쓰기 불가

    const grandParent = await this.getBlock(parent.parent);
    if (!grandParent) return;

    // 현재 부모에서 블록 제거
    const newParentContent = parent.content.filter((id) => id !== blockId);
    await this.updateBlock(parent.id, { content: newParentContent });

    // 부모의 부모에 블록 추가 (부모 다음 위치에)
    const parentIndex = grandParent.content.indexOf(parent.id);
    const newGrandParentContent = [...grandParent.content];
    newGrandParentContent.splice(parentIndex + 1, 0, blockId);
    await this.updateBlock(grandParent.id, { content: newGrandParentContent });

    // 블록의 부모 업데이트
    await this.updateBlock(blockId, { parent: grandParent.id });
  }

  // 블록 복제 (자식 블록 포함 옵션)
  async duplicateBlock(
    blockId: string,
    includeChildren: boolean = true,
  ): Promise<string> {
    const block = await this.getBlock(blockId);
    if (!block) throw new Error("Block not found");

    // 블록 복제
    const newBlock = cloneBlock(block);
    await this.createBlock(newBlock);

    // 자식 블록도 복제
    if (includeChildren && block.content.length > 0) {
      const newChildIds = [];

      for (const childId of block.content) {
        const childBlock = await this.getBlock(childId);
        if (childBlock) {
          const newChildId = await this.duplicateBlock(childId, true);
          newChildIds.push(newChildId);
          // 새 자식 블록의 부모를 새 블록으로 설정
          await this.updateBlock(newChildId, { parent: newBlock.id });
        }
      }

      // 새 블록의 content 업데이트
      await this.updateBlock(newBlock.id, { content: newChildIds });
    }

    // 부모 블록의 content에 새 블록 추가
    if (block.parent) {
      const parent = await this.getBlock(block.parent);
      if (parent) {
        const blockIndex = parent.content.indexOf(blockId);
        const newParentContent = [...parent.content];
        newParentContent.splice(blockIndex + 1, 0, newBlock.id);
        await this.updateBlock(parent.id, { content: newParentContent });
      }
    }

    return newBlock.id;
  }

  // 히스토리 추가 함수
  private async addToHistory(
    blockId: string,
    action: string,
    data: any,
  ): Promise<void> {
    await this.history.add({
      id: uuidv4(),
      blockId,
      action,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  // 실행 취소를 위한 히스토리 검색
  async getRecentHistory(limit: number = 10): Promise<any[]> {
    return this.history.orderBy("timestamp").reverse().limit(limit).toArray();
  }

  // 실행 취소 (단순 버전)
  async undo(): Promise<boolean> {
    const recentActions = await this.getRecentHistory(1);
    if (recentActions.length === 0) return false;

    const lastAction = recentActions[0];

    try {
      if (lastAction.action === "create") {
        // 생성 취소 = 삭제
        await this.blocks.delete(lastAction.blockId);
      } else if (lastAction.action === "update") {
        // 업데이트 취소 = 이전 상태로 복원
        const oldState = lastAction.data.old;
        await this.blocks.put(oldState);
      } else if (lastAction.action === "delete") {
        // 삭제 취소 = 다시 생성
        const deletedBlock = lastAction.data;
        await this.blocks.add(deletedBlock);

        // 부모 블록의 content에도 복원
        if (deletedBlock.parent) {
          const parent = await this.getBlock(deletedBlock.parent);
          if (parent) {
            const newContent = [...parent.content, deletedBlock.id];
            await this.updateBlock(parent.id, { content: newContent });
          }
        }
      }

      // 히스토리에서 이 항목 제거
      await this.history.delete(lastAction.id);

      return true;
    } catch (error) {
      console.error("Undo failed:", error);
      return false;
    }
  }
}

const db = new StepJourneyDatabase();
export default db;
