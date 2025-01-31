import { Card } from "@/components/ui/card";
import { FlattenedStep } from "@/types/journey";

interface Props {
  currentStep: FlattenedStep;
}

export function JourneyContent({ currentStep }: Props) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-6">
      {/* 좌/우 2열로 분할 */}
      <div className="flex gap-6 h-full">
        {/* 왼쪽 영역 (기존 내용) */}
        <div className="w-1/2">
          <p className="mb-1 text-lg font-semibold">
            Current Step: {currentStep.label}
          </p>
          <p className="mb-4 text-sm text-gray-500">{currentStep.desc}</p>

          <Card className="border border-gray-200 bg-white p-4">
            <p className="mb-2 text-sm font-medium">여기에 해당 단계 내용</p>
            <ul className="list-inside list-disc text-sm text-gray-600">
              <li>코드 스니펫, 서버로그, API 응답 등</li>
              <li>직접 조작 예시</li>
            </ul>
          </Card>
        </div>

        {/* 오른쪽 영역: 전체 크기를 차지하는 Card */}
        <div className="w-1/2">
          <Card className="w-full h-full flex items-center justify-center border border-gray-200 bg-white p-4">
            <p className="text-sm text-center">
              이곳에 각 <b>step의 시각적인 변화</b>가 들어갈 예정
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
