import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import {
  Block as StepJourneyBlock,
  createPageBlock,
  TextFormat,
} from "@/types/block";
import db from "@/db";
import { Button } from "@/components/ui/button";
import { IconArrowLeft, IconMenu2, IconPlus } from "@tabler/icons-react";
import PATH from "@/constants/path";

import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { Block } from "@blocknote/core";

export default function EditorPage() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<StepJourneyBlock | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState("Untitled");
  const [savedContent, setSavedContent] = useState<Block[]>([]);

  // editor 인스턴스 생성
  const editor = useCreateBlockNote({
    initialContent:
      savedContent.length > 0
        ? savedContent
        : [{ type: "paragraph", content: "Start typing here..." }],
  });

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setIsLoading(true);
        let currentPage;

        if (pageId) {
          currentPage = await db.getBlock(pageId);
        }

        if (!currentPage) {
          const newPageId = pageId || uuidv4();
          currentPage = createPageBlock("Untitled");
          currentPage.id = newPageId;
          await db.createBlock(currentPage);
        }

        setPage(currentPage);
        setTitle(currentPage.properties.title?.[0]?.[0] || "Untitled");

        if (currentPage.format?.blockNoteContent) {
          try {
            const blockNoteContent = JSON.parse(
              currentPage.format.blockNoteContent,
            );
            setSavedContent(blockNoteContent);
          } catch (error) {
            console.error("Failed to parse BlockNote content:", error);
          }
        }
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
      // TextFormat 타입에 맞게 타입 명시적 지정
      const updatedProperties = {
        ...page.properties,
        title: [[newTitle, []]] as [string, TextFormat[]][],
      };

      // 페이지 제목 업데이트
      await db.updateBlock(page.id, {
        properties: updatedProperties,
      });

      // 로컬 상태 업데이트
      setPage({
        ...page,
        properties: updatedProperties,
      });
    }
  };

  // useCallback을 사용하여 함수 메모이제이션
  const handleEditorChange = useCallback(async () => {
    if (!page) return;

    // 에디터 문서 내용 가져오기
    const content = editor.document;
    console.log("Editor content changed:", content); // 디버깅용

    try {
      // IndexedDB에 저장
      await db.updateBlock(page.id, {
        format: {
          ...page.format,
          blockNoteContent: JSON.stringify(content),
        },
      });
      console.log("Saved to IndexedDB successfully");
    } catch (error) {
      console.error("Failed to save BlockNote content:", error);
    }
  }, [editor, page]);

  // 에디터 변경 감지를 위한 useEffect
  useEffect(() => {
    if (editor && page) {
      // 이벤트 구독 - 이벤트 리스너를 직접 등록
      const changeHandler = () => {
        handleEditorChange();
      };

      // 수동으로 이벤트 리스너 등록하기
      editor.onEditorContentChange(changeHandler);

      // cleanup 함수 - 명시적으로 이벤트 리스너 제거 방법이 없다면
      // 빈 함수로 두거나 필요하다면 다른 정리 작업 수행
      return () => {
        // 이벤트 리스너 제거 메서드가 있다면 여기서 호출
        // 없다면 빈 함수로 두기
      };
    }
  }, [editor, page, handleEditorChange]);

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
          {page && (
            <BlockNoteView
              editor={editor}
              onChange={handleEditorChange}
              theme="light"
            />
          )}
        </div>
      </main>
    </div>
  );
}
