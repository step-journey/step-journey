import { Route, Routes } from "react-router-dom";
import PATH from "./constants/path.ts";
import HomePage from "./features/home/components/HomePage";
import JourneyPage from "./features/journey/components/JourneyPage";

const App = () => {
  return (
    <>
      <Routes>
        <Route path={PATH.HOME} element={<HomePage />} />
        <Route path={PATH.JOURNEY} element={<JourneyPage />} />
        <Route path={`${PATH.JOURNEY}/:journeyId`} element={<JourneyPage />} />
      </Routes>
    </>
  );
};

export default App;
