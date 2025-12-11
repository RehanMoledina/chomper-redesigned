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
import Progress from "@/pages/progress";
import Recurring from "@/pages/recurring";
import Settings from "@/pages/settings";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import VerifyEmail from "@/pages/verify-email";
import NotFound from "@/pages/not-found";

function AuthenticatedRouter() {
  return (
    <>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/progress" component={Progress} />
        <Route path="/recurring" component={Recurring} />
        <Route path="/settings" component={Settings} />
        <Route path="/verify-email" component={VerifyEmail} />
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
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/verify-email" component={VerifyEmail} />
        <Route component={Landing} />
      </Switch>
    );
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
