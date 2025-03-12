export function handleKeyboardShortcuts(
  e: KeyboardEvent,
  goPrev: () => void,
  goNext: () => void,
) {
  const tagName = (e.target as HTMLElement).tagName.toLowerCase();
  if (["input", "textarea", "select"].includes(tagName)) return;

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
