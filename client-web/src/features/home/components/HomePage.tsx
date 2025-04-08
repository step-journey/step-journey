import { useState } from "react";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import { JourneyList } from "@/features/journey/components/JourneyList";
import { CreateJourneyModal } from "@/features/journey/components/CreateJourneyModal";
import { Header } from "./Header";

export default function HomePage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      {/* 상단 Header */}
      <Header />

      {/* 메인 레이아웃 */}
      <div className="flex flex-1 bg-background text-foreground">
        {/* 좌측 사이드바 */}
        <aside className="hidden md:flex flex-col w-60 border-r border-border p-4">
          <nav className="space-y-4">
            <div className="text-sm font-semibold">Home</div>
            <div className="text-sm font-semibold">Popular</div>
            <div className="text-sm font-semibold">Explore</div>
            <div className="text-sm font-semibold">All</div>

            <hr className="my-2 border-border" />

            <div className="text-xs text-muted-foreground">MODERATION</div>
            <div className="text-sm text-foreground">Mod Queue</div>
            <div className="text-sm text-foreground">Mod Mail</div>
            <div className="text-sm text-foreground">r/Mod</div>

            <hr className="my-2 border-border" />

            <div className="text-xs text-muted-foreground">CUSTOM FEEDS</div>
            <div className="text-sm text-foreground">Create a custom feed</div>

            <hr className="my-2 border-border" />

            <div className="text-xs text-muted-foreground">RECENT</div>
            <div className="text-sm text-foreground">r/logodesign</div>
            <div className="text-sm text-foreground">r/graphic_design</div>
            <div className="text-sm text-foreground">r/golang</div>
            <div className="text-sm text-foreground">r/reppley</div>
          </nav>
        </aside>

        {/* 중앙 본문 */}
        <main className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">All Journeys</h2>

            <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
              <IconPlus className="mr-1 h-4 w-4" />
              New Journey
            </Button>
          </div>

          {/* Journey 리스트 */}
          <JourneyList onCreateClick={() => setIsCreateDialogOpen(true)} />
        </main>

        {/* 우측 사이드바 */}
        <aside className="hidden lg:flex flex-col w-64 border-l border-border p-4"></aside>
      </div>

      {/* 여정 생성 다이얼로그 */}
      <CreateJourneyModal
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
