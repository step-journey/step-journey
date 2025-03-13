import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useJourneyActions } from "../hooks/useJourneyActions";

interface CreateJourneyModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateJourneyModal({
  isOpen,
  onOpenChange,
}: CreateJourneyModalProps) {
  const navigate = useNavigate();
  const { createJourney, isCreating } = useJourneyActions();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleCreateJourney = async () => {
    const journeyId = await createJourney(title, description);

    if (journeyId) {
      // 폼 초기화
      setTitle("");
      setDescription("");

      // 다이얼로그 닫기
      onOpenChange(false);

      // 생성한 여정으로 이동
      navigate(`/journey/${journeyId}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>새 Journey 만들기</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-3">
          <div>
            <label
              htmlFor="journey-title"
              className="text-sm font-medium block mb-1"
            >
              제목
            </label>
            <Input
              id="journey-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="여정 제목"
            />
          </div>

          <div>
            <label
              htmlFor="journey-desc"
              className="text-sm font-medium block mb-1"
            >
              설명
            </label>
            <Textarea
              id="journey-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="여정에 대한 설명을 입력하세요"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">취소</Button>
          </DialogClose>
          <Button onClick={handleCreateJourney} disabled={isCreating}>
            {isCreating ? "생성 중..." : "생성"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
