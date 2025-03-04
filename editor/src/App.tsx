import { EditorProvider } from "./components/editor/EditorContext";
import { Editor } from "./components/editor/Editor";
import "./index.css";

function App() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Notion-like Block Editor</h1>
      <EditorProvider>
        <Editor />
      </EditorProvider>
    </div>
  );
}

export default App;
