import { Button } from "@/components/ui/button";
import { LoginModal } from "@/features/auth/components/LoginModal";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { IconUserCircle } from "@tabler/icons-react";
import { useState } from "react";
import * as React from "react";

export function AuthStatus() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { user, isLoggedIn, isLoading, logout } = useAuthStore();

  // 로그인 버튼 클릭 핸들러
  const handleLoginClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoginModalOpen(true);
  };

  // 로그아웃 버튼 클릭 핸들러
  const onClickLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await logout();
  };

  // 로딩 중일 때는 빈 공간 표시 (또는 원하는 스켈레톤 컴포넌트 사용)
  if (isLoading) {
    return <div className="flex items-center gap-3 h-8 w-[120px]"></div>;
  }

  // 로그인 상태에 따라 다른 UI 표시
  return (
    <>
      {isLoggedIn && user ? (
        <div className="flex items-center gap-3">
          <IconUserCircle size={20} />
          <span className="text-sm">{user.nickname}님</span>
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={onClickLogout}
          >
            로그아웃
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="font-medium cursor-pointer"
          onClick={handleLoginClick}
        >
          로그인
        </Button>
      )}

      {/* 로그인 모달 */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
}
