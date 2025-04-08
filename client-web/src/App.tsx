import { Route, Routes } from "react-router-dom";
import PATH from "./constants/path.ts";
import HomePage from "./features/home/components/HomePage";
import JourneyPage from "./features/journey/components/JourneyPage";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useCurrentUser } from "@/features/auth/hooks/useAuth";
import { useEffect } from "react";
import {AuthCallbackPage} from "@/pages/AuthCallbackPage";

const App = () => {
  const { setUser, setLoading } = useAuthStore();
  const { data: user, isSuccess, isError, isLoading } = useCurrentUser();

  // 인증 상태 처리
  useEffect(() => {
    if (isLoading) {
      setLoading(true);
    } else if (isSuccess && user) {
      setUser(user);
    } else if (isError) {
      setUser(null);
    }
  }, [user, isSuccess, isError, isLoading, setUser, setLoading]);

  return (
    <>
      <Routes>
        <Route path={PATH.HOME} element={<HomePage />} />
        <Route path={PATH.AUTH_CALLBACK} element={<AuthCallbackPage />} />
        <Route path={PATH.JOURNEY} element={<JourneyPage />} />
        <Route path={`${PATH.JOURNEY}/:journeyId`} element={<JourneyPage />} />
      </Routes>
    </>
  );
};

export default App;
