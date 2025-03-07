import { useState } from "react";
import {
  IconChevronDown,
  IconChevronRight,
  IconVariable,
} from "@tabler/icons-react";
import { FlattenedStep, DebugVariable } from "@/types/journey";
import { Card } from "@/components/ui/card";
import { getDebugVariablesForStep } from "@/data/debug-variables";

interface JourneyVariablesPanelProps {
  currentStep: FlattenedStep;
  show: boolean;
  onToggle: () => void;
}

export function JourneyVariablesPanel({
  currentStep,
  show,
  onToggle,
}: JourneyVariablesPanelProps) {
  // 현재 단계에 따라 변수 데이터 가져오기 (JSON에서)
  const variables = getDebugVariablesForStep(currentStep);

  return (
    <div className="border-t border-gray-200">
      {/* 변수 패널 토글 버튼 */}
      <div
        className="flex items-center justify-center py-1 bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors"
        onClick={onToggle}
      >
        {show ? (
          <IconChevronDown size={16} className="mr-1" />
        ) : (
          <IconChevronRight size={16} className="mr-1" />
        )}
        <span className="text-xs font-medium">Variables & Debug Info</span>
      </div>

      {/* 변수 패널 내용 */}
      {show && (
        <div className="h-56">
          <Card className="w-full h-full border-t-0 rounded-t-none border border-gray-200 bg-white overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 bg-gray-100 border-b border-gray-200 px-3 py-2">
              <IconVariable size={16} className="text-gray-500" />
              <span className="text-sm font-medium">Variables</span>
            </div>

            <div className="overflow-y-auto flex-1 p-1">
              {variables.map((variable) => (
                <VariableTreeItem key={variable.name} variable={variable} />
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// 변수 트리 아이템 컴포넌트
function VariableTreeItem({ variable }: { variable: DebugVariable }) {
  const [isExpanded, setIsExpanded] = useState(variable.expanded || false);
  const hasChildren = variable.children && variable.children.length > 0;

  return (
    <div className="text-sm font-mono">
      <div
        className="flex items-center hover:bg-blue-50 rounded px-1 py-0.5 cursor-pointer"
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        {hasChildren ? (
          <IconChevronRight
            size={14}
            className={`mr-1 transition-transform ${isExpanded ? "rotate-90" : ""}`}
          />
        ) : (
          <div className="w-4 mr-1"></div>
        )}
        <span className="font-medium text-blue-800">{variable.name}</span>
        <span className="mx-1">=</span>
        <RenderVariableValue variable={variable} />
      </div>

      {isExpanded && hasChildren && (
        <div className="ml-5 border-l-2 border-gray-200 pl-2">
          {variable.children!.map((child) => (
            <VariableTreeItem key={child.name} variable={child} />
          ))}
        </div>
      )}
    </div>
  );
}

// 변수 값 렌더링 컴포넌트
function RenderVariableValue({ variable }: { variable: DebugVariable }) {
  // 값의 타입에 따라 다른 스타일 적용
  if (variable.children && variable.children.length > 0) {
    return (
      <span className="text-gray-500 italic">
        {variable.type} {variable.value && `(${variable.value})`}
      </span>
    );
  }

  // 기본 타입 값 렌더링
  let valueClass = "text-gray-700";

  if (typeof variable.value === "string") {
    valueClass = "text-green-600";
    // 문자열 값인 경우 따옴표 추가
    return <span className={valueClass}>&#34;{variable.value}&#34;</span>;
  } else if (typeof variable.value === "number") {
    valueClass = "text-blue-600";
  } else if (typeof variable.value === "boolean") {
    valueClass = "text-purple-600";
  } else if (variable.value === null) {
    valueClass = "text-gray-500 italic";
    return <span className={valueClass}>null</span>;
  }

  return <span className={valueClass}>{String(variable.value)}</span>;
}
