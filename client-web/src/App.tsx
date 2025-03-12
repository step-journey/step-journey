import { Route, Routes } from "react-router-dom";
import PATH from "./constants/path.ts";
import Test from "./pages/Test";
import JourneyPage from "./pages/Journey/JourneyPage";
import HomePage from "@/pages/Home/HomePage";

const App = () => {
  return (
    <>
      <Routes>
        <Route path={PATH.HOME} element={<HomePage />} />
        <Route path={PATH.JOURNEY} element={<JourneyPage />} />
        <Route path={`${PATH.JOURNEY}/:journeyId`} element={<JourneyPage />} />
        <Route
          path={`${PATH.JOURNEY}/:journeyId/edit`}
          element={<JourneyPage />}
        />
        <Route path={PATH.TEST} element={<Test />} />
      </Routes>
    </>
  );
};

export default App;
