import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { updateBlock } from "../services/blockService";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";

interface EditableStepGroupTitleProps {
  groupId: string;
  value: string;
  onBlur?: () => void;
  className?: string;
  placeholder?: string;
  journeyId: string;
  isEditing: boolean;
  onEditingChange: (isEditing: boolean) => void;
  onComplete?: () => void;
}

export function EditableStepGroupTitle({
  groupId,
  value,
  onBlur,
  className,
  placeholder = "제목 없음",
  journeyId,
  isEditing,
  onEditingChange,
  onComplete,
}: EditableStepGroupTitleProps) {
  const titleRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const lastValueRef = useRef(value);
  const queryClient = useQueryClient();

  // 초기화 및 외부 값 변경 처리
  useEffect(() => {
    if (isInitialMount.current) {
      if (titleRef.current) {
        titleRef.current.textContent = value || "";
      }
      isInitialMount.current = false;
    } else if (value !== lastValueRef.current && titleRef.current) {
      // 외부에서 값이 변경된 경우 UI 업데이트
      titleRef.current.textContent = value || "";
      lastValueRef.current = value;
    }
  }, [value]);

  // 편집 모드가 활성화될 때 포커스 및 텍스트 전체 선택 설정
  useEffect(() => {
    if (isEditing && titleRef.current) {
      // 편집 모드가 활성화되면 포커스 설정
      titleRef.current.focus();

      // 텍스트 전체 선택
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(titleRef.current);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [isEditing]);

  // 입력 이벤트 처리
  const handleInput = () => {
    if (titleRef.current) {
      const newValue = titleRef.current.textContent || "";
      if (newValue !== lastValueRef.current) {
        lastValueRef.current = newValue;
      }
    }
  };

  // Enter 키 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      completeEditing(); // completeEditing 함수 사용
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (titleRef.current) {
        titleRef.current.textContent = value || "";
      }
      clearSelection(); // 텍스트 선택 해제
      titleRef.current?.blur();
      onEditingChange(false);
    }
  };

  // 텍스트 선택 해제 유틸리티 함수
  const clearSelection = () => {
    window.getSelection()?.removeAllRanges();
  };

  // 포커스 해제 시 즉시 DB 저장
  const handleBlur = async () => {
    const currentValue = titleRef.current?.textContent || "";

    try {
      // 값이 변경되었을 때만 저장
      if (currentValue !== value) {
        console.log(
          `Step group title 업데이트 시도: ${groupId}, "${currentValue}"`,
        );

        // blockService의 updateBlock 함수 활용
        await updateBlock({
          id: groupId,
          properties: {
            title: currentValue,
          },
        });

        console.log("Step group title 업데이트 성공");

        // 쿼리 캐시 무효화 - journey 상세 정보 갱신
        await queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.journeys.detail(journeyId),
        });

        // 상위 컴포넌트의 onBlur 호출
        onBlur?.();
      }
    } catch (error) {
      console.error("그룹 제목 저장 중 오류:", error);
      toast.error("그룹 제목 저장에 실패했습니다");
    }

    // 텍스트 선택 해제 (편집 완료 시)
    clearSelection();

    // 오류가 있든 없든 편집 모드 종료
    onEditingChange(false);
  };

  // 편집 완료 처리 함수
  const completeEditing = () => {
    // 텍스트 선택 해제 (Enter 키로 완료 시)
    clearSelection();
    handleBlur(); // 데이터 저장 처리
    onComplete?.(); // 완료 콜백 호출
  };

  // WYSIWYG 스타일 유지를 위해 편집 모드와 뷰 모드에서 스타일 적용
  // 편집 모드일 때는 특별한 스타일 추가
  const titleStyle = cn(
    "text-sm transition-all duration-150",
    className,
    isEditing
      ? "bg-blue-50 border border-blue-200 rounded px-2 py-0.5 min-w-[100px] outline-none focus-visible:outline-none focus:ring-0 ring-0 focus-visible:ring-0"
      : "truncate",
  );

  return (
    <div
      ref={titleRef}
      contentEditable={isEditing}
      suppressContentEditableWarning={isEditing}
      className={titleStyle}
      data-placeholder={placeholder}
      onInput={isEditing ? handleInput : undefined}
      onBlur={isEditing ? handleBlur : undefined}
      onKeyDown={isEditing ? handleKeyDown : undefined}
      onClick={isEditing ? (e) => e.stopPropagation() : undefined}
    >
      {value || placeholder}
    </div>
  );
}
