import Dexie, { Table } from "dexie";
import { Journey, Step } from "@/features/journey/types/journey";

class StepJourneyDB extends Dexie {
  journeys!: Table<Journey>;
  steps!: Table<Step>;

  constructor() {
    super("stepJourneyDB");

    this.version(1).stores({
      journeys: "id",
      steps: "id, journey_id, [journey_id+order]",
    });
  }
}

const dbClient = new StepJourneyDB();

export default dbClient;
