import { useState, useEffect, useRef } from "react";

type SaveCallback<T> = (data: T) => Promise<void>;

interface AutoSaveOptions {
  debounceTime?: number;
  onSaveStart?: () => void;
  onSaveEnd?: (success: boolean) => void;
}

/**
 * 자동 저장 기능을 제공하는 훅
 * @param data 저장할 데이터
 * @param saveCallback 데이터 저장 함수
 * @param options 옵션 (디바운스 시간, 저장 시작/종료 콜백)
 */
export function useAutoSave<T>(
  data: T,
  saveCallback: SaveCallback<T>,
  options: AutoSaveOptions = {},
) {
  const { debounceTime = 500, onSaveStart, onSaveEnd } = options;

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "failed"
  >("idle");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<T>(data);

  // 자동 저장 함수
  const autoSave = async () => {
    if (isSaving) return;

    try {
      setIsSaving(true);
      setSaveStatus("saving");
      if (onSaveStart) onSaveStart();

      await saveCallback(data);
      lastSavedDataRef.current = data;
      setSaveStatus("saved");

      if (onSaveEnd) onSaveEnd(true);
    } catch (error) {
      console.error("Auto-save failed:", error);
      setSaveStatus("failed");
      if (onSaveEnd) onSaveEnd(false);
    } finally {
      setIsSaving(false);
    }
  };

  // 데이터 변경 시 자동 저장 예약
  useEffect(() => {
    // 데이터가 마지막 저장 데이터와 다른 경우에만 저장 진행
    const hasChanges =
      JSON.stringify(data) !== JSON.stringify(lastSavedDataRef.current);

    if (hasChanges) {
      setSaveStatus("idle");

      // 이전에 예약된 타이머가 있으면 취소
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // 새로운 타이머 예약
      timeoutRef.current = setTimeout(autoSave, debounceTime);
    }

    // 컴포넌트 언마운트 시 타이머 정리
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, debounceTime]);

  return { isSaving, saveStatus };
}
