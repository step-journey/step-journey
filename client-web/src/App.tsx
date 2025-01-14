import { Route, Routes } from "react-router-dom";
import PATH from "./constants/path.ts";
import Test from "./pages/Test";
import DebuggerPage from "./pages/Debugger";
import AboutPage from "./pages/About";

const App = () => {
  return (
    <>
      <Routes>
        <Route path={PATH.HOME} element={<DebuggerPage />} />
        <Route path={PATH.TEST} element={<Test />} />
        <Route path={PATH.ABOUT} element={<AboutPage />} />
      </Routes>
    </>
  );
};

export default App;
