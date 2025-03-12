export const QUERY_KEYS = {
  user: {
    me: ["user", "me"],
  },
  journeys: {
    all: ["journeys"],
    detail: (id: string) => ["journeys", id],
  },
};
