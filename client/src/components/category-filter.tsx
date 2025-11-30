import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const categories = [
  { value: "all", label: "All", color: "bg-foreground" },
  { value: "personal", label: "Personal", color: "bg-blue-500" },
  { value: "work", label: "Work", color: "bg-purple-500" },
  { value: "shopping", label: "Shopping", color: "bg-amber-500" },
  { value: "health", label: "Health", color: "bg-emerald-500" },
  { value: "other", label: "Other", color: "bg-gray-500" },
];

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  taskCounts?: Record<string, number>;
}

export function CategoryFilter({
  selectedCategory,
  onCategoryChange,
  taskCounts = {},
}: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {categories.map((category) => {
        const isSelected = selectedCategory === category.value;
        const count = category.value === "all" 
          ? Object.values(taskCounts).reduce((a, b) => a + b, 0)
          : taskCounts[category.value] || 0;

        return (
          <button
            key={category.value}
            onClick={() => onCategoryChange(category.value)}
            className="flex-shrink-0"
            data-testid={`button-filter-${category.value}`}
          >
            <Badge
              variant={isSelected ? "default" : "secondary"}
              className={cn(
                "cursor-pointer transition-all gap-1.5 px-3 py-1",
                isSelected && "ring-2 ring-ring ring-offset-1 ring-offset-background"
              )}
            >
              <div className={cn(
                "w-2 h-2 rounded-full",
                category.value === "all" ? "bg-gradient-to-br from-blue-500 via-purple-500 to-emerald-500" : category.color
              )} />
              <span>{category.label}</span>
              {count > 0 && (
                <span className={cn(
                  "text-xs ml-0.5",
                  isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                )} data-testid={`text-count-${category.value}`}>
                  {count}
                </span>
              )}
            </Badge>
          </button>
        );
      })}
    </div>
  );
}
