import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { Editor } from "@tiptap/react";

interface EditorContextType {
  editor: Editor | null;
  setEditor: (editor: Editor | null) => void;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
}

const EditorContext = createContext<EditorContextType>({
  editor: null,
  setEditor: () => {},
  isEditing: true,
  setIsEditing: () => {},
});

interface EditorProviderProps {
  children: ReactNode;
  initialEditing?: boolean;
}

export const EditorProvider = ({
  children,
  initialEditing = true,
}: EditorProviderProps) => {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [isEditing, setIsEditing] = useState(initialEditing);

  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [editor, isEditing]);

  return (
    <EditorContext.Provider
      value={{ editor, setEditor, isEditing, setIsEditing }}
    >
      {children}
    </EditorContext.Provider>
  );
};

export const useEditorContext = () => useContext(EditorContext);

export default EditorContext;
