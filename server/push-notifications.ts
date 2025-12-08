import webpush from 'web-push';
import { storage } from './storage';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:chomper@example.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

const motivationalMessages = [
  "Let's chomp through your tasks today!",
  "Your monster is hungry for completed tasks!",
  "Time to be productive and feed Chomper!",
  "Ready to crush it? Your tasks are waiting!",
  "Another day, another chance to be awesome!",
  "Let's make today count - Chomper believes in you!",
  "Rise and grind! Your monster needs feeding!",
  "Today is a fresh start - let's get chomping!",
];

const restDayMessages = [
  "No tasks today! Maybe add some or enjoy a well-deserved rest.",
  "Your task list is clear! Take it easy or plan something new.",
  "Chomper's taking a nap - no tasks to chomp today!",
  "Empty to-do list? Either you're super organized or it's rest day!",
  "Nothing on the agenda - treat yourself today!",
  "All clear! Enjoy the freedom or plan your next adventure.",
];

function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

export async function sendDailyNotification(userId: string): Promise<boolean> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.error('VAPID keys not configured');
    return false;
  }

  const user = await storage.getUser(userId);
  if (!user || !user.notificationsEnabled) {
    return false;
  }

  const timezone = user.timezone || 'UTC';
  const tasks = await storage.getTasksDueTodayForUser(userId, timezone);
  const subscriptions = await storage.getPushSubscriptions(userId);

  if (subscriptions.length === 0) {
    return false;
  }

  const incompleteTaskCount = tasks.length;
  
  let title: string;
  let body: string;

  if (incompleteTaskCount === 0) {
    title = "Good Morning!";
    body = getRandomMessage(restDayMessages);
  } else if (incompleteTaskCount === 1) {
    title = "1 Task Today!";
    body = getRandomMessage(motivationalMessages);
  } else {
    title = `${incompleteTaskCount} Tasks Today!`;
    body = getRandomMessage(motivationalMessages);
  }

  const payload = JSON.stringify({
    title,
    body,
    url: '/',
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        );
        return { success: true, endpoint: sub.endpoint };
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          await storage.deletePushSubscription(sub.endpoint);
          console.log(`Removed invalid subscription: ${sub.endpoint}`);
        }
        return { success: false, endpoint: sub.endpoint, error: error.message };
      }
    })
  );

  const successCount = results.filter(
    (r) => r.status === 'fulfilled' && (r.value as any).success
  ).length;

  return successCount > 0;
}

export async function sendDailyNotificationsForTimezone(targetHour: number = 7): Promise<void> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.log('VAPID keys not configured, skipping notifications');
    return;
  }

  const usersWithNotifications = await storage.getUsersWithNotificationsEnabled();
  
  for (const user of usersWithNotifications) {
    const timezone = user.timezone || 'UTC';
    const notificationTime = user.notificationTime || '07:00';
    const [targetHourStr] = notificationTime.split(':');
    const userTargetHour = parseInt(targetHourStr, 10);

    const now = new Date();
    const userNow = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const currentHour = userNow.getHours();

    if (currentHour === userTargetHour) {
      try {
        await sendDailyNotification(user.id);
        console.log(`Sent daily notification to user ${user.id}`);
      } catch (error) {
        console.error(`Failed to send notification to user ${user.id}:`, error);
      }
    }
  }
}
