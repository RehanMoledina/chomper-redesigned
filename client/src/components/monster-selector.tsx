import { motion } from "framer-motion";
import { Lock, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MonsterCompanion, monsterInfo } from "@/components/monster-companion";
import { useMonster } from "@/hooks/use-monster";

type MonsterType = "chomper" | "blaze" | "sparkle" | "royal" | "cosmic";

const allMonsters: MonsterType[] = ["chomper", "blaze", "sparkle", "royal", "cosmic"];

export function MonsterSelector() {
  const { selectedMonster, setSelectedMonster, unlockedMonsters, isLoading } = useMonster();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Your Monsters</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="p-4 h-32 animate-pulse bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground" data-testid="text-monsters-title">
          Your Monsters
        </h3>
        <span className="text-sm text-muted-foreground" data-testid="text-monsters-count">
          {unlockedMonsters.length} / {allMonsters.length}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {allMonsters.map((type) => {
          const isUnlocked = unlockedMonsters.includes(type);
          const isSelected = selectedMonster === type;
          const info = monsterInfo[type];

          return (
            <motion.div
              key={type}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Card
                className={`p-3 cursor-pointer transition-all relative ${
                  isUnlocked 
                    ? isSelected 
                      ? "ring-2 ring-primary bg-primary/5" 
                      : "hover-elevate"
                    : "opacity-60 cursor-not-allowed"
                }`}
                onClick={() => isUnlocked && setSelectedMonster(type)}
                data-testid={`monster-card-${type}`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </div>
                )}
                {!isUnlocked && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                    <Lock className="w-3 h-3" />
                  </div>
                )}
                
                <div className="flex flex-col items-center gap-2">
                  <div className={!isUnlocked ? "opacity-50 grayscale" : ""}>
                    <MonsterCompanion
                      state="idle"
                      size="small"
                      showMessage={false}
                      monsterType={type}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground" data-testid={`text-monster-name-${type}`}>
                      {info.name}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2" data-testid={`text-monster-req-${type}`}>
                      {isUnlocked ? info.description : info.requirement}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
