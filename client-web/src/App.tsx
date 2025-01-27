import { Route, Routes } from "react-router-dom";
import PATH from "./constants/path.ts";
import Test from "./pages/Test";
import JourneyPage from "./pages/Journey/JourneyPage";
import AboutPage from "./pages/About";
import HomePage from "@/pages/Home/HomePage";

const App = () => {
  return (
    <>
      <Routes>
        <Route path={PATH.HOME} element={<HomePage />} />
        <Route path={PATH.JOURNEY} element={<JourneyPage />} />
        <Route path={PATH.TEST} element={<Test />} />
        <Route path={PATH.ABOUT} element={<AboutPage />} />
      </Routes>
    </>
  );
};

export default App;
