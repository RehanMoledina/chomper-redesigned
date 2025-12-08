import { sendDailyNotificationsForTimezone } from './push-notifications';

let cronInterval: NodeJS.Timeout | null = null;

export function startNotificationCron(): void {
  if (cronInterval) {
    console.log('Notification cron already running');
    return;
  }

  console.log('Starting notification cron job (checks every minute for all timezones)');

  cronInterval = setInterval(async () => {
    try {
      await sendDailyNotificationsForTimezone();
    } catch (error) {
      console.error('Error in notification cron:', error);
    }
  }, 60 * 1000);

  sendDailyNotificationsForTimezone().catch(console.error);
}

export function stopNotificationCron(): void {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
    console.log('Stopped notification cron job');
  }
}
