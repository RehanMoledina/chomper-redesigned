import { useState, useEffect, useMemo, createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Achievement, MonsterStats } from "@shared/schema";

type MonsterType = "chomper" | "blaze" | "sparkle" | "royal" | "cosmic";

interface MonsterContextType {
  selectedMonster: MonsterType;
  setSelectedMonster: (type: MonsterType) => void;
  unlockedMonsters: MonsterType[];
  isLoading: boolean;
}

const MonsterContext = createContext<MonsterContextType | null>(null);

export function MonsterProvider({ children }: { children: React.ReactNode }) {
  const [selectedMonster, setSelectedMonsterState] = useState<MonsterType>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("selectedMonster") as MonsterType) || "chomper";
    }
    return "chomper";
  });

  const { data: achievements = [], isLoading: achievementsLoading } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<MonsterStats>({
    queryKey: ["/api/stats"],
  });

  const setSelectedMonster = (type: MonsterType) => {
    setSelectedMonsterState(type);
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedMonster", type);
    }
  };

  const unlockedMonsters = useMemo(() => {
    const unlocked: MonsterType[] = ["chomper"];
    
    if (achievements.length > 0) {
      const hasTask10 = achievements.find(a => a.id === "chomp_10" && a.unlockedAt);
      if (hasTask10) unlocked.push("blaze");
      
      const hasHappiness75 = achievements.find(a => a.id === "happiness_75" && a.unlockedAt);
      if (hasHappiness75) unlocked.push("sparkle");
      
      const hasStreak7 = achievements.find(a => a.id === "streak_7" && a.unlockedAt);
      if (hasStreak7) unlocked.push("royal");
      
      const hasTask50 = achievements.find(a => a.id === "chomp_50" && a.unlockedAt);
      if (hasTask50) unlocked.push("cosmic");
    }
    
    return unlocked;
  }, [achievements]);

  useEffect(() => {
    if (!unlockedMonsters.includes(selectedMonster)) {
      setSelectedMonster("chomper");
    }
  }, [unlockedMonsters, selectedMonster]);

  return (
    <MonsterContext.Provider value={{
      selectedMonster,
      setSelectedMonster,
      unlockedMonsters,
      isLoading: achievementsLoading || statsLoading,
    }}>
      {children}
    </MonsterContext.Provider>
  );
}

export function useMonster() {
  const context = useContext(MonsterContext);
  if (!context) {
    throw new Error("useMonster must be used within a MonsterProvider");
  }
  return context;
}
