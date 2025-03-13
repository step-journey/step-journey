export function handleKeyboardShortcuts(
  e: KeyboardEvent,
  goPrev: () => void,
  goNext: () => void,
) {
  const target = e.target as HTMLElement;

  // 에디터 영역 내부인지 확인하는 방법들
  const isInEditor =
    // 1. 일반적인 입력 요소 체크
    ["input", "textarea", "select"].includes(target.tagName.toLowerCase()) ||
    // 2. contentEditable 요소 체크
    target.isContentEditable ||
    // 3. BlockNote 에디터 컨테이너 내부인지 체크
    target.closest(".bn-container") !== null ||
    target.closest(".bn-editor") !== null ||
    // 4. data-slate-editor 속성을 가진 요소 체크 (slate 기반 에디터용)
    target.closest("[data-slate-editor]") !== null;

  // 에디터 내부면 단축키 실행하지 않음
  if (isInEditor) return;

  // 화살표 키 처리
  if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
    e.preventDefault();
    goPrev();
    return;
  }
  if (e.key === "ArrowRight" || e.key === "ArrowDown") {
    e.preventDefault();
    goNext();
    return;
  }
}
