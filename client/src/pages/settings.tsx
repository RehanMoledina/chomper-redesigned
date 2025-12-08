import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { SettingsView } from "@/components/settings-view";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Task } from "@shared/schema";

export default function Settings() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const resendVerificationMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/resend-verification");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to send verification email");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox and click the verification link.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/logout");
      if (!res.ok) {
        throw new Error("Logout failed");
      }
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/";
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    },
  });

  const clearCompletedMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/tasks/completed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Cleared",
        description: "All completed tasks have been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear completed tasks. Please try again.",
        variant: "destructive",
      });
    },
  });

  const completedCount = tasks.filter((t) => t.completed).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
          <header className="text-center">
            <Skeleton className="h-8 w-32 mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto mt-2" />
          </header>
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <header className="text-center">
          <h1 className="text-2xl font-semibold text-foreground" data-testid="text-page-title">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Customize your experience
          </p>
        </header>

        <SettingsView
          onClearCompleted={() => clearCompletedMutation.mutate()}
          onLogout={() => logoutMutation.mutate()}
          onResendVerification={() => resendVerificationMutation.mutate()}
          completedCount={completedCount}
          userEmail={user?.email}
          emailVerified={(user as any)?.emailVerified}
          isResendingVerification={resendVerificationMutation.isPending}
        />
      </div>
    </div>
  );
}
