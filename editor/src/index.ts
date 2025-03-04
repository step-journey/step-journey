// Export main components
export { Editor } from "./components/editor/Editor";

// Export types and utilities
export type { Block, EditorProps } from "./components/editor/Editor";
export {
  createEditorExtensions,
  createBlockExtension,
} from "./lib/editor/config";

// Export editor utils
export * from "./lib/editor/utils";
