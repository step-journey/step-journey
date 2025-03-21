import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { updateBlock } from "../services/blockService";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { useIsEditMode } from "../store/editorStore";

interface EditableJourneyTitleProps {
  journeyId: string;
  value: string;
  onBlur?: () => void;
  className?: string;
  placeholder?: string;
}

export function EditableJourneyTitle({
  journeyId,
  value,
  onBlur,
  className,
  placeholder = "제목 없음",
}: EditableJourneyTitleProps) {
  const titleRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const lastValueRef = useRef(value);
  const queryClient = useQueryClient();
  const isEditMode = useIsEditMode();

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
      titleRef.current?.blur();
    }
  };

  // 포커스 해제 시 즉시 DB 저장
  const handleBlur = async () => {
    const currentValue = titleRef.current?.textContent || "";

    try {
      console.log(
        `Journey title 업데이트 시도: ${journeyId}, "${currentValue}"`,
      );

      // blockService의 updateBlock 함수 활용
      await updateBlock({
        id: journeyId,
        properties: {
          title: currentValue,
        },
      });

      console.log("Journey title 업데이트 성공");

      // 쿼리 캐시 무효화 - journey 목록과 상세 정보 모두 갱신
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.journeys.detail(journeyId),
      });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.journeys.all,
      });

      // 상위 컴포넌트의 onBlur 호출
      onBlur?.();
    } catch (error) {
      console.error("제목 저장 중 오류:", error);
      toast.error("제목 저장에 실패했습니다");
    }
  };

  return (
    <div
      ref={titleRef}
      contentEditable={isEditMode} // View Mode에서는 편집 불가능하게 설정
      suppressContentEditableWarning
      className={cn(
        "outline-none border-none focus:ring-0 focus:ring-offset-0 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none leading-normal break-words",
        className,
      )}
      data-placeholder={placeholder}
      onInput={isEditMode ? handleInput : undefined} // View Mode에서는 input 이벤트 비활성화
      onBlur={isEditMode ? handleBlur : undefined} // View Mode에서는 blur 이벤트 비활성화
      onKeyDown={isEditMode ? handleKeyDown : undefined} // View Mode에서는 키 이벤트 비활성화
    />
  );
}
