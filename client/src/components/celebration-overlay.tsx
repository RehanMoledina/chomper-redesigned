import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MonsterCompanion } from "./monster-companion";

interface CelebrationOverlayProps {
  isVisible: boolean;
  onComplete: () => void;
  message?: string;
}

export function CelebrationOverlay({ isVisible, onComplete, message }: CelebrationOverlayProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        onComplete();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={() => {
            setShow(false);
            onComplete();
          }}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="flex flex-col items-center gap-4"
          >
            <MonsterCompanion
              state="celebrating"
              size="large"
              showMessage={true}
              message={message || "CHOMPED!"}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
