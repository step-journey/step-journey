import Dexie, { Table } from "dexie";
import { Journey, Step, Block } from "@/features/journey/types/journey";

class StepJourneyDB extends Dexie {
  journeys!: Table<Journey>;
  steps!: Table<Step>;
  blocks!: Table<Block>;

  constructor() {
    super("stepJourneyDB");

    this.version(1).stores({
      journeys: "id",
      steps: "id, journey_id, [journey_id+order]",
      blocks: "id, parent_id, type, is_deleted",
    });
  }
}

const dbClient = new StepJourneyDB();

export default dbClient;
