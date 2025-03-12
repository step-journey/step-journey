import { MutableRefObject } from "react";
import { FlattenedStep } from "@/features/journey/types/journey";

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

export function scrollToCurrentStep(
  currentStep: FlattenedStep,
  expandedGroups: Record<string, boolean>,
  stepContainerRefs: MutableRefObject<Record<string, HTMLDivElement | null>>,
) {
  const groupId = currentStep.groupId;
  if (!expandedGroups[groupId]) return;

  setTimeout(() => {
    const container = stepContainerRefs.current[groupId];
    if (!container) return;
    const stepEl = container.querySelector(
      `#step-${currentStep.globalIndex}`,
    ) as HTMLElement | null;
    if (stepEl) {
      stepEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, 0);
}
