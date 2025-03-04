import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import ToggleListComponent from "@/components/editor/blocks/ToggleBlock";

export interface ToggleListOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    // 충돌 방지를 위한 이름 변경
    toggleListNode: {
      toggleList: () => ReturnType;
      toggleToggleList: () => ReturnType;
    };
  }
}

export default Node.create<ToggleListOptions>({
  name: "toggleList",

  group: "block",

  content: "block+",

  defining: true,

  addAttributes() {
    return {
      open: {
        default: false,
        parseHTML: (element) => element.getAttribute("data-open") === "true",
        renderHTML: (attributes) => {
          return { "data-open": attributes.open ? "true" : "false" };
        },
      },
      summary: {
        default: "Toggle",
        parseHTML: (element) => element.getAttribute("data-summary"),
        renderHTML: (attributes) => {
          return { "data-summary": attributes.summary };
        },
      },
    };
  },

  addOptions() {
    return {
      HTMLAttributes: {
        class: "toggle-list my-4",
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type=toggle-list]" }, { tag: "div.toggle-list" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "toggle-list",
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ToggleListComponent);
  },

  // 명령어 수정
  addCommands() {
    return {
      toggleList:
        () =>
        ({ commands }) => {
          return commands.setNode(this.name);
        },
      toggleToggleList:
        () =>
        ({ commands }) => {
          return commands.toggleNode(this.name, "paragraph");
        },
    };
  },
});
