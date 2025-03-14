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
}

const dbClient = new StepJourneyDB();

export default dbClient;
