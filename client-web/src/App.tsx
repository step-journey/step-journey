import { Route, Routes } from "react-router-dom";
import PATH from "./constants/path.ts";
import HomePage from "@/pages/Home/HomePage";
import EditorPage from "@/pages/Editor/EditorPage";
import Test from "@/pages/Test";

const App = () => {
  return (
    <>
      <Routes>
        <Route path={PATH.HOME} element={<HomePage />} />
        <Route path={PATH.EDITOR} element={<EditorPage />} />
        <Route path={PATH.EDITOR_WITH_ID} element={<EditorPage />} />
        <Route path={PATH.TEST} element={<Test />} />
      </Routes>
    </>
  );
};

export default App;
