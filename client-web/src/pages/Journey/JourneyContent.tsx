import { Card } from "@/components/ui/card";
import { FlattenedStep } from "@/types/journey";

interface Props {
  currentStep: FlattenedStep;
}

export function JourneyContent({ currentStep }: Props) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-6">
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
  );
}
