import { sendDailyNotificationsForTimezone } from './push-notifications';

let cronInterval: NodeJS.Timeout | null = null;

export function startNotificationCron(): void {
  if (cronInterval) {
    console.log('Notification cron already running');
    return;
  }

  console.log('Starting notification cron job (checks every minute)');

  cronInterval = setInterval(async () => {
    const now = new Date();
    
    if (now.getMinutes() === 0) {
      console.log(`[${now.toISOString()}] Running notification check for current hour`);
      try {
        await sendDailyNotificationsForTimezone();
      } catch (error) {
        console.error('Error in notification cron:', error);
      }
    }
  }, 60 * 1000);

  const now = new Date();
  if (now.getMinutes() === 0) {
    sendDailyNotificationsForTimezone().catch(console.error);
  }
}

export function stopNotificationCron(): void {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
    console.log('Stopped notification cron job');
  }
}
