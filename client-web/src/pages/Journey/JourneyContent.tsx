import { Card } from "@/components/ui/card";
import { FlattenedStep } from "@/types/journey";
import { ChatbotFlowDiagram } from "./ChatbotFlowDiagram";

interface Props {
  currentStep: FlattenedStep;
  allSteps: FlattenedStep[];
}

export function JourneyContent({ currentStep, allSteps }: Props) {
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

            {/* 예시 내용이 있는 경우 표시 */}
            {currentStep.example && (
              <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Example:</p>
                <code className="text-sm">{currentStep.example}</code>
              </div>
            )}
          </Card>
        </div>

        {/* 오른쪽 영역: 다이어그램 */}
        <div className="w-1/2">
          <Card className="w-full h-full border border-gray-200 bg-white p-4 overflow-hidden">
            <ChatbotFlowDiagram currentStep={currentStep} allSteps={allSteps} />
          </Card>
        </div>
      </div>
    </div>
  );
}
