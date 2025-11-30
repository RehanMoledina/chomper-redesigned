import { Link, useLocation } from "wouter";
import { CheckSquare, Smile, BarChart3, Settings } from "lucide-react";
import { motion } from "framer-motion";

interface NavItem {
  href: string;
  icon: typeof CheckSquare;
  label: string;
  testId: string;
}

const navItems: NavItem[] = [
  { href: "/", icon: CheckSquare, label: "Tasks", testId: "nav-tasks" },
  { href: "/monster", icon: Smile, label: "Chomper", testId: "nav-monster" },
  { href: "/stats", icon: BarChart3, label: "Stats", testId: "nav-stats" },
  { href: "/settings", icon: Settings, label: "Settings", testId: "nav-settings" },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-card-border safe-area-bottom">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href}>
                <button
                  className="relative flex flex-col items-center justify-center w-16 h-14 gap-1 transition-colors"
                  data-testid={item.testId}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-x-2 top-1 h-[3px] bg-primary rounded-full"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <Icon
                    className={`h-5 w-5 transition-colors ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <span
                    className={`text-[11px] font-medium transition-colors ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
