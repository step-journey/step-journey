import { Route, Routes } from "react-router-dom";
import PATH from "./constants/path.ts";
import HomePage from "@/pages/Home/HomePage";
import Test from "@/pages/Test";

const App = () => {
  return (
    <>
      <Routes>
        <Route path={PATH.HOME} element={<HomePage />} />
        <Route path={PATH.TEST} element={<Test />} />
      </Routes>
    </>
  );
};

export default App;
