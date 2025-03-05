import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import LoginModal from "./LoginModal";
import { useUserQuery, useLogoutMutation } from "@/hooks/useAuth";
import { createPageBlock, Block } from "@/types/block";
import db from "@/db";
import {
  IconPlus,
  IconDots,
  IconChevronRight,
  IconFileText,
  IconStar,
  IconSearch,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import PATH from "@/constants/path";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const navigate = useNavigate();
  // 로그인 모달 열림 여부
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [rootPageId, setRootPageId] = useState<string | null>(null);
  const [pages, setPages] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // TanStack Query
  const { data: user } = useUserQuery();
  const logoutMutation = useLogoutMutation();

  // 로그인 모달 열고 닫기
  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  // 로그아웃
  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // 루트 페이지 로드 또는 생성
  useEffect(() => {
    const initRootPage = async () => {
      setIsLoading(true);
      // 로컬 스토리지에서 루트 페이지 ID 확인
      const storedRootPageId = localStorage.getItem("rootPageId");

      try {
        if (storedRootPageId) {
          // 저장된 루트 페이지가 존재하는지 확인
          const page = await db.getBlock(storedRootPageId);
          if (page) {
            setRootPageId(storedRootPageId);
            loadPages(storedRootPageId);
            return;
          }
        }

        // 루트 페이지 생성
        const rootPage = createPageBlock("Welcome to StepJourney");
        await db.createBlock(rootPage);

        // 로컬 스토리지에 루트 페이지 ID 저장
        localStorage.setItem("rootPageId", rootPage.id);
        setRootPageId(rootPage.id);
        setPages([]);
      } catch (error) {
        console.error("Failed to initialize root page:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initRootPage();
  }, []);

  // 페이지 목록 로드
  const loadPages = async (parentId: string) => {
    try {
      const childPages = await db.getBlocksWithParent(parentId);
      setPages(childPages.filter((p) => p.type === "page"));
    } catch (error) {
      console.error("Failed to load pages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 새 페이지 생성
  const createNewPage = async () => {
    if (!rootPageId) return;

    try {
      const newPage = createPageBlock("Untitled", rootPageId);
      await db.createBlock(newPage);

      // 루트 페이지에 새 페이지 추가
      const rootPage = await db.getBlock(rootPageId);
      if (rootPage) {
        const newContent = [...rootPage.content, newPage.id];
        await db.updateBlock(rootPageId, { content: newContent });

        // 페이지 목록 새로고침
        loadPages(rootPageId);

        // 새 페이지로 이동
        navigate(`${PATH.EDITOR}/${newPage.id}`);
      }
    } catch (error) {
      console.error("Failed to create new page:", error);
    }
  };

  const handlePageClick = (pageId: string) => {
    navigate(`${PATH.EDITOR}/${pageId}`);
  };

  return (
    <div
      className={cn(
        "home-page flex flex-col min-h-screen bg-background text-foreground",
      )}
    >
      {/* 상단 Header: user, onClickLogin, onClickLogout 전달 */}
      <Header
        // user는 (User | null | undefined)이므로, undefined 인 경우 null 로 대체
        user={user ?? null}
        onClickLogin={openLoginModal}
        onClickLogout={handleLogout}
      />

      {/* 메인 레이아웃 (좌 사이드바 - 중앙 본문) */}
      <div className="flex flex-1 bg-background text-foreground">
        {/* 좌측 사이드바 */}
        <aside className="w-60 border-r border-border overflow-y-auto flex flex-col">
          {/* 사이드바 상단 검색 및 새 페이지 버튼 */}
          <div className="p-3 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              {user ? (
                <span className="font-medium">{user.name}&#39;s Notion</span>
              ) : (
                <span className="font-medium">StepJourney</span>
              )}
              <Button size="icon" variant="ghost" className="h-6 w-6">
                <IconDots className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              className="w-full justify-start text-sm gap-2"
              onClick={() => {}}
            >
              <IconSearch className="h-4 w-4" />
              Search
            </Button>
          </div>

          {/* Favorites section */}
          <div className="py-2">
            <div className="px-3 py-1 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <IconChevronRight className="h-3.5 w-3.5" />
                <span>FAVORITES</span>
              </div>
            </div>
          </div>

          {/* Pages section */}
          <div className="py-2">
            <div className="px-3 py-1 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <IconChevronRight className="h-3.5 w-3.5" />
                <span>PRIVATE</span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5"
                onClick={createNewPage}
              >
                <IconPlus className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Page list */}
            <div className="mt-1">
              {isLoading ? (
                <div className="px-3 py-1 text-sm text-muted-foreground">
                  Loading...
                </div>
              ) : pages.length > 0 ? (
                pages.map((page) => (
                  <div
                    key={page.id}
                    className="px-3 py-1 hover:bg-accent/50 cursor-pointer flex items-center gap-2 text-sm group"
                    onClick={() => handlePageClick(page.id)}
                  >
                    <IconFileText className="h-4 w-4 text-muted-foreground" />
                    <span>{page.properties.title?.[0]?.[0] || "Untitled"}</span>
                    <IconStar className="h-3.5 w-3.5 ml-auto opacity-0 group-hover:opacity-100 text-muted-foreground" />
                  </div>
                ))
              ) : (
                <div className="px-3 py-1 text-sm text-muted-foreground">
                  No pages yet
                </div>
              )}
            </div>
          </div>

          {/* Bottom create button */}
          <div className="mt-auto p-3 border-t border-border">
            <Button
              variant="outline"
              className="w-full justify-start text-sm gap-2"
              onClick={createNewPage}
            >
              <IconPlus className="h-4 w-4" />
              New page
            </Button>
          </div>
        </aside>

        {/* 중앙 본문 */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Welcome to StepJourney</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div
                className="border border-border rounded-lg p-4 hover:bg-accent/10 cursor-pointer"
                onClick={createNewPage}
              >
                <h3 className="font-medium mb-2">Create a new page</h3>
                <p className="text-sm text-muted-foreground">
                  Start writing and organizing your ideas
                </p>
              </div>

              <div className="border border-border rounded-lg p-4 hover:bg-accent/10 cursor-pointer">
                <h3 className="font-medium mb-2">Explore templates</h3>
                <p className="text-sm text-muted-foreground">
                  Choose from pre-made templates
                </p>
              </div>
            </div>

            {pages.length > 0 && (
              <div>
                <h2 className="text-xl font-medium mb-4">Your pages</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pages.map((page) => (
                    <div
                      key={page.id}
                      className="border border-border rounded-lg p-3 hover:bg-accent/10 cursor-pointer"
                      onClick={() => handlePageClick(page.id)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <IconFileText className="h-4 w-4" />
                        <span className="font-medium">
                          {page.properties.title?.[0]?.[0] || "Untitled"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created:{" "}
                        {new Date(page.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 로그인 모달 */}
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
    </div>
  );
}
