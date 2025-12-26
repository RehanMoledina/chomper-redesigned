import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { startOfDay, isBefore, isToday, isValid } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { TaskInput } from "@/components/task-input";
import { TaskList } from "@/components/task-list";
import { CelebrationOverlay } from "@/components/celebration-overlay";
import { MonsterCompanion } from "@/components/monster-companion";
import { CategoryFilter } from "@/components/category-filter";
import { EditTaskDialog } from "@/components/edit-task-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMonster } from "@/hooks/use-monster";
import type { Task, InsertTask, InsertRecurringTemplate } from "@shared/schema";

type ViewMode = "today" | "all";

export default function Home() {
  const { toast } = useToast();
  const { selectedMonster } = useMonster();
  const [showCelebration, setShowCelebration] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [celebrationMessage, setCelebrationMessage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("today");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

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

  const addTemplateMutation = useMutation({
    mutationFn: async (template: Omit<InsertRecurringTemplate, "id" | "userId" | "createdAt" | "lastGeneratedAt">) => {
      const res = await apiRequest("POST", "/api/recurring-templates", template);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-templates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Template created!",
        description: "Your recurring task template is now active.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create template. Please try again.",
        variant: "destructive",
      });
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/tasks/${id}`, { completed: true });
      return res.json();
    },
    onMutate: async (id) => {
      setCompletingTaskId(id);
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/tasks"] });
      
      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<Task[]>(["/api/tasks"]);
      
      // Only proceed with optimistic update if we have cached data
      if (previousTasks && previousTasks.length > 0) {
        // Optimistically update the cache
        queryClient.setQueryData<Task[]>(["/api/tasks"], (old) =>
          old?.map((task) =>
            task.id === id ? { ...task, completed: true, completedAt: new Date() } : task
          )
        );
        
        // Check if all tasks for today are now completed (after this optimistic update)
        const today = startOfDay(new Date());
        const remainingTodayTasks = previousTasks.filter((task) => {
          if (task.id === id) return false; // Exclude the task being completed
          if (task.completed) return false; // Already completed
          
          if (!task.dueDate) return true;
          const dueDate = new Date(task.dueDate);
          if (!isValid(dueDate)) return true;
          return isBefore(dueDate, today) || isToday(dueDate);
        });

        // Only celebrate if all today's tasks are now complete
        if (remainingTodayTasks.length === 0) {
          const messages = [
            "ALL DONE! NOM NOM!",
            "Day complete! Delicious!",
            "CHOMPED everything!",
            "Perfect day!",
            "All tasks devoured!",
          ];
          setCelebrationMessage(messages[Math.floor(Math.random() * messages.length)]);
          setShowCelebration(true);
        }
      }
      
      return { previousTasks };
    },
    onSuccess: async () => {
      // Check achievements in background
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
    onError: (_, __, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(["/api/tasks"], context.previousTasks);
      }
      toast({
        title: "Error",
        description: "Failed to complete task. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setCompletingTaskId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
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

  const editTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      const res = await apiRequest("PATCH", `/api/tasks/${id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setEditDialogOpen(false);
      setEditingTask(null);
      toast({
        title: "Updated",
        description: "Task has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const uncompleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/tasks/${id}`, { completed: false, completedAt: null });
      return res.json();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["/api/tasks"] });
      const previousTasks = queryClient.getQueryData<Task[]>(["/api/tasks"]);
      
      if (previousTasks && previousTasks.length > 0) {
        queryClient.setQueryData<Task[]>(["/api/tasks"], (old) =>
          old?.map((task) =>
            task.id === id ? { ...task, completed: false, completedAt: null } : task
          )
        );
      }
      
      return { previousTasks };
    },
    onError: (_err, _id, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["/api/tasks"], context.previousTasks);
      }
      toast({
        title: "Error",
        description: "Failed to restore task. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const clearCompletedMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/tasks/completed");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Cleared",
        description: `${data.deleted} completed task${data.deleted !== 1 ? 's' : ''} removed.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear completed tasks. Please try again.",
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

  const handleAddTemplate = useCallback(
    (template: Omit<InsertRecurringTemplate, "id" | "userId" | "createdAt" | "lastGeneratedAt">) => {
      addTemplateMutation.mutate(template);
    },
    [addTemplateMutation]
  );

  const handleCompleteTask = useCallback(
    (id: string) => {
      completeTaskMutation.mutate(id);
    },
    [completeTaskMutation]
  );

  const handleUncompleteTask = useCallback(
    (id: string) => {
      uncompleteTaskMutation.mutate(id);
    },
    [uncompleteTaskMutation]
  );

  const handleDeleteTask = useCallback(
    (id: string) => {
      deleteTaskMutation.mutate(id);
    },
    [deleteTaskMutation]
  );

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setEditDialogOpen(true);
  }, []);

  const handleSaveEdit = useCallback(
    (taskId: string, updates: Partial<Task>) => {
      editTaskMutation.mutate({ id: taskId, updates });
    },
    [editTaskMutation]
  );

  const handleCelebrationComplete = useCallback(() => {
    setShowCelebration(false);
    setCelebrationMessage("");
  }, []);

  const handleClearCompleted = useCallback(() => {
    clearCompletedMutation.mutate();
  }, [clearCompletedMutation]);

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
          onAddTemplate={handleAddTemplate}
          isLoading={addTaskMutation.isPending || addTemplateMutation.isPending}
        />

        <CategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          taskCounts={taskCounts}
        />

        <div className="flex gap-1 p-1 bg-muted rounded-lg" data-testid="view-mode-toggle">
          <Button
            variant={viewMode === "today" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("today")}
            className="flex-1"
            data-testid="button-view-today"
          >
            Today
          </Button>
          <Button
            variant={viewMode === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("all")}
            className="flex-1"
            data-testid="button-view-all"
          >
            All
          </Button>
        </div>

        <TaskList
          tasks={filteredTasks}
          onComplete={handleCompleteTask}
          onUncomplete={handleUncompleteTask}
          onDelete={handleDeleteTask}
          onEdit={handleEditTask}
          onClearCompleted={handleClearCompleted}
          completingTaskId={completingTaskId}
          viewMode={viewMode}
        />
      </div>

      <EditTaskDialog
        task={editingTask}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveEdit}
        isSaving={editTaskMutation.isPending}
      />
    </div>
  );
}
