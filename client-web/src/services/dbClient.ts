import Dexie, { Table } from "dexie";
import { Block } from "@/features/block/types";

class StepJourneyDB extends Dexie {
  blocks!: Table<Block>;

  constructor() {
    super("stepJourneyDB");

    this.version(1).stores({
      blocks: "id, type, parentId",
    });
  }

  /**
   * 초기 데이터 로드 및 저장
   * @param blocks 저장할 블록 데이터 배열
   */
  async loadInitialData(blocks: Block[]): Promise<void> {
    // 트랜잭션을 사용하여 모든 데이터를 한번에 저장
    await this.transaction("rw", this.blocks, async () => {
      console.log(`초기 데이터 로드 중: ${blocks.length}개 블록`);

      // 각 블록을 데이터베이스에 저장
      for (const block of blocks) {
        try {
          await this.blocks.put(block);
          console.log(`블록 저장 성공: ${block.id} (타입: ${block.type})`);
        } catch (error) {
          console.error(`블록 저장 실패 (ID: ${block.id}):`, error);
        }
      }

      console.log("초기 데이터 로드 완료");
    });
  }

  /**
   * 초기 데이터를 JSON 파일에서 가져와 저장
   */
  async importInitialData(): Promise<void> {
    try {
      console.log("초기 데이터 파일 로드 시작...");

      // 정적 JSON 파일 로드
      const response = await fetch("/init_data.json");
      if (!response.ok) {
        throw new Error(
          `초기 데이터 로드 실패: ${response.status} ${response.statusText}`,
        );
      }

      // JSON 파싱
      const rawData = await response.json();
      console.log(`JSON 데이터 로드 완료: ${rawData.length}개 항목 발견`);

      // 데이터가 없으면 중단
      if (!Array.isArray(rawData) || rawData.length === 0) {
        console.warn("초기 데이터 파일이 비어있거나 유효하지 않습니다.");
        return;
      }

      // key-value 형식으로 된 데이터에서 value 부분만 추출
      const blocks: Block[] = rawData.map((item) => {
        // key-value 형식인 경우
        if (item.key && item.value) {
          return item.value as Block;
        }
        // 일반 블록 형식인 경우
        return item as Block;
      });

      console.log(`처리된 블록 데이터: ${blocks.length}개`);

      // 데이터 유효성 검증 (ID와 type 필드가 있는지)
      const validBlocks = blocks.filter((block) => {
        const isValid = block && block.id && block.type;
        if (!isValid) {
          console.warn("유효하지 않은 블록 데이터:", block);
        }
        return isValid;
      });

      console.log(`유효한 블록 데이터: ${validBlocks.length}개`);

      // 데이터 저장
      await this.loadInitialData(validBlocks);
    } catch (error) {
      console.error("초기 데이터 가져오기 실패:", error);
      throw error;
    }
  }
}

const dbClient = new StepJourneyDB();

export default dbClient;
