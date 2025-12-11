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
  const currentStreak = stats?.currentStreak ?? 0;
  const longestStreak = stats?.longestStreak ?? 0;
  const tasksChomped = stats?.tasksChomped ?? totalCompleted;

  // Weekly recurring tasks stats
  const weeklyRecurringTasks = tasks.filter(t => t.isRecurring && t.recurringPattern === "weekly");
  const completedWeeklyTasks = weeklyRecurringTasks.filter(t => t.completed).length;
  const totalWeeklyTasks = weeklyRecurringTasks.length;

  // Monthly recurring tasks stats
  const monthlyRecurringTasks = tasks.filter(t => t.isRecurring && t.recurringPattern === "monthly");
  const completedMonthlyTasks = monthlyRecurringTasks.filter(t => t.completed).length;
  const totalMonthlyTasks = monthlyRecurringTasks.length;

  const getMonsterState = () => {
    if (completedToday >= 5) return "celebrating";
    if (completedToday >= 2) return "happy";
    if (completedToday >= 1) return "idle";
    return "hungry";
  };

  const getMonsterMessage = () => {
    if (completedToday >= 5) return "I love you! You're the best!";
    if (completedToday >= 2) return "We make a great team!";
    if (completedToday >= 1) return "Let's get productive!";
    return "I'm so hungry... need tasks!";
  };

  // Calculate next monster unlock progress
  const getNextMonsterProgress = () => {
    const monsters = [
      // Task-based monsters
      { name: "Blaze", type: "tasks", value: 10 },
      { name: "Sparkle", type: "tasks", value: 25 },
      { name: "Cosmic", type: "tasks", value: 50 },
      { name: "Nova", type: "tasks", value: 100 },
      // Streak-based monsters
      { name: "Ember", type: "streak", value: 3 },
      { name: "Royal", type: "streak", value: 7 },
      { name: "Titan", type: "streak", value: 14 },
      { name: "Legend", type: "streak", value: 30 },
    ];

    // Find next task-based monster to unlock
    const nextTaskMonster = monsters
      .filter(m => m.type === "tasks" && tasksChomped < m.value)
      .sort((a, b) => a.value - b.value)[0];

    // Find next streak-based monster to unlock
    const nextStreakMonster = monsters
      .filter(m => m.type === "streak" && longestStreak < m.value)
      .sort((a, b) => a.value - b.value)[0];

    // Return the one that's closer to being achieved
    if (nextTaskMonster && nextStreakMonster) {
      const taskProgress = tasksChomped / nextTaskMonster.value;
      const streakProgress = longestStreak / nextStreakMonster.value;
      if (taskProgress >= streakProgress) {
        return { 
          monster: nextTaskMonster, 
          current: tasksChomped, 
          progress: (tasksChomped / nextTaskMonster.value) * 100,
          label: `${tasksChomped}/${nextTaskMonster.value} tasks`
        };
      } else {
        return { 
          monster: nextStreakMonster, 
          current: longestStreak, 
          progress: (longestStreak / nextStreakMonster.value) * 100,
          label: `${longestStreak}/${nextStreakMonster.value} day streak`
        };
      }
    } else if (nextTaskMonster) {
      return { 
        monster: nextTaskMonster, 
        current: tasksChomped, 
        progress: (tasksChomped / nextTaskMonster.value) * 100,
        label: `${tasksChomped}/${nextTaskMonster.value} tasks`
      };
    } else if (nextStreakMonster) {
      return { 
        monster: nextStreakMonster, 
        current: longestStreak, 
        progress: (longestStreak / nextStreakMonster.value) * 100,
        label: `${longestStreak}/${nextStreakMonster.value} day streak`
      };
    }

    return null; // All monsters unlocked
  };

  const nextMonster = getNextMonsterProgress();

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
                <span className="text-sm font-medium text-muted-foreground">Weekly Tasks</span>
              </div>
              <p className="text-2xl font-bold" data-testid="text-weekly-tasks">
                {completedWeeklyTasks}<span className="text-muted-foreground text-xl">/{totalWeeklyTasks}</span>
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card className="border-card-border">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Monthly Tasks</span>
              </div>
              <p className="text-2xl font-bold" data-testid="text-monthly-tasks">
                {completedMonthlyTasks}<span className="text-muted-foreground text-xl">/{totalMonthlyTasks}</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-muted-foreground">Total Completed</span>
              </div>
              <p className="text-2xl font-bold" data-testid="text-total-completed">{tasksChomped}</p>
            </CardContent>
          </Card>
        </div>

        {nextMonster ? (
          <Card className="border-card-border">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">
                  Next Monster: <span className="text-foreground font-semibold">{nextMonster.monster.name}</span>
                </span>
                <span className="text-sm font-semibold">{nextMonster.label}</span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(nextMonster.progress, 100)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {nextMonster.progress < 30 
                  ? `Keep completing tasks to unlock ${nextMonster.monster.name}!`
                  : nextMonster.progress < 70
                  ? `You're making great progress toward ${nextMonster.monster.name}!`
                  : `Almost there! ${nextMonster.monster.name} is within reach!`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-card-border">
            <CardContent className="pt-4 text-center">
              <Sparkles className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">All Monsters Unlocked!</p>
              <p className="text-xs text-muted-foreground mt-1">
                You've collected all monster companions. Amazing work!
              </p>
            </CardContent>
          </Card>
        )}

        <MonsterSelector />

        <Achievements />
      </div>
    </div>
  );
}
