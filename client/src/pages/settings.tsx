import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { SettingsView } from "@/components/settings-view";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useState, useEffect } from "react";
import type { Task } from "@shared/schema";

interface NotificationPrefs {
  notificationsEnabled: boolean;
  notificationTime: string;
  timezone: string;
}

function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function Settings() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const nativePush = usePushNotifications();
  
  const pushSupported = nativePush.isNative ? nativePush.isSupported : isPushSupported();

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: notificationPrefs, isLoading: isLoadingNotificationPrefs } = useQuery<NotificationPrefs>({
    queryKey: ["/api/notifications/preferences"],
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

  const updateNotificationPrefsMutation = useMutation({
    mutationFn: async (prefs: Partial<NotificationPrefs>) => {
      const res = await apiRequest("PATCH", "/api/notifications/preferences", prefs);
      if (!res.ok) {
        throw new Error("Failed to update notification preferences");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/preferences"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update notification settings.",
        variant: "destructive",
      });
    },
  });

  const subscribeToPush = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive",
        });
        return false;
      }

      const vapidRes = await fetch('/api/push/vapid-public-key');
      if (!vapidRes.ok) {
        throw new Error("Failed to get VAPID key");
      }
      const { publicKey } = await vapidRes.json();

      const registration = await navigator.serviceWorker.register('/service-worker.js');
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const subscriptionJson = subscription.toJSON();
      await apiRequest("POST", "/api/push/subscribe", {
        endpoint: subscriptionJson.endpoint,
        keys: subscriptionJson.keys,
      });

      return true;
    } catch (error) {
      console.error('Push subscription error:', error);
      toast({
        title: "Error",
        description: "Failed to enable notifications. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          await apiRequest("DELETE", "/api/push/subscribe", {
            endpoint: subscription.endpoint,
          });
        }
      }
      return true;
    } catch (error) {
      console.error('Push unsubscription error:', error);
      return false;
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      let success = false;
      
      if (nativePush.isNative) {
        success = await nativePush.registerForPush();
      } else {
        success = await subscribeToPush();
      }
      
      if (success) {
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        await updateNotificationPrefsMutation.mutateAsync({
          notificationsEnabled: true,
          timezone: userTimezone,
        });
        toast({
          title: "Notifications Enabled",
          description: "You'll receive daily reminders about your tasks.",
        });
      }
    } else {
      if (nativePush.isNative) {
        await nativePush.unregisterFromPush();
      } else {
        await unsubscribeFromPush();
      }
      
      await updateNotificationPrefsMutation.mutateAsync({
        notificationsEnabled: false,
      });
      toast({
        title: "Notifications Disabled",
        description: "You won't receive daily reminders anymore.",
      });
    }
  };

  const handleTimezoneChange = (timezone: string) => {
    updateNotificationPrefsMutation.mutate({ timezone });
  };

  const handleNotificationTimeChange = (time: string) => {
    updateNotificationPrefsMutation.mutate({ notificationTime: time });
  };

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
          onNotificationToggle={handleNotificationToggle}
          onTimezoneChange={handleTimezoneChange}
          onNotificationTimeChange={handleNotificationTimeChange}
          completedCount={completedCount}
          userEmail={user?.email}
          emailVerified={(user as any)?.emailVerified}
          isResendingVerification={resendVerificationMutation.isPending}
          notificationPrefs={notificationPrefs}
          isLoadingNotificationPrefs={isLoadingNotificationPrefs || updateNotificationPrefsMutation.isPending}
          pushSupported={pushSupported}
        />
      </div>
    </div>
  );
}
