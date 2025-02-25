import { Card } from "@/components/ui/card";
import { FlattenedStep } from "@/types/journey";

interface Props {
  currentStep: FlattenedStep;
}

export function JourneyContent({ currentStep }: Props) {
  // 미디어 렌더링 함수
  const renderMedia = () => {
    if (!currentStep.media) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-center text-gray-500">
            이 단계에 대한 시각적 자료가 없습니다
          </p>
        </div>
      );
    }

    const { type, url, alt, caption } = currentStep.media;

    switch (type) {
      case "image":
      case "gif":
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 flex items-center justify-center">
              <img
                src={url}
                alt={alt || currentStep.label}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            {caption && (
              <p className="mt-2 text-sm text-center text-gray-600">
                {caption}
              </p>
            )}
          </div>
        );
      case "video":
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 flex items-center justify-center">
              <video
                src={url}
                controls
                className="max-w-full max-h-full"
                autoPlay={false}
              >
                {alt && <track kind="captions" label={alt} />}
                브라우저가 비디오 재생을 지원하지 않습니다
              </video>
            </div>
            {caption && (
              <p className="mt-2 text-sm text-center text-gray-600">
                {caption}
              </p>
            )}
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-center text-gray-500">
              지원되지 않는 미디어 형식입니다
            </p>
          </div>
        );
    }
  };

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

        {/* 오른쪽 영역: 미디어 영역 */}
        <div className="w-1/2">
          <Card className="w-full h-full border border-gray-200 bg-white p-4 overflow-hidden">
            {renderMedia()}
          </Card>
        </div>
      </div>
    </div>
  );
}
