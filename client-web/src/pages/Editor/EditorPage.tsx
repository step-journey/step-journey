// src/pages/Editor/EditorPage.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { Block, createPageBlock } from "@/types/block";
import BlockEditor from "@/components/editor/BlockEditor";
import db from "@/db";
import { Button } from "@/components/ui/button";
import { IconArrowLeft, IconMenu2, IconPlus } from "@tabler/icons-react";
import PATH from "@/constants/path";

export default function EditorPage() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<Block | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState("Untitled");

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setIsLoading(true);
        let currentPage;

        if (pageId) {
          currentPage = await db.getBlock(pageId);
        }

        // 페이지가 없거나 root 페이지인 경우 새 페이지 생성
        if (!currentPage) {
          const newPageId = pageId || uuidv4();
          currentPage = createPageBlock("Untitled");
          currentPage.id = newPageId;
          await db.createBlock(currentPage);
        }

        setPage(currentPage);
        setTitle(currentPage.properties.title?.[0]?.[0] || "Untitled");
      } catch (error) {
        console.error("Failed to load page:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPage();
  }, [pageId]);

  const handleNavigateBack = () => {
    navigate(PATH.HOME);
  };

  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);

    if (page) {
      const updatedPage = {
        ...page,
        properties: {
          ...page.properties,
          title: [[newTitle, []]],
        },
      };
      await db.updateBlock(page.id, updatedPage);
      setPage(updatedPage);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="editor-page h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border p-2.5 flex items-center gap-2 sticky top-0 bg-background z-10">
        <Button
          variant="ghost"
          size="sm"
          className="mr-1"
          onClick={handleNavigateBack}
        >
          <IconArrowLeft className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="sm">
          <IconMenu2 className="h-4 w-4" />
        </Button>

        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          className="text-xl font-bold bg-transparent border-none outline-none flex-grow focus:ring-0"
          placeholder="Untitled"
        />

        <Button variant="outline" size="sm" className="gap-1">
          <IconPlus className="h-3.5 w-3.5" />
          <span className="text-xs">Share</span>
        </Button>
      </header>

      {/* Main editor area */}
      <main className="flex-grow overflow-auto">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {page && <BlockEditor pageId={page.id} />}
        </div>
      </main>
    </div>
  );
}
