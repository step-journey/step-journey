// 이 파일을 src/db/index.ts로 이동
import Dexie from "dexie";
import { Block } from "@/types/block";

class StepJourneyDatabase extends Dexie {
  blocks: Dexie.Table<Block, string>;

  constructor() {
    super("StepJourney");

    this.version(1).stores({
      blocks: "id, type, parent, created_at, updated_at",
    });

    this.blocks = this.table("blocks");
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
    return block.id;
  }

  async updateBlock(id: string, changes: Partial<Block>): Promise<void> {
    changes.updated_at = new Date().toISOString();
    await this.blocks.update(id, changes);
  }

  async deleteBlock(id: string): Promise<void> {
    // 먼저 자식 블록들을 삭제
    const childBlocks = await this.blocks.where("parent").equals(id).toArray();

    for (const child of childBlocks) {
      await this.deleteBlock(child.id);
    }

    // 부모 블록에서 이 블록 ID 제거
    const block = await this.getBlock(id);
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
}

const db = new StepJourneyDatabase();

export default db;
