import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TaskCard } from "./task-card";
import { MonsterCompanion } from "./monster-companion";
import { isToday, isBefore, startOfDay, isValid } from "date-fns";
import type { Task } from "@shared/schema";

type ViewMode = "today" | "all";

interface TaskListProps {
  tasks: Task[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (task: Task) => void;
  completingTaskId?: string | null;
  viewMode?: ViewMode;
}

type TaskGroup = {
  title: string;
  tasks: Task[];
};

export function TaskList({ tasks, onComplete, onDelete, onEdit, completingTaskId, viewMode = "today" }: TaskListProps) {
  const groupedTasks = useMemo(() => {
    const today = startOfDay(new Date());
    const groups: TaskGroup[] = [];

    const overdue: Task[] = [];
    const todayTasks: Task[] = [];
    const futureTasks: Task[] = [];
    const noDueDate: Task[] = [];
    const completed: Task[] = [];

    tasks.forEach((task) => {
      if (task.completed) {
        completed.push(task);
        return;
      }

      if (!task.dueDate) {
        noDueDate.push(task);
        return;
      }

      const dueDate = new Date(task.dueDate);
      if (!isValid(dueDate)) {
        noDueDate.push(task);
        return;
      }

      const dueDateStart = startOfDay(dueDate);

      if (isBefore(dueDateStart, today)) {
        overdue.push(task);
      } else if (isToday(dueDate)) {
        todayTasks.push(task);
      } else {
        futureTasks.push(task);
      }
    });

    if (viewMode === "today") {
      const pendingTasks = [...overdue, ...todayTasks, ...noDueDate];
      if (pendingTasks.length > 0) {
        groups.push({ title: "Tasks", tasks: pendingTasks });
      }
    } else {
      if (overdue.length > 0) {
        groups.push({ title: "Overdue", tasks: overdue });
      }
      const allPending = [...todayTasks, ...futureTasks, ...noDueDate];
      if (allPending.length > 0) {
        groups.push({ title: "Tasks", tasks: allPending });
      }
    }

    if (completed.length > 0) {
      groups.push({ title: "Completed", tasks: completed });
    }

    return groups;
  }, [tasks, viewMode]);

  const pendingCount = tasks.filter(t => !t.completed).length;
  const completedCount = tasks.filter(t => t.completed).length;

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <MonsterCompanion state="hungry" size="large" showMessage={true} message="I'm hungry! Add some tasks for me to chomp!" />
        <p className="mt-6 text-muted-foreground text-center max-w-xs">
          Add your first task above and watch me devour your productivity!
        </p>
      </div>
    );
  }

  if (pendingCount === 0 && completedCount > 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <MonsterCompanion 
            state="happy" 
            size="large" 
            tasksCompleted={completedCount}
            showMessage={true} 
            message="All tasks chomped! You're amazing!" 
          />
        </div>
        
        {groupedTasks.map((group) => (
          <div key={group.title} className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1" data-testid={`section-${group.title.toLowerCase()}`}>
              {group.title} ({group.tasks.length})
            </h3>
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {group.tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={onComplete}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    isCompleting={completingTaskId === task.id}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedTasks.map((group) => (
        <div key={group.title} className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1" data-testid={`section-${group.title.toLowerCase()}`}>
            {group.title} ({group.tasks.length})
          </h3>
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {group.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={onComplete}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  isCompleting={completingTaskId === task.id}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      ))}
    </div>
  );
}
