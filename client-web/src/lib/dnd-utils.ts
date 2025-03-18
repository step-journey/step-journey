import type { Transform } from "@dnd-kit/utilities";

export const CSS = {
  Translate: {
    toString(transform: Transform | null) {
      if (!transform) {
        return;
      }

      const { x, y } = transform;
      return `translate3d(${x}px, ${y}px, 0)`;
    },
  },
};
