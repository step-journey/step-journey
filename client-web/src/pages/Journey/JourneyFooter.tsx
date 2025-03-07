import { IconPlayerTrackNext, IconPlayerTrackPrev } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface Props {
  globalIndex: number;
  setGlobalIndex: (val: number) => void;
  goPrev: () => void;
  goNext: () => void;
  totalSteps: number; // 전체 단계 수
}

export function JourneyFooter({
  globalIndex,
  setGlobalIndex,
  goPrev,
  goNext,
  totalSteps,
}: Props) {
  // 슬라이더 onChange
  const handleSliderChange = (val: number[]) => {
    setGlobalIndex(val[0]);
  };

  // 슬라이더 PointerUp 시 포커스 해제
  const handleSliderPointerUp = () => {
    setTimeout(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }, 0);
  };

  return (
    <div className="flex h-12 shrink-0 items-center gap-3 border-t border-gray-200 bg-white px-4">
      {/* 슬라이더 (flex-1) */}
      <Slider
        className="flex-1"
        // max를 totalSteps - 1로 설정 → 0~(총개수-1)
        max={totalSteps - 1}
        value={[globalIndex]}
        onValueChange={handleSliderChange}
        onPointerUp={handleSliderPointerUp}
      />

      {/* Prev / Next 버튼 */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={goPrev}>
          <IconPlayerTrackPrev className="mr-1" size={16} />
          Prev
        </Button>
        <Button variant="outline" size="sm" onClick={goNext}>
          Next
          <IconPlayerTrackNext className="ml-1" size={16} />
        </Button>
      </div>

      {/* Step 표시 */}
      <span className="w-20 whitespace-nowrap text-right text-sm text-gray-500">
        Step {globalIndex + 1} / {totalSteps}
      </span>
    </div>
  );
}
