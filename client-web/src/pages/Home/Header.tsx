import { Button } from "@/components/ui/button";

/**
 * 헤더 컴포넌트
 * 좌측에 "StepJourney" 글씨 로고, 우측에 "로그인" 버튼
 */
interface HeaderProps {
  onClickLogin: () => void;
}

export default function Header({ onClickLogin }: HeaderProps) {
  return (
    <header className="h-14 w-full px-4 pr-6 border-b border-border flex items-center">
      {/* 좌측 로고 텍스트 */}
      <div className="text-xl font-semibold">StepJourney</div>

      <div className="ml-auto">
        <Button variant="default" size="sm" onClick={onClickLogin}>
          로그인
        </Button>
      </div>
    </header>
  );
}
