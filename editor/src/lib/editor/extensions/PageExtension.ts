import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import PageComponent from "@/components/editor/blocks/PageBlock";

export interface PageOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    page: {
      setPage: () => ReturnType;
      togglePage: () => ReturnType;
    };
  }
}

export default Node.create<PageOptions>({
  name: "page",

  group: "block",

  content: "block+",

  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: "border border-border rounded-md p-4 my-4 bg-muted/20",
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type=page]" }, { tag: "div.page-block" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "page",
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PageComponent);
  },

  addCommands() {
    return {
      setPage:
        () =>
        ({ commands }) => {
          return commands.setNode(this.name);
        },
      togglePage:
        () =>
        ({ commands }) => {
          return commands.toggleNode(this.name, "paragraph");
        },
    };
  },
});
