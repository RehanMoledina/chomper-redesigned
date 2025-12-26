import { sendDailyNotificationsForTimezone } from './push-notifications';
import { storage } from './storage';
import { startOfDay, isMonday } from 'date-fns';

let cronInterval: NodeJS.Timeout | null = null;

async function regenerateRecurringTasks(): Promise<void> {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Only run at midnight (00:00)
  if (currentHour !== 0 || currentMinute !== 0) {
    return;
  }
  
  console.log('Running recurring task regeneration at midnight');
  
  try {
    const templates = await storage.getTemplatesNeedingRegeneration();
    const today = startOfDay(now);
    const dayOfMonth = now.getDate();
    const isMondayToday = isMonday(now);
    
    for (const template of templates) {
      try {
        // Check if there's already an active (incomplete) task for this template
        const activeTask = await storage.getActiveTaskForTemplate(template.id, template.userId);
        if (activeTask) {
          // Already has an active task, skip regeneration
          continue;
        }
        
        // Guard against double-generation in the same day
        if (template.lastGeneratedAt) {
          const lastGenDate = startOfDay(new Date(template.lastGeneratedAt));
          if (lastGenDate.getTime() >= today.getTime()) {
            // Already generated today, skip
            continue;
          }
        }
        
        let shouldGenerate = false;
        
        if (template.recurringPattern === 'daily') {
          // Daily tasks: regenerate every day at midnight
          shouldGenerate = true;
        } else if (template.recurringPattern === 'weekly') {
          // Weekly tasks: regenerate on Mondays at midnight
          shouldGenerate = isMondayToday;
        } else if (template.recurringPattern === 'monthly') {
          // Monthly tasks: regenerate on the 1st of the month at midnight
          shouldGenerate = dayOfMonth === 1;
        }
        
        if (shouldGenerate) {
          await storage.generateTaskFromTemplate(template, today);
          console.log(`Generated recurring task for template: ${template.title}`);
        }
      } catch (error) {
        console.error(`Error regenerating task for template ${template.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in recurring task regeneration:', error);
  }
}

export function startNotificationCron(): void {
  if (cronInterval) {
    console.log('Notification cron already running');
    return;
  }

  console.log('Starting notification cron job (checks every minute for all timezones)');

  cronInterval = setInterval(async () => {
    try {
      await sendDailyNotificationsForTimezone();
      await regenerateRecurringTasks();
    } catch (error) {
      console.error('Error in cron job:', error);
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
