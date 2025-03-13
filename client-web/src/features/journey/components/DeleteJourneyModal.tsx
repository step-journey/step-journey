import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useJourneyActions } from "../hooks/useJourneyActions";
import { Block } from "@/features/block/types";

interface DeleteJourneyModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  journeyId: string | null;
  journeyBlocks: Block[] | undefined;
}

export function DeleteJourneyModal({
  isOpen,
  onOpenChange,
  journeyId,
  journeyBlocks,
}: DeleteJourneyModalProps) {
  const { deleteJourney, isDeleting } = useJourneyActions();

  const handleDeleteJourney = async () => {
    if (!journeyId || !journeyBlocks) return;

    const success = await deleteJourney(journeyId, journeyBlocks);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>여정 삭제</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p>
            정말 이 여정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 모든
            그룹과 스텝 데이터가 함께 삭제됩니다.
          </p>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">취소</Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleDeleteJourney}
            disabled={isDeleting}
          >
            {isDeleting ? "삭제 중..." : "삭제"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
