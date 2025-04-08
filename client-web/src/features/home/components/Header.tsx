import { Link } from "react-router-dom";
import { AuthStatus } from "./AuthStatus";
import PATH from "@/constants/path";
import * as React from "react";
import { Container } from "@/components/layout/Container";

export function Header() {
  // 클릭 이벤트 방지 함수
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <header className="w-full h-16 border-b border-border/40 bg-background sticky top-0 z-10">
      <Container className="h-full flex items-center justify-between">
        <div className="flex items-center">
          {/* Logo */}
          <Link to={PATH.HOME} className="text-xl font-bold">
            StepJourney
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center ml-16">
            <Link
              to="/"
              className="text-sm font-medium hover:text-primary transition-colors mr-8"
              onClick={handleClick}
            >
              홈
            </Link>
            <Link
              to="/forums"
              className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors mr-8"
              onClick={handleClick}
            >
              뉴스
            </Link>
            <Link
              to="/news"
              className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
              onClick={handleClick}
            >
              게시판
            </Link>
          </nav>
        </div>

        {/* 인증 상태 영역 */}
        <AuthStatus />
      </Container>
    </header>
  );
}
