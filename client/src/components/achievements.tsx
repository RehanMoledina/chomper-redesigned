import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Cookie, Utensils, ChefHat, Drumstick, Crown,
  Flame, Zap, Star, Trophy, Heart, Sparkles,
  Lock
} from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Achievement } from "@shared/schema";

const iconMap: Record<string, typeof Cookie> = {
  cookie: Cookie,
  utensils: Utensils,
  "chef-hat": ChefHat,
  drumstick: Drumstick,
  crown: Crown,
  flame: Flame,
  zap: Zap,
  star: Star,
  trophy: Trophy,
  heart: Heart,
  sparkles: Sparkles,
};

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const isUnlocked = !!achievement.unlockedAt;
  const Icon = iconMap[achievement.icon] || Star;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`p-3 flex items-center gap-3 transition-all ${
          isUnlocked 
            ? "bg-card" 
            : "bg-muted/50 opacity-60"
        }`}
        data-testid={`achievement-${achievement.id}`}
      >
        <div 
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            isUnlocked 
              ? "bg-primary/10 text-primary" 
              : "bg-muted text-muted-foreground"
          }`}
        >
          {isUnlocked ? (
            <Icon className="w-5 h-5" />
          ) : (
            <Lock className="w-4 h-4" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 
            className={`font-medium text-sm truncate ${
              isUnlocked ? "text-foreground" : "text-muted-foreground"
            }`}
            data-testid={`text-achievement-name-${achievement.id}`}
          >
            {achievement.name}
          </h4>
          <p 
            className="text-xs text-muted-foreground truncate"
            data-testid={`text-achievement-desc-${achievement.id}`}
          >
            {achievement.description}
          </p>
        </div>
        {isUnlocked && (
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
        )}
      </Card>
    </motion.div>
  );
}

export function Achievements() {
  const { data: achievements = [], isLoading } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
  });

  const unlockedCount = achievements.filter(a => a.unlockedAt).length;
  const totalCount = achievements.length;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Achievements</h3>
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
        <div className="grid gap-2">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-3 h-16 animate-pulse bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const sortedAchievements = [...achievements].sort((a, b) => {
    if (a.unlockedAt && !b.unlockedAt) return -1;
    if (!a.unlockedAt && b.unlockedAt) return 1;
    return 0;
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground" data-testid="text-achievements-title">
          Achievements
        </h3>
        <span className="text-sm text-muted-foreground" data-testid="text-achievements-count">
          {unlockedCount} / {totalCount}
        </span>
      </div>

      <div className="grid gap-2">
        {sortedAchievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </div>
  );
}
