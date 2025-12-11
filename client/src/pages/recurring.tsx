import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Repeat, Calendar, Plus, Edit2, Trash2, Clock,
  CalendarDays, CalendarClock, MoreVertical, CheckCircle2, Tag, FileText
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format, addDays, addWeeks, addMonths, getDay, nextDay, setDate, isAfter, startOfDay } from "date-fns";
import { useState } from "react";
import type { Task } from "@shared/schema";

const patternLabels: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

const patternIcons: Record<string, typeof Calendar> = {
  daily: Clock,
  weekly: CalendarDays,
  monthly: CalendarClock,
};

const categoryFilters = [
  { value: "all", label: "All" },
  { value: "personal", label: "Personal", color: "bg-blue-500" },
  { value: "work", label: "Work", color: "bg-purple-500" },
  { value: "money", label: "Money", color: "bg-emerald-500" },
  { value: "other", label: "Other", color: "bg-gray-500" },
];

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getNextDueText(task: Task): string | null {
  const pattern = task.recurringPattern || "daily";
  const today = startOfDay(new Date());
  
  // If task has a due date, use it as the base for calculating next occurrence
  const baseDate = task.dueDate ? startOfDay(new Date(task.dueDate)) : today;
  
  if (pattern === "daily") {
    // Next day
    return `Next Due: Tomorrow`;
  }
  
  if (pattern === "weekly") {
    // If there's a due date, use that day of the week
    const targetDayOfWeek = task.dueDate ? getDay(baseDate) : 1; // Default to Monday (1)
    const todayDayOfWeek = getDay(today);
    
    let nextDate: Date;
    if (task.completed || todayDayOfWeek > targetDayOfWeek || (todayDayOfWeek === targetDayOfWeek && task.completed)) {
      // Task completed or day passed, next occurrence is next week's day
      nextDate = nextDay(today, targetDayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6);
    } else if (todayDayOfWeek === targetDayOfWeek) {
      nextDate = today;
    } else {
      nextDate = nextDay(today, targetDayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6);
    }
    
    return `Next Due: ${format(nextDate, "MMM d")}`;
  }
  
  if (pattern === "monthly") {
    // If there's a due date, use that day of the month
    const targetDayOfMonth = task.dueDate ? new Date(task.dueDate).getDate() : 1; // Default to 1st
    
    let nextDate = setDate(today, targetDayOfMonth);
    
    // If the target day has passed this month, or task is completed, go to next month
    if (isAfter(today, nextDate) || task.completed) {
      nextDate = setDate(addMonths(today, 1), targetDayOfMonth);
    }
    
    return `Next Due: ${format(nextDate, "MMM d")}`;
  }
  
  return null;
}

function RecurringTaskCard({ task, onEdit, onDelete }: { 
  task: Task; 
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}) {
  const pattern = task.recurringPattern || "daily";
  const PatternIcon = patternIcons[pattern] || Calendar;
  const isCompleted = task.completed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      layout
    >
      <Card className={`border-card-border hover-elevate ${isCompleted ? "opacity-70" : ""}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                isCompleted ? "bg-emerald-500/10" : "bg-primary/10"
              }`}>
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Repeat className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 
                  className={`font-medium truncate ${isCompleted ? "text-muted-foreground" : "text-foreground"}`}
                  data-testid={`text-recurring-title-${task.id}`}
                >
                  {task.title}
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    <PatternIcon className="w-3 h-3 mr-1" />
                    {patternLabels[pattern]}
                  </Badge>
                  {isCompleted ? (
                    <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
                      Done for now
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                      Awaiting completion
                    </Badge>
                  )}
                  {task.category && task.category !== "other" && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {task.category}
                    </Badge>
                  )}
                </div>
                {(() => {
                  const nextDueText = getNextDueText(task);
                  return nextDueText ? (
                    <p className="text-xs text-muted-foreground mt-2" data-testid={`text-next-due-${task.id}`}>
                      {nextDueText}
                    </p>
                  ) : null;
                })()}
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  size="icon" 
                  variant="ghost"
                  data-testid={`button-recurring-menu-${task.id}`}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => onEdit(task)}
                  data-testid={`button-edit-recurring-${task.id}`}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Pattern
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(task.id)}
                  className="text-destructive"
                  data-testid={`button-delete-recurring-${task.id}`}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Stop Recurring
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CreateRecurringDialog({ open, onOpenChange }: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [pattern, setPattern] = useState<string>("daily");
  const [category, setCategory] = useState<string>("other");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; recurringPattern: string; category: string; dueDate: Date | null; notes: string | null }) => {
      return apiRequest("POST", "/api/tasks", {
        title: data.title,
        isRecurring: true,
        recurringPattern: data.recurringPattern,
        category: data.category,
        dueDate: data.dueDate,
        notes: data.notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Recurring task created!" });
      setTitle("");
      setPattern("daily");
      setCategory("other");
      setDueDate(undefined);
      setNotes("");
      setShowNotes(false);
      onOpenChange(false);
    },
    onError: () => {
      toast({ 
        title: "Failed to create task", 
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createMutation.mutate({ 
      title, 
      recurringPattern: pattern, 
      category,
      dueDate: dueDate || null,
      notes: notes.trim() || null,
    });
  };

  const categories = [
    { value: "personal", label: "Personal", color: "bg-blue-500" },
    { value: "work", label: "Work", color: "bg-purple-500" },
    { value: "money", label: "Money", color: "bg-emerald-500" },
    { value: "other", label: "Other", color: "bg-gray-500" },
  ];

  const repeatPatterns = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Recurring Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Name</Label>
            <Input
              id="title"
              placeholder="e.g., Take vitamins"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="input-recurring-title"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs font-normal"
                  data-testid="button-recurring-due-date"
                >
                  <Calendar className="h-3 w-3 shrink-0" />
                  <span className="truncate">{dueDate ? format(dueDate, "MMM d") : "Due Date"}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dueDate}
                  onSelect={(date) => {
                    setDueDate(date);
                    setCalendarOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-7 w-auto min-w-0 gap-1 px-2 text-xs" data-testid="select-recurring-category">
                <Tag className="h-3 w-3 shrink-0" />
                <span>Category</span>
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${cat.color}`} />
                      {cat.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={pattern} onValueChange={setPattern}>
              <SelectTrigger className="h-7 w-auto min-w-0 gap-1 px-2 text-xs" data-testid="select-recurring-pattern">
                <Repeat className="h-3 w-3 shrink-0" />
                <span>Repeat</span>
              </SelectTrigger>
              <SelectContent>
                {repeatPatterns.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant={showNotes || notes ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowNotes(!showNotes)}
              className="h-7 gap-1 px-2 text-xs font-normal"
              data-testid="button-recurring-notes"
            >
              <FileText className="h-3 w-3 shrink-0" />
              <span>Task Notes</span>
            </Button>
          </div>

          {showNotes && (
            <Textarea
              placeholder="Add notes for this recurring task..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[60px] text-sm resize-none"
              data-testid="input-recurring-notes"
            />
          )}

          <div className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
            Selected: <span className="font-medium capitalize">{category}</span> task, repeating <span className="font-medium">{pattern}</span>
            {dueDate && <>, starting <span className="font-medium">{format(dueDate, "MMM d")}</span></>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!title.trim() || createMutation.isPending}
              data-testid="button-create-recurring"
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditPatternDialog({ 
  task, 
  open, 
  onOpenChange 
}: { 
  task: Task | null; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [pattern, setPattern] = useState<string>(task?.recurringPattern || "daily");

  const updateMutation = useMutation({
    mutationFn: async (data: { taskId: string; recurringPattern: string }) => {
      return apiRequest("PATCH", `/api/tasks/${data.taskId}`, {
        recurringPattern: data.recurringPattern,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Pattern updated!" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ 
        title: "Failed to update", 
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    updateMutation.mutate({ taskId: task.id, recurringPattern: pattern });
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Recurring Pattern</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Task: {task.title}</p>
          </div>

          <div className="space-y-2">
            <Label>Repeat Pattern</Label>
            <Select value={pattern} onValueChange={setPattern}>
              <SelectTrigger data-testid="select-edit-pattern">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily (every day)</SelectItem>
                <SelectItem value="weekly">Weekly (every Monday)</SelectItem>
                <SelectItem value="monthly">Monthly (1st of month)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
              data-testid="button-save-pattern"
            >
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Recurring() {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Group recurring tasks by title + pattern to show each only once
  // For each group, show the active (non-completed) one, or the most recent completed one
  // Then sort by due date ascending (earliest first)
  const recurringTasks = (() => {
    const allRecurring = tasks.filter(t => t.isRecurring);
    const grouped = new Map<string, Task[]>();
    
    // Group by title + pattern
    allRecurring.forEach(task => {
      const key = `${task.title.toLowerCase().trim()}_${task.recurringPattern || 'daily'}`;
      const existing = grouped.get(key) || [];
      existing.push(task);
      grouped.set(key, existing);
    });
    
    // For each group, pick the best representative task
    const uniqueTasks: Task[] = [];
    grouped.forEach(taskGroup => {
      // Prefer non-completed task (the active one)
      const activeTask = taskGroup.find(t => !t.completed);
      if (activeTask) {
        uniqueTasks.push(activeTask);
      } else {
        // All completed - pick the most recently completed one
        const sorted = taskGroup.sort((a, b) => {
          const aDate = a.completedAt ? new Date(a.completedAt).getTime() : 0;
          const bDate = b.completedAt ? new Date(b.completedAt).getTime() : 0;
          return bDate - aDate;
        });
        if (sorted[0]) uniqueTasks.push(sorted[0]);
      }
    });
    
    // Sort by due date ascending (earliest first)
    // Tasks without due dates go to the end
    const sorted = uniqueTasks.sort((a, b) => {
      const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return aDate - bDate;
    });
    
    // Apply category filter
    if (categoryFilter === "all") {
      return sorted;
    }
    return sorted.filter(t => (t.category || "other") === categoryFilter);
  })();

  const stopRecurringMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return apiRequest("PATCH", `/api/tasks/${taskId}`, { isRecurring: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task will no longer repeat" });
    },
    onError: () => {
      toast({ 
        title: "Failed to update", 
        variant: "destructive" 
      });
    },
  });

  const handleEdit = (task: Task) => {
    setEditTask(task);
    setEditOpen(true);
  };

  const handleDelete = (taskId: string) => {
    stopRecurringMutation.mutate(taskId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
          <header className="text-center">
            <Skeleton className="h-8 w-40 mx-auto" />
            <Skeleton className="h-4 w-56 mx-auto mt-2" />
          </header>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <header className="text-center">
          <h1 className="text-2xl font-semibold text-foreground" data-testid="text-page-title">
            Recurring Tasks
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your repeating tasks
          </p>
        </header>

        <div className="flex justify-center">
          <Button 
            onClick={() => setCreateOpen(true)}
            className="gap-2"
            data-testid="button-add-recurring"
          >
            <Plus className="w-4 h-4" />
            Add Recurring Task
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {categoryFilters.map((filter) => (
            <Button
              key={filter.value}
              variant={categoryFilter === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter(filter.value)}
              className="gap-1.5"
              data-testid={`filter-${filter.value}`}
            >
              {filter.color && (
                <span className={`w-2 h-2 rounded-full ${filter.color}`} />
              )}
              {filter.label}
            </Button>
          ))}
        </div>

        {recurringTasks.length === 0 ? (
          <Card className="border-card-border">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Repeat className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground mb-1">
                {categoryFilter === "all" ? "No recurring tasks" : `No ${categoryFilter} recurring tasks`}
              </h3>
              <p className="text-sm text-muted-foreground">
                {categoryFilter === "all" 
                  ? "Create a recurring task to get started with automatic repeats"
                  : "Try selecting a different category filter"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground">
                Active Recurring Tasks
              </h2>
              <Badge variant="secondary" data-testid="text-recurring-count">
                {recurringTasks.length}
              </Badge>
            </div>
            
            <AnimatePresence mode="popLayout">
              {recurringTasks.map((task) => (
                <RecurringTaskCard 
                  key={task.id} 
                  task={task} 
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        <Card className="border-card-border bg-muted/30">
          <CardContent className="py-4">
            <h3 className="font-medium text-foreground mb-2">How it works</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                <span><strong>Daily:</strong> Repeats the next day</span>
              </li>
              <li className="flex items-start gap-2">
                <CalendarDays className="w-4 h-4 mt-0.5 shrink-0" />
                <span><strong>Weekly:</strong> Repeats every Monday</span>
              </li>
              <li className="flex items-start gap-2">
                <CalendarClock className="w-4 h-4 mt-0.5 shrink-0" />
                <span><strong>Monthly:</strong> Repeats on the 1st</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <CreateRecurringDialog 
          open={createOpen} 
          onOpenChange={setCreateOpen} 
        />

        <EditPatternDialog 
          task={editTask} 
          open={editOpen} 
          onOpenChange={setEditOpen} 
        />
      </div>
    </div>
  );
}
