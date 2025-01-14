import { Route, Routes } from "react-router-dom";
import PATH from "./constants/path.ts";
import Test from "./pages/Test";

const App = () => {
  return (
    <>
      <Routes>
        <Route path={PATH.HOME} element={<>Hi</>} />
        <Route path={PATH.TEST} element={<Test />} />
      </Routes>
    </>
  );
};

export default App;
