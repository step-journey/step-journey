import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteStepModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  stepTitle: string;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteStepModal({
  isOpen,
  onOpenChange,
  stepTitle,
  onConfirm,
  isDeleting,
}: DeleteStepModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>단계 삭제</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p>
            <span className="font-medium">{stepTitle}</span> 단계를
            삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 모든 내용이 함께
            삭제됩니다.
          </p>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isDeleting}>
              취소
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "삭제 중..." : "삭제"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
