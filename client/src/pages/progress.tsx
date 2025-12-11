import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  TrendingUp, CheckCircle2, Flame, Target, Heart, Zap, Star, Sparkles 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonsterCompanion, monsterInfo } from "@/components/monster-companion";
import { MonsterSelector } from "@/components/monster-selector";
import { Achievements } from "@/components/achievements";
import { Skeleton } from "@/components/ui/skeleton";
import { useMonster } from "@/hooks/use-monster";
import { startOfDay } from "date-fns";
import type { Task, MonsterStats } from "@shared/schema";

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
}

function ProgressRing({ progress, size = 100, strokeWidth = 8 }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-muted/30"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <motion.circle
          className="text-primary"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold" data-testid="text-progress-percentage">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

export default function Progress() {
  const { selectedMonster } = useMonster();
  
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<MonsterStats>({
    queryKey: ["/api/stats"],
  });

  const isLoading = tasksLoading || statsLoading;

  const todayStart = startOfDay(new Date());
  
  const todayTasks = tasks.filter(t => {
    if (!t.dueDate) return true;
    const dueDate = new Date(t.dueDate);
    const dueDateStart = startOfDay(dueDate);
    return dueDateStart <= todayStart;
  });

  const completedToday = todayTasks.filter(t => t.completed).length;
  const totalToday = todayTasks.length;
  const progress = totalToday > 0 ? (completedToday / totalToday) * 100 : 0;

  const totalCompleted = tasks.filter(t => t.completed).length;
  const happinessLevel = stats?.happinessLevel ?? 50;
  const currentStreak = stats?.currentStreak ?? 0;
  const longestStreak = stats?.longestStreak ?? 0;
  const tasksChomped = stats?.tasksChomped ?? totalCompleted;

  const getMonsterState = () => {
    if (happinessLevel >= 80) return "celebrating";
    if (happinessLevel >= 50) return "happy";
    if (happinessLevel >= 20) return "idle";
    return "hungry";
  };

  const getMonsterMessage = () => {
    if (happinessLevel >= 80) return "I love you! You're the best!";
    if (happinessLevel >= 50) return "We make a great team!";
    if (happinessLevel >= 20) return "Let's get productive!";
    return "I'm so hungry... need tasks!";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
          <div className="flex flex-col items-center py-8">
            <Skeleton className="h-28 w-28 rounded-full" />
            <Skeleton className="h-4 w-40 mt-4" />
          </div>
          <Skeleton className="h-32 w-full rounded-lg" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
          </div>
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <header className="text-center">
          <h1 className="text-2xl font-semibold text-foreground" data-testid="text-page-title">
            Progress
          </h1>
          <p className="text-sm text-muted-foreground">
            Your productivity journey with {monsterInfo[selectedMonster].name}
          </p>
        </header>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="flex flex-col items-center py-6"
        >
          <MonsterCompanion
            state={getMonsterState()}
            size="large"
            tasksCompleted={completedToday}
            showMessage={true}
            message={getMonsterMessage()}
            monsterType={selectedMonster}
          />
        </motion.div>

        <Card className="border-card-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Today's Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-3xl font-bold" data-testid="text-completed-today">
                {completedToday}<span className="text-muted-foreground text-xl">/{totalToday}</span>
              </p>
              <p className="text-sm text-muted-foreground">tasks completed</p>
            </div>
            <ProgressRing progress={progress} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card className="border-card-border">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-muted-foreground">Current Streak</span>
              </div>
              <p className="text-2xl font-bold" data-testid="text-current-streak">
                {currentStreak} <span className="text-sm font-normal text-muted-foreground">days</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium text-muted-foreground">Best Streak</span>
              </div>
              <p className="text-2xl font-bold" data-testid="text-longest-streak">
                {longestStreak} <span className="text-sm font-normal text-muted-foreground">days</span>
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card className="border-card-border">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Total Chomped</span>
              </div>
              <p className="text-2xl font-bold text-primary" data-testid="text-total-chomped">{tasksChomped}</p>
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-4 w-4 text-pink-500" />
                <span className="text-sm font-medium text-muted-foreground">Happiness</span>
              </div>
              <p className="text-2xl font-bold" data-testid="text-happiness-level">{happinessLevel}%</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-card-border">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Monster Happiness</span>
              <span className="text-sm font-semibold">{happinessLevel}%</span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${happinessLevel}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {happinessLevel < 30 
                ? "Complete some tasks to make Chomper happier!"
                : happinessLevel < 70
                ? "Chomper is feeling good. Keep it up!"
                : "Chomper is thriving! You're amazing!"}
            </p>
          </CardContent>
        </Card>

        <MonsterSelector />

        <Achievements />
      </div>
    </div>
  );
}
