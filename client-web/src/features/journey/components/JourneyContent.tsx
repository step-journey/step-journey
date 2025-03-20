import { Block, isJourneyBlock } from "@/features/block/types";
import { useCurrentStepBlock } from "@/features/block/store/contentStore";
import {
  BlockRenderer,
  RenderingArea,
} from "@/features/block/renderers/BlockRenderer";

interface Props {
  journeyBlock: Block;
}

export function JourneyContent({ journeyBlock }: Props) {
  const currentStepBlock = useCurrentStepBlock();

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-6">
      {!isJourneyBlock(journeyBlock) ? (
        <div>Invalid journey block</div>
      ) : (
        <div className="h-full">
          {currentStepBlock && (
            <BlockRenderer
              block={currentStepBlock}
              area={RenderingArea.CONTENT}
              journeyId={journeyBlock.id}
            />
          )}
        </div>
      )}
    </div>
  );
}
