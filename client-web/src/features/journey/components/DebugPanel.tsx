import { useState } from "react";
import { IconBug, IconX } from "@tabler/icons-react";
import { Block, StepBlock, isStepGroupBlock } from "@/features/block/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface DebugPanelProps {
  currentStepOrder: number;
  flattenedSteps: StepBlock[];
  allBlocks: Block[];
}

export function DebugPanel({
  currentStepOrder,
  flattenedSteps,
  allBlocks,
}: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  // 현재, 이전, 다음 스텝 계산
  const currentStep = flattenedSteps[currentStepOrder];
  const prevStep =
    currentStepOrder > 0 ? flattenedSteps[currentStepOrder - 1] : null;
  const nextStep =
    currentStepOrder < flattenedSteps.length - 1
      ? flattenedSteps[currentStepOrder + 1]
      : null;

  // step group title 안전하게 가져오기
  const getStepGroupTitle = (group: Block | undefined): string => {
    if (!group) return "No group";

    // properties 객체에서 title 속성을 안전하게 접근
    // title 속성이 있는지 확인하는 방법
    return isStepGroupBlock(group)
      ? group.properties.title || "Unnamed"
      : "Unnamed";
  };

  // Step 정보 포맷팅 함수
  const formatStepInfo = (step: StepBlock | null, label: string) => {
    if (!step) return null;

    const parentGroup = allBlocks.find((block) => block.id === step.parentId);

    return (
      <div className="mb-3">
        <h3 className="text-sm font-medium text-blue-600">{label}</h3>
        <div className="pl-2 text-xs">
          <div className="grid grid-cols-2 gap-x-2 mt-1">
            <span className="text-muted-foreground">ID:</span>
            <span className="font-mono truncate">{step.id}</span>

            <span className="text-muted-foreground">Order:</span>
            <span className="font-mono">{step.properties.order}</span>

            <span className="text-muted-foreground">Title:</span>
            <span className="truncate">
              {step.properties.title || "No title"}
            </span>

            <span className="text-muted-foreground">Group:</span>
            <span className="truncate">
              {parentGroup
                ? `${getStepGroupTitle(parentGroup)} (${parentGroup.id.substring(0, 8)}...)`
                : "No group"}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <Button
        size="sm"
        variant="outline"
        className="fixed bottom-4 right-4 z-50 rounded-full shadow-md h-10 w-10 p-0 bg-background"
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? "Hide Debug Panel" : "Show Debug Panel"}
      >
        {isOpen ? (
          <IconX size={18} />
        ) : (
          <IconBug size={18} className="text-orange-500" />
        )}
      </Button>

      {/* Debug Panel */}
      {isOpen && (
        <Card className="fixed bottom-16 right-4 z-50 w-80 shadow-lg border-orange-200 max-h-[80vh] flex flex-col">
          <CardHeader className="py-2 px-4">
            <CardTitle className="text-sm flex items-center">
              <IconBug size={16} className="mr-2 text-orange-500" />
              Step Debug Panel
            </CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1 overflow-auto">
            <CardContent className="p-4 text-xs">
              {/* Current Position Info */}
              <div className="mb-3">
                <h3 className="text-sm font-medium">Navigation Info</h3>
                <div className="pl-2 mt-1">
                  <div className="grid grid-cols-2 gap-x-2">
                    <span className="text-muted-foreground">
                      Current Index:
                    </span>
                    <span>{currentStepOrder}</span>

                    <span className="text-muted-foreground">Total Steps:</span>
                    <span>{flattenedSteps.length}</span>

                    <span className="text-muted-foreground">Has Previous:</span>
                    <span>{currentStepOrder > 0 ? "Yes" : "No"}</span>

                    <span className="text-muted-foreground">Has Next:</span>
                    <span>
                      {currentStepOrder < flattenedSteps.length - 1
                        ? "Yes"
                        : "No"}
                    </span>
                  </div>
                </div>
              </div>

              <Separator className="my-3" />

              {/* Step Details */}
              {formatStepInfo(currentStep, "Current Step")}
              {formatStepInfo(prevStep, "Previous Step")}
              {formatStepInfo(nextStep, "Next Step")}

              <Separator className="my-3" />

              {/* Flattened Steps Structure */}
              <div>
                <h3 className="text-sm font-medium mb-2">
                  All Steps (sorted by order)
                </h3>
                <div className="border rounded overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-1 text-left">Order</th>
                        <th className="p-1 text-left">Title</th>
                        <th className="p-1 text-left">Group</th>
                      </tr>
                    </thead>
                    <tbody>
                      {flattenedSteps.map((step, idx) => {
                        const parentGroup = allBlocks.find(
                          (block) => block.id === step.parentId,
                        );

                        return (
                          <tr
                            key={step.id}
                            className={
                              idx === currentStepOrder
                                ? "bg-blue-50 font-medium"
                                : idx % 2 === 0
                                  ? "bg-white"
                                  : "bg-gray-50"
                            }
                          >
                            <td className="p-1 font-mono">
                              {step.properties.order}
                            </td>
                            <td className="p-1 truncate max-w-[100px]">
                              {step.properties.title || "Untitled"}
                            </td>
                            <td className="p-1 truncate max-w-[80px]">
                              {getStepGroupTitle(parentGroup)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </ScrollArea>
        </Card>
      )}
    </>
  );
}
