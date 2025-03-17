import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useStepTitleStore } from "../store/stepTitleStore";
import { updateBlock } from "../services/blockService";
import { toast } from "sonner";

interface EditableTitleProps {
  stepId: string;
  value: string;
  onBlur?: () => void;
  className?: string;
  placeholder?: string;
}

export function EditableStepTitle({
  stepId,
  value,
  onBlur,
  className,
  placeholder = "제목 없음",
}: EditableTitleProps) {
  const titleRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const lastValueRef = useRef(value);

  // Zustand 스토어에서 액션 가져오기
  const { saveTitle } = useStepTitleStore();

  // 초기화 및 외부 값 변경 처리
  useEffect(() => {
    if (isInitialMount.current) {
      if (titleRef.current) {
        titleRef.current.textContent = value || "";
      }
      // 초기값 스토어에 저장
      saveTitle(stepId, value || "");
      isInitialMount.current = false;
    } else if (value !== lastValueRef.current && titleRef.current) {
      // 외부에서 값이 변경된 경우 UI 업데이트
      titleRef.current.textContent = value || "";
      lastValueRef.current = value;
      saveTitle(stepId, value || "");
    }
  }, [value, stepId, saveTitle]);

  // 입력 이벤트 처리
  const handleInput = () => {
    if (titleRef.current) {
      const newValue = titleRef.current.textContent || "";
      if (newValue !== lastValueRef.current) {
        lastValueRef.current = newValue;
        // 스토어에 현재 편집 중인 값 저장
        saveTitle(stepId, newValue);
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

  // 포커스 해제 시 즉시 DB 저장 - blockService.updateBlock 활용
  const handleBlur = async () => {
    const currentValue = titleRef.current?.textContent || "";

    try {
      console.log(`제목 업데이트 시도: ${stepId}, "${currentValue}"`);

      // blockService의 updateBlock 함수 활용 - 더 간결하고 안전한 구현
      await updateBlock({
        id: stepId,
        properties: {
          title: currentValue,
        },
      });

      console.log("제목 업데이트 성공");

      // 상위 컴포넌트의 onBlur 호출 (쿼리 캐시 무효화)
      onBlur?.();
    } catch (error) {
      console.error("제목 저장 중 오류:", error);
      toast.error("제목 저장에 실패했습니다");
    }
  };

  return (
    <div
      ref={titleRef}
      contentEditable
      suppressContentEditableWarning
      className={cn(
        "outline-none border-none focus:ring-0 focus:ring-offset-0 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none leading-normal break-words",
        className,
      )}
      data-placeholder={placeholder}
      onInput={handleInput}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
}
