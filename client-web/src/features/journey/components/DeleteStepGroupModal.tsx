import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteStepGroupModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  groupTitle: string;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteStepGroupModal({
  isOpen,
  onOpenChange,
  groupTitle,
  onConfirm,
  isDeleting,
}: DeleteStepGroupModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>그룹 삭제</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p>
            <span className="font-medium">{groupTitle}</span> 그룹을
            삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 그룹에 포함된 모든
            단계와 내용이 함께 삭제됩니다.
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
