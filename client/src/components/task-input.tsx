import { useState } from "react";
import { Plus, Calendar, Tag, Repeat, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import type { InsertTask } from "@shared/schema";

interface TaskInputProps {
  onAddTask: (task: Omit<InsertTask, "id" | "createdAt" | "completedAt">) => void;
  isLoading?: boolean;
}

const categories = [
  { value: "personal", label: "Personal", color: "bg-blue-500" },
  { value: "work", label: "Work", color: "bg-purple-500" },
  { value: "health", label: "Health", color: "bg-emerald-500" },
  { value: "other", label: "Other", color: "bg-gray-500" },
];

const repeatPatterns = [
  { value: "none", label: "No repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export function TaskInput({ onAddTask, isLoading }: TaskInputProps) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [category, setCategory] = useState("personal");
  const [repeatPattern, setRepeatPattern] = useState("none");
  const [isExpanded, setIsExpanded] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const isRecurring = repeatPattern !== "none";
    
    onAddTask({
      title: title.trim(),
      completed: false,
      category,
      notes: notes.trim() || null,
      dueDate: dueDate || null,
      priority: "medium",
      isRecurring,
      recurringPattern: isRecurring ? repeatPattern : null,
    });

    setTitle("");
    setNotes("");
    setDueDate(undefined);
    setCategory("personal");
    setRepeatPattern("none");
    setIsExpanded(false);
    setShowNotes(false);
  };

  const selectedCategory = categories.find(c => c.value === category);

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <div className="flex items-center gap-2 p-3 bg-card border border-card-border rounded-lg shadow-sm transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50">
          <Input
            type="text"
            placeholder="What needs chomping today?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            className="flex-1 border-0 bg-transparent p-0 text-base placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
            data-testid="input-task-title"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!title.trim() || isLoading}
            className="shrink-0 rounded-md"
            data-testid="button-add-task"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {isExpanded && (
          <div className="flex items-center gap-2 mt-2 px-1">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs font-normal"
                  data-testid="button-due-date"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  {dueDate ? format(dueDate, "MMM d") : "Due date"}
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
              <SelectTrigger className="h-8 w-auto gap-1.5 text-xs" data-testid="select-category">
                <Tag className="h-3.5 w-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value} data-testid={`option-category-${cat.value}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${cat.color}`} />
                      {cat.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={repeatPattern} onValueChange={setRepeatPattern}>
              <SelectTrigger className="h-8 w-auto gap-1.5 text-xs" data-testid="select-repeat">
                <Repeat className="h-3.5 w-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {repeatPatterns.map((pattern) => (
                  <SelectItem key={pattern.value} value={pattern.value} data-testid={`option-repeat-${pattern.value}`}>
                    {pattern.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant={showNotes || notes ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowNotes(!showNotes)}
              className="h-8 gap-1.5 text-xs font-normal"
              data-testid="button-toggle-notes"
            >
              <FileText className="h-3.5 w-3.5" />
              Notes
            </Button>

            {(dueDate || repeatPattern !== "none" || notes) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDueDate(undefined);
                  setRepeatPattern("none");
                  setNotes("");
                  setShowNotes(false);
                }}
                className="h-8 px-2 text-xs text-muted-foreground"
              >
                Clear
              </Button>
            )}
          </div>
        )}

        {isExpanded && showNotes && (
          <div className="mt-2 px-1">
            <Textarea
              placeholder="Add notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[60px] text-sm resize-none"
              data-testid="input-task-notes"
            />
          </div>
        )}
      </div>
    </form>
  );
}
