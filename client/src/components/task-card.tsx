import { useState, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Calendar, Repeat, Pencil, FileText } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { format, isToday, isTomorrow, isPast, isValid } from "date-fns";
import type { Task } from "@shared/schema";

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onUncomplete?: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (task: Task) => void;
  isCompleting?: boolean;
}

const categoryColors: Record<string, string> = {
  personal: "bg-blue-500",
  work: "bg-purple-500",
  money: "bg-emerald-500",
  other: "bg-gray-500",
};

export const TaskCard = forwardRef<HTMLDivElement, TaskCardProps>(function TaskCard({ task, onComplete, onUncomplete, onDelete, onEdit, isCompleting }, ref) {
  const [showActions, setShowActions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleComplete = () => {
    if (task.completed && onUncomplete) {
      onUncomplete(task.id);
    } else if (!task.completed) {
      onComplete(task.id);
    }
  };

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      onDelete(task.id);
    }, 300);
  };

  const formatDueDate = (date: Date | null) => {
    if (!date) return null;
    
    const dateObj = new Date(date);
    if (!isValid(dateObj)) return null;
    
    if (isToday(dateObj)) return "Today";
    if (isTomorrow(dateObj)) return "Tomorrow";
    return format(dateObj, "MMM d");
  };

  const getDueDateColor = (date: Date | null) => {
    if (!date) return "";
    const dateObj = new Date(date);
    if (!isValid(dateObj)) return "";
    
    if (isPast(dateObj) && !isToday(dateObj)) return "text-destructive bg-destructive/10";
    if (isToday(dateObj)) return "text-amber-600 dark:text-amber-400 bg-amber-500/10";
    return "text-muted-foreground bg-muted";
  };

  const dueDateText = formatDueDate(task.dueDate);
  const categoryColor = categoryColors[task.category || "other"] || categoryColors.other;

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ 
        opacity: isDeleting || isCompleting ? 0 : 1, 
        y: 0,
        x: isDeleting ? -20 : 0,
        scale: isCompleting ? 0.95 : 1,
      }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className={`group relative flex items-start gap-3 p-4 bg-card border border-card-border rounded-lg shadow-sm transition-colors hover-elevate ${
        task.completed ? "opacity-60" : ""
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      data-testid={`task-card-${task.id}`}
    >
        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${categoryColor}`} />

        <div className="pt-0.5">
          <Checkbox
            checked={task.completed}
            onCheckedChange={handleToggleComplete}
            className="h-5 w-5 rounded-md border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            data-testid={`checkbox-task-${task.id}`}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p
            className={`text-base leading-relaxed break-words ${
              task.completed ? "line-through text-muted-foreground" : "text-foreground"
            }`}
            data-testid={`text-task-title-${task.id}`}
          >
            {task.title}
          </p>

          {task.notes && (
            <p
              className="text-sm text-muted-foreground mt-1 line-clamp-2"
              data-testid={`text-task-notes-${task.id}`}
            >
              <FileText className="inline-block h-3 w-3 mr-1 -mt-0.5" />
              {task.notes}
            </p>
          )}

          {(dueDateText || task.isRecurring) && (
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {dueDateText && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${getDueDateColor(task.dueDate)}`}
                  data-testid={`badge-due-date-${task.id}`}
                >
                  <Calendar className="h-3 w-3" />
                  {dueDateText}
                </span>
              )}
              {task.isRecurring && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary"
                  data-testid={`badge-recurring-${task.id}`}
                >
                  <Repeat className="h-3 w-3" />
                  {task.recurringPattern}
                </span>
              )}
            </div>
          )}
        </div>

        <AnimatePresence>
          {(showActions || task.completed) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="shrink-0 flex items-center gap-1"
            >
              {!task.completed && onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(task)}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  data-testid={`button-edit-task-${task.id}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                data-testid={`button-delete-task-${task.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
  );
});
