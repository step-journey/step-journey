import { Button } from "@/components/ui/button";
import { IconUserCircle } from "@tabler/icons-react";
import { User } from "@/types/auth";

/**
 * 헤더 컴포넌트
 * - isLoading이 true면 로딩 상태를 보여줍니다.
 * - user가 null이면 "로그인" 버튼을 보여주고,
 * - user가 있으면 "아이콘 + 유저이름 + 로그아웃" 버튼을 보여줍니다.
 */
interface HeaderProps {
  user: User | null;
  onClickLogin: () => void;
  onClickLogout: () => void;
  isLoading?: boolean;
}

export default function Header({
  user,
  onClickLogin,
  onClickLogout,
  isLoading = false,
}: HeaderProps) {
  return (
    <header className="h-14 w-full px-4 pr-6 border-b border-border flex items-center">
      {/* 좌측 로고 텍스트 */}
      <div className="text-xl font-semibold">StepJourney</div>

      {/* 우측 영역 */}
      <div className="ml-auto">
        {isLoading ? (
          <span className="text-sm text-muted-foreground">로딩 중...</span>
        ) : user ? (
          <div className="flex items-center gap-3">
            <IconUserCircle size={20} />
            <span className="text-sm">{user.name}님</span>
            <Button variant="outline" size="sm" onClick={onClickLogout}>
              로그아웃
            </Button>
          </div>
        ) : (
          <Button variant="default" size="sm" onClick={onClickLogin}>
            로그인
          </Button>
        )}
      </div>
    </header>
  );
}
