export const queryKeys = {
  users: {
    all: ["users"] as const,
    me: () => [...queryKeys.users.all, "me"] as const,
  },
  journeys: {
    all: ["journeys"],
    detail: (id: string) => ["journeys", id],
  },
};

export type QueryKeys = typeof queryKeys;
export type UserQueryKeys = QueryKeys["users"];
export type JourneyQueryKeys = QueryKeys["journeys"];
