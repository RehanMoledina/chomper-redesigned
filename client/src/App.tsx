import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { MonsterProvider } from "@/hooks/use-monster";
import { BottomNav } from "@/components/bottom-nav";
import { useAuth } from "@/hooks/useAuth";
import Home from "@/pages/home";
import Monster from "@/pages/monster";
import Stats from "@/pages/stats";
import Settings from "@/pages/settings";
import Landing from "@/pages/landing";
import NotFound from "@/pages/not-found";

function AuthenticatedRouter() {
  return (
    <>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/monster" component={Monster} />
        <Route path="/stats" component={Stats} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
      <BottomNav />
    </>
  );
}

function AppContent() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return (
    <MonsterProvider>
      <div className="min-h-screen bg-background">
        <AuthenticatedRouter />
      </div>
    </MonsterProvider>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="chomper-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
