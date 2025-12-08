import { 
  type User, type UpsertUser, 
  type Task, type InsertTask, type UpdateTask,
  type MonsterStats, type InsertMonsterStats,
  type Achievement, type InsertAchievement,
  type PasswordResetToken, type EmailVerificationToken,
  type PushSubscription, type InsertPushSubscription, type UpdateNotificationPrefs,
  type DeviceToken, type InsertDeviceToken,
  users, tasks, monsterStats, achievements, passwordResetTokens, emailVerificationTokens, pushSubscriptions, deviceTokens 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, lt, isNotNull } from "drizzle-orm";
import crypto from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: { email: string; password: string; firstName: string | null; lastName: string | null }): Promise<User>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<boolean>;
  verifyUserEmail(userId: string): Promise<boolean>;
  
  createPasswordResetToken(userId: string): Promise<string>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markTokenAsUsed(tokenId: string): Promise<void>;
  cleanupExpiredTokens(): Promise<void>;
  
  createEmailVerificationToken(userId: string): Promise<string>;
  getEmailVerificationToken(token: string): Promise<EmailVerificationToken | undefined>;
  markVerificationTokenAsUsed(tokenId: string): Promise<void>;
  
  getTasks(userId: string): Promise<Task[]>;
  getTask(id: string, userId: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: UpdateTask, userId: string): Promise<Task | undefined>;
  deleteTask(id: string, userId: string): Promise<boolean>;
  deleteCompletedTasks(userId: string): Promise<number>;
  
  getMonsterStats(userId: string): Promise<MonsterStats | undefined>;
  updateMonsterStats(userId: string, stats: Partial<InsertMonsterStats>): Promise<MonsterStats>;
  
  getAchievements(userId: string): Promise<Achievement[]>;
  initializeAchievements(userId: string): Promise<void>;
  unlockAchievement(id: string, oderId: string): Promise<Achievement | undefined>;
  checkAndUnlockAchievements(userId: string, stats: MonsterStats): Promise<Achievement[]>;
  
  // Push notifications
  savePushSubscription(userId: string, subscription: { endpoint: string; p256dh: string; auth: string }): Promise<PushSubscription>;
  getPushSubscriptions(userId: string): Promise<PushSubscription[]>;
  deletePushSubscription(endpoint: string): Promise<boolean>;
  updateNotificationPrefs(userId: string, prefs: UpdateNotificationPrefs): Promise<User | undefined>;
  getUsersWithNotificationsEnabled(): Promise<User[]>;
  getTasksDueTodayForUser(userId: string, timezone: string): Promise<Task[]>;
  
  // Native device tokens (FCM/APNs)
  saveDeviceToken(userId: string, token: string, platform: 'android' | 'ios'): Promise<DeviceToken>;
  getDeviceTokens(userId: string): Promise<DeviceToken[]>;
  deleteDeviceToken(token: string): Promise<boolean>;
  getAllDeviceTokensForNotifications(): Promise<{ userId: string; token: string; platform: string }[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(userData: { email: string; password: string; firstName: string | null; lastName: string | null }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return result.length > 0;
  }

  async createPasswordResetToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    
    await db.insert(passwordResetTokens).values({
      userId,
      token: tokenHash, // Store hashed token, not plaintext
      expiresAt,
    });
    
    return token; // Return plaintext token for email
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    // Hash the incoming token and compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, tokenHash));
    return resetToken || undefined;
  }

  async markTokenAsUsed(tokenId: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, tokenId));
  }

  async cleanupExpiredTokens(): Promise<void> {
    await db
      .delete(passwordResetTokens)
      .where(lt(passwordResetTokens.expiresAt, new Date()));
    await db
      .delete(emailVerificationTokens)
      .where(lt(emailVerificationTokens.expiresAt, new Date()));
  }

  async verifyUserEmail(userId: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return result.length > 0;
  }

  async createEmailVerificationToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    await db.insert(emailVerificationTokens).values({
      userId,
      token: tokenHash,
      expiresAt,
    });
    
    return token;
  }

  async getEmailVerificationToken(token: string): Promise<EmailVerificationToken | undefined> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const [verificationToken] = await db
      .select()
      .from(emailVerificationTokens)
      .where(eq(emailVerificationTokens.token, tokenHash));
    return verificationToken || undefined;
  }

  async markVerificationTokenAsUsed(tokenId: string): Promise<void> {
    await db
      .update(emailVerificationTokens)
      .set({ usedAt: new Date() })
      .where(eq(emailVerificationTokens.id, tokenId));
  }

  async getTasks(userId: string): Promise<Task[]> {
    const allTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt));
    const now = new Date();
    
    return allTasks.filter(task => {
      if (!task.scheduledFor) return true;
      return new Date(task.scheduledFor) <= now;
    });
  }

  async getTask(id: string, userId: string): Promise<Task | undefined> {
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    return task || undefined;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: string, taskUpdate: UpdateTask, userId: string): Promise<Task | undefined> {
    const existingTask = await this.getTask(id, userId);
    if (!existingTask) return undefined;

    const updateData: Record<string, unknown> = { ...taskUpdate };
    
    if (taskUpdate.completed === true) {
      updateData.completedAt = new Date();
    }
    
    const [updated] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();
    
    if (updated && taskUpdate.completed === true) {
      await this.incrementTasksChomped(userId);
      
      if (existingTask.isRecurring && existingTask.recurringPattern) {
        await this.createNextRecurringTask(existingTask);
      }
    }
    
    return updated || undefined;
  }

  private async createNextRecurringTask(task: Task): Promise<Task | undefined> {
    const baseDate = task.dueDate ? new Date(task.dueDate) : new Date();
    let nextDate: Date;

    switch (task.recurringPattern) {
      case "daily":
        // Daily: next day at midnight
        nextDate = new Date(baseDate);
        nextDate.setDate(nextDate.getDate() + 1);
        nextDate.setHours(0, 0, 0, 0);
        break;
      case "weekly":
        // Weekly: next Monday at midnight
        nextDate = new Date(baseDate);
        const dayOfWeek = nextDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        // Calculate days until next Monday
        // If today is Monday (1), add 7 days to get next Monday
        // Otherwise, add days to reach next Monday
        const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
        nextDate.setDate(nextDate.getDate() + daysUntilMonday);
        nextDate.setHours(0, 0, 0, 0);
        break;
      case "monthly":
        // Monthly: 1st of the following month at midnight
        nextDate = new Date(baseDate);
        nextDate.setMonth(nextDate.getMonth() + 1);
        nextDate.setDate(1);
        nextDate.setHours(0, 0, 0, 0);
        break;
      default:
        return undefined;
    }

    const scheduledFor = new Date(nextDate);

    const [newTask] = await db
      .insert(tasks)
      .values({
        userId: task.userId,
        title: task.title,
        category: task.category,
        notes: task.notes,
        priority: task.priority,
        dueDate: nextDate,
        isRecurring: true,
        recurringPattern: task.recurringPattern,
        scheduledFor: scheduledFor,
      })
      .returning();

    return newTask;
  }

  async deleteTask(id: string, userId: string): Promise<boolean> {
    const task = await this.getTask(id, userId);
    if (!task) return false;
    
    const result = await db.delete(tasks).where(eq(tasks.id, id)).returning();
    return result.length > 0;
  }

  async deleteCompletedTasks(userId: string): Promise<number> {
    const result = await db
      .delete(tasks)
      .where(and(eq(tasks.completed, true), eq(tasks.userId, userId)))
      .returning();
    return result.length;
  }

  async getMonsterStats(userId: string): Promise<MonsterStats | undefined> {
    const [stats] = await db
      .select()
      .from(monsterStats)
      .where(eq(monsterStats.userId, userId));
    
    if (!stats) {
      const [newStats] = await db
        .insert(monsterStats)
        .values({
          userId,
          tasksChomped: 0,
          currentStreak: 0,
          longestStreak: 0,
          happinessLevel: 50,
        })
        .returning();
      return newStats;
    }
    
    return stats;
  }

  async updateMonsterStats(userId: string, updates: Partial<InsertMonsterStats>): Promise<MonsterStats> {
    let stats = await this.getMonsterStats(userId);
    
    if (!stats) {
      const [newStats] = await db
        .insert(monsterStats)
        .values({
          userId,
          tasksChomped: 0,
          currentStreak: 0,
          longestStreak: 0,
          happinessLevel: 50,
          ...updates,
        })
        .returning();
      return newStats;
    }

    const [updated] = await db
      .update(monsterStats)
      .set(updates)
      .where(eq(monsterStats.id, stats.id))
      .returning();
    
    return updated;
  }

  private async incrementTasksChomped(userId: string): Promise<void> {
    const stats = await this.getMonsterStats(userId);
    if (!stats) return;

    const today = new Date();
    const lastActive = stats.lastActiveDate ? new Date(stats.lastActiveDate) : null;
    
    let newStreak = stats.currentStreak;
    
    if (lastActive) {
      const diffDays = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) {
      } else if (diffDays === 1) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    const newLongestStreak = Math.max(stats.longestStreak, newStreak);
    const newHappiness = Math.min(100, stats.happinessLevel + 5);

    await db
      .update(monsterStats)
      .set({
        tasksChomped: stats.tasksChomped + 1,
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastActiveDate: today,
        happinessLevel: newHappiness,
      })
      .where(eq(monsterStats.id, stats.id));
  }

  async getAchievements(userId: string): Promise<Achievement[]> {
    return await db
      .select()
      .from(achievements)
      .where(eq(achievements.userId, userId));
  }

  async initializeAchievements(userId: string): Promise<void> {
    const existing = await this.getAchievements(userId);
    if (existing.length > 0) return;

    const defaultAchievements: InsertAchievement[] = [
      { id: `${userId}_first_chomp`, userId, name: "First Bite", description: "Complete your first task", icon: "cookie", requirement: 1, type: "tasks_chomped" },
      { id: `${userId}_chomp_10`, userId, name: "Getting Hungry", description: "Complete 10 tasks", icon: "utensils", requirement: 10, type: "tasks_chomped" },
      { id: `${userId}_chomp_25`, userId, name: "Appetite Growing", description: "Complete 25 tasks", icon: "chef-hat", requirement: 25, type: "tasks_chomped" },
      { id: `${userId}_chomp_50`, userId, name: "Hungry Monster", description: "Complete 50 tasks", icon: "drumstick", requirement: 50, type: "tasks_chomped" },
      { id: `${userId}_chomp_100`, userId, name: "Feast Master", description: "Complete 100 tasks", icon: "crown", requirement: 100, type: "tasks_chomped" },
      { id: `${userId}_streak_3`, userId, name: "Hat Trick", description: "Maintain a 3-day streak", icon: "flame", requirement: 3, type: "streak" },
      { id: `${userId}_streak_7`, userId, name: "Week Warrior", description: "Maintain a 7-day streak", icon: "zap", requirement: 7, type: "streak" },
      { id: `${userId}_streak_14`, userId, name: "Fortnight Fighter", description: "Maintain a 14-day streak", icon: "star", requirement: 14, type: "streak" },
      { id: `${userId}_streak_30`, userId, name: "Monthly Master", description: "Maintain a 30-day streak", icon: "trophy", requirement: 30, type: "streak" },
      { id: `${userId}_happiness_75`, userId, name: "Joyful Journey", description: "Reach 75% happiness", icon: "heart", requirement: 75, type: "happiness" },
      { id: `${userId}_happiness_100`, userId, name: "Pure Bliss", description: "Reach 100% happiness", icon: "sparkles", requirement: 100, type: "happiness" },
    ];

    await db.insert(achievements).values(defaultAchievements);
  }

  async unlockAchievement(id: string, userId: string): Promise<Achievement | undefined> {
    const [achievement] = await db
      .select()
      .from(achievements)
      .where(and(eq(achievements.id, id), eq(achievements.userId, userId)));
    if (!achievement || achievement.unlockedAt) return undefined;

    const [updated] = await db
      .update(achievements)
      .set({ unlockedAt: new Date() })
      .where(eq(achievements.id, id))
      .returning();
    
    return updated;
  }

  async checkAndUnlockAchievements(userId: string, stats: MonsterStats): Promise<Achievement[]> {
    const allAchievements = await this.getAchievements(userId);
    const newlyUnlocked: Achievement[] = [];

    for (const achievement of allAchievements) {
      if (achievement.unlockedAt) continue;

      let shouldUnlock = false;

      switch (achievement.type) {
        case "tasks_chomped":
          shouldUnlock = stats.tasksChomped >= achievement.requirement;
          break;
        case "streak":
          shouldUnlock = stats.longestStreak >= achievement.requirement;
          break;
        case "happiness":
          shouldUnlock = stats.happinessLevel >= achievement.requirement;
          break;
      }

      if (shouldUnlock) {
        const unlocked = await this.unlockAchievement(achievement.id, userId);
        if (unlocked) newlyUnlocked.push(unlocked);
      }
    }

    return newlyUnlocked;
  }

  async savePushSubscription(userId: string, subscription: { endpoint: string; p256dh: string; auth: string }): Promise<PushSubscription> {
    // Delete any existing subscription with this endpoint first
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, subscription.endpoint));
    
    const [sub] = await db
      .insert(pushSubscriptions)
      .values({
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      })
      .returning();
    return sub;
  }

  async getPushSubscriptions(userId: string): Promise<PushSubscription[]> {
    return await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));
  }

  async deletePushSubscription(endpoint: string): Promise<boolean> {
    const result = await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint))
      .returning();
    return result.length > 0;
  }

  async updateNotificationPrefs(userId: string, prefs: UpdateNotificationPrefs): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...prefs, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async getUsersWithNotificationsEnabled(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.notificationsEnabled, true));
  }

  async getTasksDueTodayForUser(userId: string, timezone: string): Promise<Task[]> {
    // Get all incomplete tasks for user
    const allTasks = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.completed, false)));
    
    // Filter to tasks due today in user's timezone
    const now = new Date();
    const userNow = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    const todayStart = new Date(userNow);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(userNow);
    todayEnd.setHours(23, 59, 59, 999);
    
    return allTasks.filter(task => {
      if (!task.dueDate) return true; // Tasks without due date are always relevant
      const taskDue = new Date(task.dueDate);
      return taskDue >= todayStart && taskDue <= todayEnd;
    });
  }

  async saveDeviceToken(userId: string, token: string, platform: 'android' | 'ios'): Promise<DeviceToken> {
    // Try to update existing token, otherwise insert
    const existing = await db
      .select()
      .from(deviceTokens)
      .where(eq(deviceTokens.token, token));
    
    if (existing.length > 0) {
      const [updated] = await db
        .update(deviceTokens)
        .set({ userId, platform, updatedAt: new Date() })
        .where(eq(deviceTokens.token, token))
        .returning();
      return updated;
    }
    
    const [deviceToken] = await db
      .insert(deviceTokens)
      .values({ userId, token, platform })
      .returning();
    return deviceToken;
  }

  async getDeviceTokens(userId: string): Promise<DeviceToken[]> {
    return await db
      .select()
      .from(deviceTokens)
      .where(eq(deviceTokens.userId, userId));
  }

  async deleteDeviceToken(token: string): Promise<boolean> {
    const result = await db
      .delete(deviceTokens)
      .where(eq(deviceTokens.token, token))
      .returning();
    return result.length > 0;
  }

  async getAllDeviceTokensForNotifications(): Promise<{ userId: string; token: string; platform: string }[]> {
    // Join with users to filter by notification enabled
    const results = await db
      .select({
        userId: deviceTokens.userId,
        token: deviceTokens.token,
        platform: deviceTokens.platform,
      })
      .from(deviceTokens)
      .innerJoin(users, eq(deviceTokens.userId, users.id))
      .where(eq(users.notificationsEnabled, true));
    
    return results;
  }
}

export const storage = new DatabaseStorage();
