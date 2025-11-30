import { useQuery } from "@tanstack/react-query";
import { MonsterCompanion, monsterInfo } from "@/components/monster-companion";
import { MonsterSelector } from "@/components/monster-selector";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Sparkles, Heart, Zap, Star } from "lucide-react";
import { useMonster } from "@/hooks/use-monster";
import type { Task, MonsterStats } from "@shared/schema";

export default function Monster() {
  const { selectedMonster } = useMonster();
  
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<MonsterStats>({
    queryKey: ["/api/stats"],
  });

  const isLoading = tasksLoading || statsLoading;

  const completedToday = tasks.filter((t) => {
    if (!t.completed || !t.completedAt) return false;
    const completedDate = new Date(t.completedAt);
    const today = new Date();
    return completedDate.toDateString() === today.toDateString();
  }).length;

  const totalCompleted = tasks.filter((t) => t.completed).length;
  const happinessLevel = stats?.happinessLevel ?? 50;
  const currentStreak = stats?.currentStreak ?? 0;

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

  const traits = [
    { icon: Heart, label: "Happiness", value: `${happinessLevel}%`, color: "text-pink-500" },
    { icon: Zap, label: "Energy", value: completedToday > 5 ? "High" : completedToday > 2 ? "Medium" : "Low", color: "text-amber-500" },
    { icon: Star, label: "Level", value: Math.floor(totalCompleted / 10) + 1, color: "text-purple-500" },
    { icon: Sparkles, label: "Streak", value: `${currentStreak} days`, color: "text-emerald-500" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
          <div className="flex flex-col items-center py-12">
            <Skeleton className="h-32 w-32 rounded-full" />
            <Skeleton className="h-4 w-40 mt-4" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
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
            Your {monsterInfo[selectedMonster].name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {monsterInfo[selectedMonster].description}
          </p>
        </header>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="flex flex-col items-center py-8"
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

        <Card className="border-card-border bg-gradient-to-br from-card to-card/80">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">Happiness Level</span>
              <span className="text-sm font-semibold" data-testid="text-monster-happiness">{happinessLevel}%</span>
            </div>
            <div className="relative w-full h-4 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${happinessLevel}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white/0 to-white/20 rounded-full" />
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {happinessLevel < 30 
                ? "Complete some tasks to make Chomper happier!"
                : happinessLevel < 70
                ? "Chomper is feeling good. Keep it up!"
                : "Chomper is thriving! You're amazing!"}
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          {traits.map((trait, index) => {
            const Icon = trait.icon;
            return (
              <motion.div
                key={trait.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-card-border hover-elevate">
                  <CardContent className="pt-4 flex flex-col items-center text-center">
                    <Icon className={`h-6 w-6 ${trait.color} mb-2`} />
                    <p className="text-xs font-medium text-muted-foreground">{trait.label}</p>
                    <p className="text-lg font-bold" data-testid={`text-trait-${trait.label.toLowerCase()}`}>
                      {trait.value}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <Card className="border-card-border">
          <CardContent className="pt-4 text-center">
            <h3 className="font-semibold mb-2">Today's Appetite</h3>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-bold text-primary" data-testid="text-chomped-today">{completedToday}</span>
              <span className="text-muted-foreground">tasks chomped</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {completedToday === 0
                ? `${monsterInfo[selectedMonster].name} is waiting for its first meal today!`
                : completedToday < 3
                ? "Just getting started. Feed me more!"
                : completedToday < 6
                ? "Feeling satisfied. But I can eat more!"
                : "So full! What a productive day!"}
            </p>
          </CardContent>
        </Card>

        <MonsterSelector />
      </div>
    </div>
  );
}
