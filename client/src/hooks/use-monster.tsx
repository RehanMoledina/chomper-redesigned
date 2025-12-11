import { useState, useEffect, useMemo, createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Achievement, MonsterStats } from "@shared/schema";

type MonsterType = "chomper" | "blaze" | "sparkle" | "royal" | "cosmic" | "ember" | "titan" | "legend" | "nova";

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
      // Check monster unlock achievements by looking for the suffix
      const monsterUnlocks: { suffix: string; monster: MonsterType }[] = [
        { suffix: "_monster_blaze", monster: "blaze" },
        { suffix: "_monster_sparkle", monster: "sparkle" },
        { suffix: "_monster_cosmic", monster: "cosmic" },
        { suffix: "_monster_nova", monster: "nova" },
        { suffix: "_monster_ember", monster: "ember" },
        { suffix: "_monster_royal", monster: "royal" },
        { suffix: "_monster_titan", monster: "titan" },
        { suffix: "_monster_legend", monster: "legend" },
      ];
      
      for (const { suffix, monster } of monsterUnlocks) {
        const achievement = achievements.find(a => a.id.endsWith(suffix) && a.unlockedAt);
        if (achievement) unlocked.push(monster);
      }
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
