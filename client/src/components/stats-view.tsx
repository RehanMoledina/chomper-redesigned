import { motion } from "framer-motion";
import { TrendingUp, CheckCircle2, Flame, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonsterCompanion } from "./monster-companion";
import type { Task, MonsterStats } from "@shared/schema";

interface StatsViewProps {
  tasks: Task[];
  stats: MonsterStats | null;
}

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
}

function ProgressRing({ progress, size = 120, strokeWidth = 10 }: ProgressRingProps) {
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
        <span className="text-2xl font-bold" data-testid="text-progress-percentage">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

export function StatsView({ tasks, stats }: StatsViewProps) {
  const todayTasks = tasks.filter(t => {
    if (!t.createdAt) return false;
    const created = new Date(t.createdAt);
    const today = new Date();
    return created.toDateString() === today.toDateString();
  });

  const completedToday = todayTasks.filter(t => t.completed).length;
  const totalToday = todayTasks.length;
  const progress = totalToday > 0 ? (completedToday / totalToday) * 100 : 0;

  const totalCompleted = tasks.filter(t => t.completed).length;
  const totalPending = tasks.filter(t => !t.completed).length;

  const currentStreak = stats?.currentStreak ?? 0;
  const longestStreak = stats?.longestStreak ?? 0;
  const tasksChomped = stats?.tasksChomped ?? totalCompleted;
  const happinessLevel = stats?.happinessLevel ?? 50;

  const getMonsterState = () => {
    if (happinessLevel >= 80) return "celebrating";
    if (happinessLevel >= 50) return "happy";
    if (happinessLevel >= 20) return "idle";
    return "hungry";
  };

  const getMonsterMessage = () => {
    if (happinessLevel >= 80) return "I'm so happy! You're crushing it!";
    if (happinessLevel >= 50) return "Feeling good! Keep those tasks coming!";
    if (happinessLevel >= 20) return "I could use some more tasks...";
    return "Feed me! I'm starving for productivity!";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center py-6">
        <MonsterCompanion
          state={getMonsterState()}
          size="large"
          tasksCompleted={completedToday}
          showMessage={true}
          message={getMonsterMessage()}
        />
      </div>

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

      <Card className="border-card-border">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Total Chomped</span>
            </div>
            <p className="text-2xl font-bold text-primary" data-testid="text-total-chomped">{tasksChomped}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-card-border">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Monster Happiness</span>
            <span className="text-sm font-semibold" data-testid="text-happiness-level">{happinessLevel}%</span>
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
            Complete more tasks to keep Chomper happy!
          </p>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
        <span>Pending tasks: <span className="font-semibold text-foreground" data-testid="text-pending-count">{totalPending}</span></span>
        <span>All time completed: <span className="font-semibold text-foreground" data-testid="text-all-time-completed">{totalCompleted}</span></span>
      </div>
    </div>
  );
}
