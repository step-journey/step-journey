import { useState } from "react";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import { useJourneys } from "../hooks/useJourneys";
import { useJourneyActions } from "../hooks/useJourneyActions";
import { JourneyCard } from "./JourneyCard";
import { DeleteJourneyModal } from "./DeleteJourneyModal";
import { isJourneyBlock, JourneyBlock } from "@/features/block/types";

interface JourneyListProps {
  onCreateClick: () => void;
}

export function JourneyList({ onCreateClick }: JourneyListProps) {
  const { data: journeyBlocks, isLoading } = useJourneys();
  const { navigateToJourney } = useJourneyActions();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleJourneyClick = (journeyId: string) => {
    navigateToJourney(journeyId);
  };

  const handleDeleteClick = (journeyId: string) => {
    setDeleteTargetId(journeyId);
    setIsDeleteDialogOpen(true);
  };

  // 여정이 로딩 중인 경우
  if (isLoading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  // 여정이 없는 경우
  if (!journeyBlocks || journeyBlocks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">아직 Journey가 없습니다.</p>
        <Button onClick={onCreateClick}>
          <IconPlus className="mr-1" />첫 번째 Journey 만들기
        </Button>
      </div>
    );
  }

  // 여정 목록 정렬 및 필터링
  const sortedJourneys = journeyBlocks
    .filter(isJourneyBlock)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ) as JourneyBlock[];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedJourneys.map((journey) => (
          <JourneyCard
            key={journey.id}
            journey={journey}
            onClick={handleJourneyClick}
            onDelete={handleDeleteClick}
            showDeleteButton={true}
          />
        ))}
      </div>

      <DeleteJourneyModal
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        journeyId={deleteTargetId}
        journeyBlocks={journeyBlocks}
      />
    </>
  );
}
