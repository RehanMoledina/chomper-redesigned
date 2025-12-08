import { Moon, Sun, Monitor, Bell, Volume2, Trash2, Info, LogOut, Mail, CheckCircle, AlertCircle, Loader2, Globe, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/components/theme-provider";

interface NotificationPrefs {
  notificationsEnabled: boolean;
  notificationTime: string;
  timezone: string;
}

interface SettingsViewProps {
  onClearCompleted?: () => void;
  onLogout?: () => void;
  onResendVerification?: () => void;
  onNotificationToggle?: (enabled: boolean) => void;
  onTimezoneChange?: (timezone: string) => void;
  onNotificationTimeChange?: (time: string) => void;
  completedCount?: number;
  userEmail?: string;
  emailVerified?: boolean;
  isResendingVerification?: boolean;
  notificationPrefs?: NotificationPrefs;
  isLoadingNotificationPrefs?: boolean;
  pushSupported?: boolean;
}

const COMMON_TIMEZONES = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Phoenix", label: "Arizona (AZ)" },
  { value: "America/Anchorage", label: "Alaska (AK)" },
  { value: "Pacific/Honolulu", label: "Hawaii (HI)" },
  { value: "Europe/London", label: "London (UK)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Europe/Berlin", label: "Berlin (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
];

const NOTIFICATION_TIMES = [
  { value: "06:00", label: "6:00 AM" },
  { value: "07:00", label: "7:00 AM" },
  { value: "08:00", label: "8:00 AM" },
  { value: "09:00", label: "9:00 AM" },
];

export function SettingsView({ 
  onClearCompleted, 
  onLogout, 
  onResendVerification,
  onNotificationToggle,
  onTimezoneChange,
  onNotificationTimeChange,
  completedCount = 0,
  userEmail,
  emailVerified = false,
  isResendingVerification = false,
  notificationPrefs,
  isLoadingNotificationPrefs = false,
  pushSupported = true,
}: SettingsViewProps) {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
  ] as const;

  return (
    <div className="space-y-6">
      <Card className="border-card-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = theme === option.value;
              return (
                <Button
                  key={option.value}
                  variant={isActive ? "default" : "outline"}
                  className="flex-1 gap-2"
                  onClick={() => setTheme(option.value)}
                  data-testid={`button-theme-${option.value}`}
                >
                  <Icon className="h-4 w-4" />
                  {option.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-card-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!pushSupported && (
            <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-md">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Push notifications are not supported in this browser. Try Chrome, Firefox, or Edge.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Daily Reminders</p>
                <p className="text-xs text-muted-foreground">Get reminded about tasks each morning</p>
              </div>
            </div>
            <Switch 
              checked={notificationPrefs?.notificationsEnabled || false}
              onCheckedChange={onNotificationToggle}
              disabled={!pushSupported || isLoadingNotificationPrefs}
              data-testid="switch-notifications" 
            />
          </div>
          
          {notificationPrefs?.notificationsEnabled && (
            <>
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Reminder Time</p>
                    <p className="text-xs text-muted-foreground">When to receive daily reminders</p>
                  </div>
                </div>
                <Select
                  value={notificationPrefs?.notificationTime || "07:00"}
                  onValueChange={onNotificationTimeChange}
                  disabled={isLoadingNotificationPrefs}
                >
                  <SelectTrigger className="w-28" data-testid="select-notification-time">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTIFICATION_TIMES.map((time) => (
                      <SelectItem key={time.value} value={time.value}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Timezone</p>
                    <p className="text-xs text-muted-foreground">Your local timezone for notifications</p>
                  </div>
                </div>
                <Select
                  value={notificationPrefs?.timezone || "UTC"}
                  onValueChange={onTimezoneChange}
                  disabled={isLoadingNotificationPrefs}
                >
                  <SelectTrigger className="w-44" data-testid="select-timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Sound Effects</p>
                <p className="text-xs text-muted-foreground">Play sounds on task completion</p>
              </div>
            </div>
            <Switch data-testid="switch-sounds" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-card-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trash2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Clear Completed Tasks</p>
                <p className="text-xs text-muted-foreground">
                  {completedCount > 0 
                    ? `${completedCount} completed task${completedCount > 1 ? 's' : ''}`
                    : 'No completed tasks'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearCompleted}
              disabled={completedCount === 0}
              className="text-destructive hover:text-destructive"
              data-testid="button-clear-completed"
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-card-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">About</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium">Chomper</p>
                <p className="text-xs text-muted-foreground">Version 1.0.0</p>
              </div>
              <p className="text-xs text-muted-foreground">
                The only to-do app that makes you want to complete tasks. 
                Feed your productivity monster and watch it grow!
              </p>
              <p className="text-xs text-primary font-medium">
                Chomp through your tasks!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-card-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {userEmail && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-xs text-muted-foreground">{userEmail}</p>
                  </div>
                </div>
                {emailVerified ? (
                  <div className="flex items-center gap-1 text-primary">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">Verified</span>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onResendVerification}
                    disabled={isResendingVerification}
                    data-testid="button-resend-verification"
                  >
                    {isResendingVerification ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Verify"
                    )}
                  </Button>
                )}
              </div>

              {!emailVerified && (
                <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-md">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Please verify your email to secure your account and enable password recovery.
                  </p>
                </div>
              )}

              <Separator />
            </>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LogOut className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Log Out</p>
                <p className="text-xs text-muted-foreground">Sign out of your account</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              data-testid="button-logout"
            >
              Log Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
