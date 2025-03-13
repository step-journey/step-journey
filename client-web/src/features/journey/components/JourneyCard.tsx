import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconTrash } from "@tabler/icons-react";
import {
  getJourneyTitle,
  getJourneyDescription,
  JourneyBlock,
} from "@/features/block/types";
import React from "react";

interface JourneyCardProps {
  journey: JourneyBlock;
  onClick: (journeyId: string) => void;
  onDelete?: (journeyId: string) => void;
  showDeleteButton?: boolean;
}

export function JourneyCard({
  journey,
  onClick,
  onDelete,
  showDeleteButton = false,
}: JourneyCardProps) {
  const handleClick = () => {
    onClick(journey.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(journey.id);
    }
  };

  // 날짜와 시간 포맷팅 - 24시간 형식 사용
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false, // 24시간 형식 사용
    }).format(date);
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      <CardHeader className="pb-2">
        <CardTitle>{getJourneyTitle(journey)}</CardTitle>
      </CardHeader>

      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground">
          {getJourneyDescription(journey) || "No description"}
        </p>
      </CardContent>

      <CardFooter className="pt-2 pb-2 flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          {formatDateTime(journey.createdAt)}
        </span>

        {showDeleteButton && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground hover:bg-accent"
            onClick={handleDelete}
          >
            <IconTrash size={16} />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
