import webpush from 'web-push';
import admin from 'firebase-admin';
import { storage } from './storage';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:chomper@example.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

let firebaseInitialized = false;
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;

if (FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firebaseInitialized = true;
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
  }
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

function getNotificationContent(taskCount: number): { title: string; body: string } {
  if (taskCount === 0) {
    return {
      title: "Good Morning!",
      body: getRandomMessage(restDayMessages),
    };
  } else if (taskCount === 1) {
    return {
      title: "1 Task Today!",
      body: getRandomMessage(motivationalMessages),
    };
  } else {
    return {
      title: `${taskCount} Tasks Today!`,
      body: getRandomMessage(motivationalMessages),
    };
  }
}

async function sendWebPushNotification(userId: string, title: string, body: string): Promise<number> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return 0;
  }

  const subscriptions = await storage.getPushSubscriptions(userId);
  if (subscriptions.length === 0) {
    return 0;
  }

  const payload = JSON.stringify({ title, body, url: '/' });
  
  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
        return { success: true };
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          await storage.deletePushSubscription(sub.endpoint);
        }
        return { success: false };
      }
    })
  );

  return results.filter((r) => r.status === 'fulfilled' && (r.value as any).success).length;
}

async function sendFCMNotification(userId: string, title: string, body: string): Promise<number> {
  if (!firebaseInitialized) {
    return 0;
  }

  const deviceTokens = await storage.getDeviceTokens(userId);
  if (deviceTokens.length === 0) {
    return 0;
  }

  let successCount = 0;

  for (const deviceToken of deviceTokens) {
    try {
      await admin.messaging().send({
        token: deviceToken.token,
        notification: {
          title,
          body,
        },
        data: {
          url: '/',
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'chomper_daily_reminder',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      });
      successCount++;
    } catch (error: any) {
      if (
        error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered'
      ) {
        await storage.deleteDeviceToken(deviceToken.token);
        console.log(`Removed invalid FCM token for user ${userId}`);
      } else {
        console.error(`FCM send error for user ${userId}:`, error.message);
      }
    }
  }

  return successCount;
}

export async function sendDailyNotification(userId: string): Promise<boolean> {
  const user = await storage.getUser(userId);
  if (!user || !user.notificationsEnabled) {
    return false;
  }

  const timezone = user.timezone || 'UTC';
  const tasks = await storage.getTasksDueTodayForUser(userId, timezone);
  const { title, body } = getNotificationContent(tasks.length);

  const webPushCount = await sendWebPushNotification(userId, title, body);
  const fcmCount = await sendFCMNotification(userId, title, body);

  return webPushCount > 0 || fcmCount > 0;
}

export async function sendDailyNotificationsForTimezone(): Promise<void> {
  const hasWebPush = VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY;
  const hasFCM = firebaseInitialized;

  if (!hasWebPush && !hasFCM) {
    return;
  }

  const usersWithNotifications = await storage.getUsersWithNotificationsEnabled();
  
  for (const user of usersWithNotifications) {
    const timezone = user.timezone || 'UTC';
    const notificationTime = user.notificationTime || '07:00';
    const [targetHourStr, targetMinuteStr] = notificationTime.split(':');
    const targetHour = parseInt(targetHourStr, 10);
    const targetMinute = parseInt(targetMinuteStr || '0', 10);

    const now = new Date();
    const userNow = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const currentHour = userNow.getHours();
    const currentMinute = userNow.getMinutes();

    if (currentHour === targetHour && currentMinute === targetMinute) {
      try {
        await sendDailyNotification(user.id);
        console.log(`Sent daily notification to user ${user.id} at ${notificationTime} ${timezone}`);
      } catch (error) {
        console.error(`Failed to send notification to user ${user.id}:`, error);
      }
    }
  }
}
