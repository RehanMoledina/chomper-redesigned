import { useState, useEffect } from "react";
import { Calendar, Tag, Repeat, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import type { Task } from "@shared/schema";

interface EditTaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (taskId: string, updates: Partial<Task>) => void;
  isSaving?: boolean;
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

export function EditTaskDialog({ task, open, onOpenChange, onSave, isSaving }: EditTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [category, setCategory] = useState("personal");
  const [repeatPattern, setRepeatPattern] = useState("none");
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNotes(task.notes || "");
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
      setCategory(task.category || "personal");
      setRepeatPattern(task.isRecurring && task.recurringPattern ? task.recurringPattern : "none");
    }
  }, [task]);

  const handleSave = () => {
    if (!task || !title.trim()) return;

    const isRecurring = repeatPattern !== "none";
    
    onSave(task.id, {
      title: title.trim(),
      notes: notes.trim() || null,
      category,
      dueDate: dueDate || null,
      isRecurring,
      recurringPattern: isRecurring ? repeatPattern : null,
    });
  };

  const handleClearDate = () => {
    setDueDate(undefined);
    setRepeatPattern("none");
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-edit-task">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Task Title</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full"
              data-testid="input-edit-title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional details..."
              className="min-h-[80px] resize-none"
              data-testid="input-edit-notes"
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full" data-testid="select-edit-category">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value} data-testid={`option-edit-category-${cat.value}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${cat.color}`} />
                      {cat.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Due Date</Label>
            <div className="flex items-center gap-2">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 justify-start gap-2 font-normal"
                    data-testid="button-edit-due-date"
                  >
                    <Calendar className="h-4 w-4" />
                    {dueDate ? format(dueDate, "MMMM d, yyyy") : "No due date"}
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
              {dueDate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleClearDate}
                  className="shrink-0"
                  data-testid="button-clear-due-date"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Repeat</Label>
            <Select value={repeatPattern} onValueChange={setRepeatPattern}>
              <SelectTrigger className="w-full" data-testid="select-edit-repeat">
                <div className="flex items-center gap-2">
                  <Repeat className="h-4 w-4" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {repeatPatterns.map((pattern) => (
                  <SelectItem key={pattern.value} value={pattern.value} data-testid={`option-edit-repeat-${pattern.value}`}>
                    {pattern.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-edit"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!title.trim() || isSaving}
            data-testid="button-save-edit"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
