import { useQuery } from "@tanstack/react-query";
import { StatsView } from "@/components/stats-view";
import { Achievements } from "@/components/achievements";
import { Skeleton } from "@/components/ui/skeleton";
import type { Task, MonsterStats } from "@shared/schema";

export default function Stats() {
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<MonsterStats>({
    queryKey: ["/api/stats"],
  });

  const isLoading = tasksLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
          <header className="text-center">
            <Skeleton className="h-8 w-32 mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto mt-2" />
          </header>
          <div className="flex justify-center py-8">
            <Skeleton className="h-32 w-32 rounded-full" />
          </div>
          <Skeleton className="h-40 w-full rounded-lg" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
          </div>
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <header className="text-center">
          <h1 className="text-2xl font-semibold text-foreground" data-testid="text-page-title">
            Statistics
          </h1>
          <p className="text-sm text-muted-foreground">
            Track your productivity journey
          </p>
        </header>

        <StatsView tasks={tasks} stats={stats || null} />

        <Achievements />
      </div>
    </div>
  );
}
