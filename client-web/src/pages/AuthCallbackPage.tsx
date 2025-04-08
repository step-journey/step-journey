import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import queryClient from "@/lib/queryClient";
import { queryKeys } from "@/api/queryKeys";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [loadingText, setLoadingText] = useState("로그인 정보 확인 중");

  useEffect(() => {
    // 로딩 텍스트를 주기적으로 업데이트
    const loadingInterval = setInterval(() => {
      setLoadingText((prev) =>
        prev === "로그인 정보 확인 중..." ? "로그인 정보 확인 중" : prev + ".",
      );
    }, 500);

    // 사용자 데이터 갱신
    queryClient.invalidateQueries({ queryKey: queryKeys.users.me() });

    // 최소 3초 대기 후 홈 페이지로 리디렉션
    const redirectTimer = setTimeout(() => {
      clearInterval(loadingInterval);
      navigate("/", { replace: true });
    }, 1000);

    // 컴포넌트 언마운트 시 타이머 정리
    return () => {
      clearTimeout(redirectTimer);
      clearInterval(loadingInterval);
    };
  }, [navigate]);

  // 로딩 상태 표시
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center p-8 rounded-lg shadow-lg bg-card max-w-md w-full">
        <h2 className="text-2xl font-medium mb-6">인증 완료</h2>
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-lg text-muted-foreground">{loadingText}</p>
        <p className="mt-4 text-sm text-muted-foreground">
          잠시 후 메인 페이지로 이동합니다...
        </p>
      </div>
    </div>
  );
}
