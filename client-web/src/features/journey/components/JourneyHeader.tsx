import { ReactNode } from "react";

interface Props {
  renderAdditionalButtons?: () => ReactNode;
}

export function JourneyHeader({ renderAdditionalButtons }: Props) {
  return (
    <header className="h-14 bg-white dark:bg-zinc-900 px-4 flex items-center justify-between">
      <div className="flex items-center gap-1"></div>

      <div className="flex items-center gap-2">
        {renderAdditionalButtons && renderAdditionalButtons()}
      </div>
    </header>
  );
}
