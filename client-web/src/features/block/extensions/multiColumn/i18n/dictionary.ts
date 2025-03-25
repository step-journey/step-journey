import type { en } from "./locales/en";
import { BlockNoteEditor } from "@blocknote/core";

export function getMultiColumnDictionary(
  editor: BlockNoteEditor<any, any, any>,
) {
  if (!(editor.dictionary as any).multi_column) {
    throw new Error("Multi-column dictionary not found");
  }
  return (editor.dictionary as any).multi_column as MultiColumnDictionary;
}

export type MultiColumnDictionary = typeof en;
