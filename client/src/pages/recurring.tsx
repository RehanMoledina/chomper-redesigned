import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Repeat, Calendar, Plus, Edit2, Trash2, Clock,
  CalendarDays, CalendarClock, MoreVertical, Tag, FileText, Power, PowerOff
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
import { format, nextDay, setDate, addMonths, isAfter, startOfDay, getDay } from "date-fns";
import { useState, useEffect } from "react";
import type { RecurringTemplate } from "@shared/schema";

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

function getNextDueText(template: RecurringTemplate): string {
  const pattern = template.recurringPattern;
  const today = startOfDay(new Date());
  
  if (pattern === "daily") {
    return "Every day";
  }
  
  if (pattern === "weekly") {
    const targetDayOfWeek = template.dayOfWeek ?? 1;
    return `Every ${dayNames[targetDayOfWeek]}`;
  }
  
  if (pattern === "monthly") {
    const targetDayOfMonth = template.dayOfMonth ?? 1;
    const suffix = targetDayOfMonth === 1 ? "st" : targetDayOfMonth === 2 ? "nd" : targetDayOfMonth === 3 ? "rd" : "th";
    return `Every ${targetDayOfMonth}${suffix} of the month`;
  }
  
  return "";
}

function TemplateCard({ template, onEdit, onDelete, onToggleActive }: { 
  template: RecurringTemplate; 
  onEdit: (template: RecurringTemplate) => void;
  onDelete: (templateId: string) => void;
  onToggleActive: (template: RecurringTemplate) => void;
}) {
  const pattern = template.recurringPattern;
  const PatternIcon = patternIcons[pattern] || Calendar;
  const isActive = template.active;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      layout
    >
      <Card className={`border-card-border hover-elevate ${!isActive ? "opacity-60" : ""}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                isActive ? "bg-primary/10" : "bg-muted"
              }`}>
                <Repeat className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 
                  className={`font-medium truncate ${!isActive ? "text-muted-foreground" : "text-foreground"}`}
                  data-testid={`text-template-title-${template.id}`}
                >
                  {template.title}
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    <PatternIcon className="w-3 h-3 mr-1" />
                    {patternLabels[pattern]}
                  </Badge>
                  {isActive ? (
                    <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Paused
                    </Badge>
                  )}
                  {template.category && template.category !== "other" && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {template.category}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2" data-testid={`text-schedule-${template.id}`}>
                  {getNextDueText(template)}
                </p>
                {template.notes && (
                  <p className="text-xs text-muted-foreground mt-1 truncate" data-testid={`text-notes-${template.id}`}>
                    {template.notes}
                  </p>
                )}
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  size="icon" 
                  variant="ghost"
                  data-testid={`button-template-menu-${template.id}`}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => onEdit(template)}
                  data-testid={`button-edit-template-${template.id}`}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Template
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onToggleActive(template)}
                  data-testid={`button-toggle-template-${template.id}`}
                >
                  {isActive ? (
                    <>
                      <PowerOff className="w-4 h-4 mr-2" />
                      Pause Template
                    </>
                  ) : (
                    <>
                      <Power className="w-4 h-4 mr-2" />
                      Resume Template
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(template.id)}
                  className="text-destructive"
                  data-testid={`button-delete-template-${template.id}`}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Template
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CreateTemplateDialog({ open, onOpenChange }: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [pattern, setPattern] = useState<string>("daily");
  const [category, setCategory] = useState<string>("other");
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  const createMutation = useMutation({
    mutationFn: async (data: { 
      title: string; 
      recurringPattern: string; 
      category: string; 
      dayOfWeek: number | null;
      dayOfMonth: number | null;
      notes: string | null;
    }) => {
      return apiRequest("POST", "/api/recurring-templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-templates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Template created! First task generated." });
      setTitle("");
      setPattern("daily");
      setCategory("other");
      setDayOfWeek(1);
      setDayOfMonth(1);
      setNotes("");
      setShowNotes(false);
      onOpenChange(false);
    },
    onError: () => {
      toast({ 
        title: "Failed to create template", 
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
      dayOfWeek: pattern === "weekly" ? dayOfWeek : null,
      dayOfMonth: pattern === "monthly" ? dayOfMonth : null,
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
          <DialogTitle>Create Recurring Template</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Name</Label>
            <Input
              id="title"
              placeholder="e.g., Take vitamins"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="input-template-title"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-7 w-auto min-w-0 gap-1 px-2 text-xs" data-testid="select-template-category">
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
              <SelectTrigger className="h-7 w-auto min-w-0 gap-1 px-2 text-xs" data-testid="select-template-pattern">
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
              data-testid="button-template-notes"
            >
              <FileText className="h-3 w-3 shrink-0" />
              <span>Notes</span>
            </Button>
          </div>

          {pattern === "weekly" && (
            <div className="space-y-2">
              <Label>Day of Week</Label>
              <Select value={dayOfWeek.toString()} onValueChange={(v) => setDayOfWeek(parseInt(v))}>
                <SelectTrigger data-testid="select-day-of-week">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dayNames.map((day, idx) => (
                    <SelectItem key={idx} value={idx.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {pattern === "monthly" && (
            <div className="space-y-2">
              <Label>Day of Month</Label>
              <Select value={dayOfMonth.toString()} onValueChange={(v) => setDayOfMonth(parseInt(v))}>
                <SelectTrigger data-testid="select-day-of-month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showNotes && (
            <Textarea
              placeholder="Add notes for this template..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[60px] text-sm resize-none"
              data-testid="input-template-notes"
            />
          )}

          <div className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
            Selected: <span className="font-medium capitalize">{category}</span> task, repeating <span className="font-medium">{pattern}</span>
            {pattern === "weekly" && <>, on <span className="font-medium">{dayNames[dayOfWeek]}</span></>}
            {pattern === "monthly" && <>, on the <span className="font-medium">{dayOfMonth}</span></>}
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
              data-testid="button-create-template"
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditTemplateDialog({ 
  template, 
  open, 
  onOpenChange 
}: { 
  template: RecurringTemplate | null; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [pattern, setPattern] = useState<string>("daily");
  const [category, setCategory] = useState<string>("other");
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (template) {
      setTitle(template.title);
      setPattern(template.recurringPattern);
      setCategory(template.category || "other");
      setDayOfWeek(template.dayOfWeek ?? 1);
      setDayOfMonth(template.dayOfMonth ?? 1);
      setNotes(template.notes || "");
    }
  }, [template]);

  const updateMutation = useMutation({
    mutationFn: async (data: { 
      templateId: string; 
      title?: string;
      recurringPattern?: string; 
      category?: string;
      dayOfWeek?: number | null;
      dayOfMonth?: number | null;
      notes?: string | null;
    }) => {
      const { templateId, ...updateData } = data;
      return apiRequest("PATCH", `/api/recurring-templates/${templateId}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-templates"] });
      toast({ title: "Template updated!" });
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
    if (!template || !title.trim()) return;
    updateMutation.mutate({ 
      templateId: template.id, 
      title,
      recurringPattern: pattern,
      category,
      dayOfWeek: pattern === "weekly" ? dayOfWeek : null,
      dayOfMonth: pattern === "monthly" ? dayOfMonth : null,
      notes: notes.trim() || null,
    });
  };

  if (!template) return null;

  const categories = [
    { value: "personal", label: "Personal", color: "bg-blue-500" },
    { value: "work", label: "Work", color: "bg-purple-500" },
    { value: "money", label: "Money", color: "bg-emerald-500" },
    { value: "other", label: "Other", color: "bg-gray-500" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Template</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Task Name</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="input-edit-title"
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger data-testid="select-edit-category">
                <SelectValue />
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
          </div>

          <div className="space-y-2">
            <Label>Repeat Pattern</Label>
            <Select value={pattern} onValueChange={setPattern}>
              <SelectTrigger data-testid="select-edit-pattern">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {pattern === "weekly" && (
            <div className="space-y-2">
              <Label>Day of Week</Label>
              <Select value={dayOfWeek.toString()} onValueChange={(v) => setDayOfWeek(parseInt(v))}>
                <SelectTrigger data-testid="select-edit-day-of-week">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dayNames.map((day, idx) => (
                    <SelectItem key={idx} value={idx.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {pattern === "monthly" && (
            <div className="space-y-2">
              <Label>Day of Month</Label>
              <Select value={dayOfMonth.toString()} onValueChange={(v) => setDayOfMonth(parseInt(v))}>
                <SelectTrigger data-testid="select-edit-day-of-month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[60px] text-sm resize-none"
              placeholder="Add notes..."
              data-testid="input-edit-notes"
            />
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
              disabled={!title.trim() || updateMutation.isPending}
              data-testid="button-save-template"
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
  const [editTemplate, setEditTemplate] = useState<RecurringTemplate | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: templates = [], isLoading } = useQuery<RecurringTemplate[]>({
    queryKey: ["/api/recurring-templates"],
  });

  const filteredTemplates = categoryFilter === "all" 
    ? templates 
    : templates.filter(t => (t.category || "other") === categoryFilter);

  const deleteMutation = useMutation({
    mutationFn: async (templateId: string) => {
      return apiRequest("DELETE", `/api/recurring-templates/${templateId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-templates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Template deleted" });
    },
    onError: () => {
      toast({ 
        title: "Failed to delete", 
        variant: "destructive" 
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (template: RecurringTemplate) => {
      return apiRequest("PATCH", `/api/recurring-templates/${template.id}`, {
        active: !template.active,
      });
    },
    onSuccess: (_, template) => {
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-templates"] });
      toast({ title: template.active ? "Template paused" : "Template resumed" });
    },
    onError: () => {
      toast({ 
        title: "Failed to update", 
        variant: "destructive" 
      });
    },
  });

  const handleEdit = (template: RecurringTemplate) => {
    setEditTemplate(template);
    setEditOpen(true);
  };

  const handleDelete = (templateId: string) => {
    deleteMutation.mutate(templateId);
  };

  const handleToggleActive = (template: RecurringTemplate) => {
    toggleActiveMutation.mutate(template);
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
            Recurring Templates
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your repeating task templates
          </p>
        </header>

        <div className="flex justify-center">
          <Button 
            onClick={() => setCreateOpen(true)}
            className="gap-2"
            data-testid="button-add-template"
          >
            <Plus className="w-4 h-4" />
            Create Template
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

        {filteredTemplates.length === 0 ? (
          <Card className="border-card-border">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Repeat className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground mb-1">
                {categoryFilter === "all" ? "No templates yet" : `No ${categoryFilter} templates`}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create a template to automatically generate recurring tasks
              </p>
              {categoryFilter === "all" && (
                <Button onClick={() => setCreateOpen(true)} variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create your first template
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        <CreateTemplateDialog open={createOpen} onOpenChange={setCreateOpen} />
        <EditTemplateDialog 
          template={editTemplate} 
          open={editOpen} 
          onOpenChange={setEditOpen} 
        />
      </div>
    </div>
  );
}
