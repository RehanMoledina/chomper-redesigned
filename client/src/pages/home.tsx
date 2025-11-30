import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { TaskInput } from "@/components/task-input";
import { TaskList } from "@/components/task-list";
import { CelebrationOverlay } from "@/components/celebration-overlay";
import { MonsterCompanion } from "@/components/monster-companion";
import { CategoryFilter } from "@/components/category-filter";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useMonster } from "@/hooks/use-monster";
import type { Task, InsertTask } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const { selectedMonster } = useMonster();
  const [showCelebration, setShowCelebration] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [celebrationMessage, setCelebrationMessage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: tasks = [], isLoading, error } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const addTaskMutation = useMutation({
    mutationFn: async (task: Omit<InsertTask, "id" | "createdAt" | "completedAt">) => {
      const res = await apiRequest("POST", "/api/tasks", task);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/tasks/${id}`, { completed: true });
      return res.json();
    },
    onMutate: (id) => {
      setCompletingTaskId(id);
    },
    onSuccess: async () => {
      const messages = [
        "NOM NOM NOM!",
        "Delicious task!",
        "CHOMPED!",
        "Yummy productivity!",
        "That was tasty!",
      ];
      setCelebrationMessage(messages[Math.floor(Math.random() * messages.length)]);
      setShowCelebration(true);
      
      try {
        const res = await apiRequest("POST", "/api/achievements/check");
        if (res.ok) {
          const { newlyUnlocked } = await res.json();
          if (newlyUnlocked && newlyUnlocked.length > 0) {
            queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
            newlyUnlocked.forEach((achievement: { name: string }) => {
              toast({
                title: "Achievement Unlocked!",
                description: achievement.name,
              });
            });
          }
        }
      } catch {
      }
    },
    onSettled: () => {
      setCompletingTaskId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddTask = useCallback(
    (task: Omit<InsertTask, "id" | "createdAt" | "completedAt">) => {
      addTaskMutation.mutate(task);
    },
    [addTaskMutation]
  );

  const handleCompleteTask = useCallback(
    (id: string) => {
      completeTaskMutation.mutate(id);
    },
    [completeTaskMutation]
  );

  const handleDeleteTask = useCallback(
    (id: string) => {
      deleteTaskMutation.mutate(id);
    },
    [deleteTaskMutation]
  );

  const handleCelebrationComplete = useCallback(() => {
    setShowCelebration(false);
    setCelebrationMessage("");
  }, []);

  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedToday = tasks.filter((t) => {
    if (!t.completed || !t.completedAt) return false;
    const completedDate = new Date(t.completedAt);
    const today = new Date();
    return completedDate.toDateString() === today.toDateString();
  }).length;

  const taskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.filter(t => !t.completed).forEach((task) => {
      const cat = task.category || "other";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (selectedCategory === "all") return tasks;
    return tasks.filter((task) => (task.category || "other") === selectedCategory);
  }, [tasks, selectedCategory]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-16 w-16 rounded-full" />
          </div>
          <Skeleton className="h-14 w-full rounded-lg" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <div className="text-center px-4">
          <MonsterCompanion state="hungry" size="large" message="Something went wrong..." />
          <p className="mt-4 text-muted-foreground">
            We couldn't load your tasks. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <CelebrationOverlay
        isVisible={showCelebration}
        onComplete={handleCelebrationComplete}
        message={celebrationMessage}
      />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground" data-testid="text-page-title">
              Tasks
            </h1>
            <p className="text-sm text-muted-foreground">
              {pendingTasks.length === 0
                ? "All done for today!"
                : `${pendingTasks.length} task${pendingTasks.length > 1 ? "s" : ""} to chomp`}
            </p>
          </div>
          <MonsterCompanion
            state={pendingTasks.length === 0 ? "happy" : "idle"}
            size="small"
            tasksCompleted={completedToday}
            showMessage={false}
            monsterType={selectedMonster}
          />
        </header>

        <TaskInput
          onAddTask={handleAddTask}
          isLoading={addTaskMutation.isPending}
        />

        <CategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          taskCounts={taskCounts}
        />

        <TaskList
          tasks={filteredTasks}
          onComplete={handleCompleteTask}
          onDelete={handleDeleteTask}
          completingTaskId={completingTaskId}
        />
      </div>
    </div>
  );
}
