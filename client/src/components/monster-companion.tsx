import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type MonsterState = "idle" | "hungry" | "eating" | "happy" | "celebrating";
type MonsterType = "chomper" | "blaze" | "sparkle" | "royal" | "cosmic";

interface MonsterCompanionProps {
  state?: MonsterState;
  tasksCompleted?: number;
  size?: "small" | "medium" | "large";
  onAnimationComplete?: () => void;
  showMessage?: boolean;
  message?: string;
  monsterType?: MonsterType;
}

const monsterMessages = {
  idle: ["Ready to chomp!", "Got any tasks?", "Let's be productive!"],
  hungry: ["Feed me tasks!", "I'm starving!", "Complete something!"],
  eating: ["Nom nom nom!", "Delicious!", "Yummy task!"],
  happy: ["Great job!", "Keep going!", "You're amazing!"],
  celebrating: ["CHOMPED!", "Victory!", "Incredible!"],
};

const getRandomMessage = (state: MonsterState): string => {
  const messages = monsterMessages[state];
  return messages[Math.floor(Math.random() * messages.length)];
};

const monsterColors: Record<MonsterType, Record<MonsterState, string>> = {
  chomper: {
    idle: "bg-gradient-to-b from-emerald-400 to-emerald-500",
    hungry: "bg-gradient-to-b from-blue-400 to-blue-500",
    eating: "bg-gradient-to-b from-emerald-400 to-emerald-500",
    happy: "bg-gradient-to-b from-emerald-400 to-emerald-500",
    celebrating: "bg-gradient-to-b from-yellow-400 to-amber-500",
  },
  blaze: {
    idle: "bg-gradient-to-b from-orange-400 to-red-500",
    hungry: "bg-gradient-to-b from-orange-300 to-orange-400",
    eating: "bg-gradient-to-b from-red-400 to-red-500",
    happy: "bg-gradient-to-b from-orange-400 to-red-500",
    celebrating: "bg-gradient-to-b from-yellow-400 to-orange-500",
  },
  sparkle: {
    idle: "bg-gradient-to-b from-pink-400 to-purple-500",
    hungry: "bg-gradient-to-b from-pink-300 to-pink-400",
    eating: "bg-gradient-to-b from-purple-400 to-purple-500",
    happy: "bg-gradient-to-b from-pink-400 to-purple-500",
    celebrating: "bg-gradient-to-b from-yellow-300 to-pink-400",
  },
  royal: {
    idle: "bg-gradient-to-b from-indigo-400 to-purple-600",
    hungry: "bg-gradient-to-b from-indigo-300 to-indigo-400",
    eating: "bg-gradient-to-b from-indigo-500 to-purple-600",
    happy: "bg-gradient-to-b from-indigo-400 to-purple-600",
    celebrating: "bg-gradient-to-b from-amber-400 to-indigo-500",
  },
  cosmic: {
    idle: "bg-gradient-to-b from-cyan-400 to-blue-600",
    hungry: "bg-gradient-to-b from-cyan-300 to-cyan-400",
    eating: "bg-gradient-to-b from-blue-400 to-indigo-600",
    happy: "bg-gradient-to-b from-cyan-400 to-blue-600",
    celebrating: "bg-gradient-to-b from-yellow-300 to-cyan-500",
  },
};

export const monsterInfo: Record<MonsterType, { name: string; description: string; requirement: string; type: string; value: number }> = {
  chomper: { name: "Chomper", description: "The classic green friend", requirement: "Always available", type: "default", value: 0 },
  blaze: { name: "Blaze", description: "A fiery companion", requirement: "Complete 10 tasks", type: "tasks", value: 10 },
  sparkle: { name: "Sparkle", description: "A magical friend", requirement: "Complete 25 tasks", type: "tasks", value: 25 },
  royal: { name: "Royal", description: "A noble companion", requirement: "Maintain a 7-day streak", type: "streak", value: 7 },
  cosmic: { name: "Cosmic", description: "A stellar friend", requirement: "Complete 50 tasks", type: "tasks", value: 50 },
};

export function MonsterCompanion({
  state = "idle",
  tasksCompleted = 0,
  size = "medium",
  onAnimationComplete,
  showMessage = true,
  message,
  monsterType = "chomper",
}: MonsterCompanionProps) {
  const [currentMessage, setCurrentMessage] = useState(message || getRandomMessage(state));
  const [isChomping, setIsChomping] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const sizeClasses = {
    small: "w-16 h-16",
    medium: "w-24 h-24",
    large: "w-32 h-32",
  };

  const eyeSizes = {
    small: { eye: "w-3 h-4", pupil: "w-1.5 h-2" },
    medium: { eye: "w-4 h-5", pupil: "w-2 h-2.5" },
    large: { eye: "w-5 h-6", pupil: "w-2.5 h-3" },
  };

  useEffect(() => {
    if (!message) {
      setCurrentMessage(getRandomMessage(state));
    } else {
      setCurrentMessage(message);
    }
  }, [state, message]);

  useEffect(() => {
    if (state === "eating" || state === "celebrating") {
      setIsChomping(true);
      setShowConfetti(state === "celebrating");
      const timer = setTimeout(() => {
        setIsChomping(false);
        setShowConfetti(false);
        onAnimationComplete?.();
      }, state === "celebrating" ? 1500 : 600);
      return () => clearTimeout(timer);
    }
  }, [state, onAnimationComplete]);

  const getMonsterColor = useCallback(() => {
    return monsterColors[monsterType][state];
  }, [state, monsterType]);

  const getMouthState = useCallback(() => {
    if (isChomping) {
      return (
        <motion.div
          className="absolute bottom-[25%] left-1/2 -translate-x-1/2"
          animate={{ scaleY: [1, 0.3, 1, 0.3, 1] }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <div className="relative">
            <div className="w-8 h-6 bg-red-400 rounded-b-full overflow-hidden">
              <div className="absolute top-0 left-0 right-0 flex justify-around">
                <div className="w-1.5 h-2 bg-white rounded-b-sm" />
                <div className="w-1.5 h-2 bg-white rounded-b-sm" />
                <div className="w-1.5 h-2 bg-white rounded-b-sm" />
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    switch (state) {
      case "happy":
      case "celebrating":
        return (
          <div className="absolute bottom-[25%] left-1/2 -translate-x-1/2 w-6 h-3 bg-red-400 rounded-b-full" />
        );
      case "hungry":
        return (
          <div className="absolute bottom-[28%] left-1/2 -translate-x-1/2 w-4 h-2 bg-gray-700 rounded-full" />
        );
      default:
        return (
          <div className="absolute bottom-[28%] left-1/2 -translate-x-1/2 w-5 h-2.5 bg-gray-700 rounded-full flex items-center justify-center">
            <div className="w-3 h-1 bg-red-300 rounded-full" />
          </div>
        );
    }
  }, [state, isChomping]);

  const confettiColors = ["#10b981", "#f59e0b", "#3b82f6", "#ec4899", "#8b5cf6"];

  return (
    <div className="relative flex flex-col items-center gap-3">
      <AnimatePresence>
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-visible">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  backgroundColor: confettiColors[i % confettiColors.length],
                  left: "50%",
                  top: "50%",
                }}
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1, 1, 0],
                  x: Math.cos((i * 30 * Math.PI) / 180) * 80,
                  y: Math.sin((i * 30 * Math.PI) / 180) * 80 - 40,
                }}
                transition={{
                  duration: 0.8,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      <motion.div
        className={`relative ${sizeClasses[size]} ${getMonsterColor()} rounded-full shadow-lg`}
        animate={
          state === "idle"
            ? { y: [0, -4, 0] }
            : state === "celebrating"
            ? { scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] }
            : {}
        }
        transition={
          state === "idle"
            ? { duration: 3, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.5 }
        }
      >
        <div className="absolute top-[20%] left-[22%] flex flex-col items-center">
          <div className={`${eyeSizes[size].eye} bg-white rounded-full flex items-center justify-center`}>
            <motion.div
              className={`${eyeSizes[size].pupil} bg-gray-800 rounded-full`}
              animate={state === "celebrating" ? { y: [0, -1, 0] } : {}}
              transition={{ duration: 0.3, repeat: state === "celebrating" ? 3 : 0 }}
            />
          </div>
        </div>
        <div className="absolute top-[20%] right-[22%] flex flex-col items-center">
          <div className={`${eyeSizes[size].eye} bg-white rounded-full flex items-center justify-center`}>
            <motion.div
              className={`${eyeSizes[size].pupil} bg-gray-800 rounded-full`}
              animate={state === "celebrating" ? { y: [0, -1, 0] } : {}}
              transition={{ duration: 0.3, repeat: state === "celebrating" ? 3 : 0 }}
            />
          </div>
        </div>

        {state === "happy" || state === "celebrating" ? (
          <>
            <div className="absolute top-[38%] left-[18%] w-3 h-1.5 bg-pink-300/60 rounded-full" />
            <div className="absolute top-[38%] right-[18%] w-3 h-1.5 bg-pink-300/60 rounded-full" />
          </>
        ) : null}

        {getMouthState()}

        <div className="absolute -top-1 left-[30%] w-2 h-3 bg-inherit rounded-full transform -rotate-12" />
        <div className="absolute -top-1 right-[30%] w-2 h-3 bg-inherit rounded-full transform rotate-12" />
      </motion.div>

      {showMessage && (
        <motion.div
          key={currentMessage}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="text-sm font-medium text-muted-foreground text-center max-w-[150px]"
          data-testid="text-monster-message"
        >
          {currentMessage}
        </motion.div>
      )}

      {tasksCompleted > 0 && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="font-semibold text-primary" data-testid="text-tasks-chomped">{tasksCompleted}</span>
          <span>chomped today</span>
        </div>
      )}
    </div>
  );
}
