import { Button } from "@/components/ui/button";

interface Props {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenMap: () => void;
  onNavigateAbout: () => void;
}

export function JourneyHeader({
  // isDarkMode,
  // onToggleDarkMode,
  onOpenMap,
  // onNavigateAbout,
}: Props) {
  return (
    <div
      className="
      h-[56px]
      w-full
      px-8
      border-b border-gray-200
      flex
      items-center
      justify-end
      gap-6
      text-sm
      text-blue-600
    "
    >
      <Button variant="ghost" size="default" onClick={onOpenMap}>
        지도 (m)
      </Button>
      {/*<Button variant="ghost" size="default" onClick={onToggleDarkMode}>*/}
      {/*  {isDarkMode ? "Light Mode" : "Dark Mode"}*/}
      {/*</Button>*/}
      {/*<Button variant="ghost" size="default" onClick={onNavigateAbout}>*/}
      {/*  About*/}
      {/*</Button>*/}
    </div>
  );
}
