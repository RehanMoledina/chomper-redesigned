import { 
  type User, type InsertUser, 
  type Task, type InsertTask, type UpdateTask,
  type MonsterStats, type InsertMonsterStats,
  type Achievement, type InsertAchievement,
  users, tasks, monsterStats, achievements 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, isNotNull } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getTasks(): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: UpdateTask): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
  deleteCompletedTasks(): Promise<number>;
  
  getMonsterStats(): Promise<MonsterStats | undefined>;
  updateMonsterStats(stats: Partial<InsertMonsterStats>): Promise<MonsterStats>;
  
  getAchievements(): Promise<Achievement[]>;
  initializeAchievements(): Promise<void>;
  unlockAchievement(id: string): Promise<Achievement | undefined>;
  checkAndUnlockAchievements(stats: MonsterStats): Promise<Achievement[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getTasks(): Promise<Task[]> {
    const allTasks = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
    const now = new Date();
    
    // Filter out tasks that are scheduled for the future
    return allTasks.filter(task => {
      if (!task.scheduledFor) return true;
      return new Date(task.scheduledFor) <= now;
    });
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: string, taskUpdate: UpdateTask): Promise<Task | undefined> {
    const existingTask = await this.getTask(id);
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
      await this.incrementTasksChomped();
      
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
        nextDate = new Date(baseDate);
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case "weekly":
        nextDate = new Date(baseDate);
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case "monthly":
        nextDate = new Date(baseDate);
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      default:
        return undefined;
    }

    // Set scheduledFor to midnight (00:00:00) of the next due date
    // This ensures the task only appears at 12:00 AM on that day
    const scheduledFor = new Date(nextDate);
    scheduledFor.setHours(0, 0, 0, 0);

    const [newTask] = await db
      .insert(tasks)
      .values({
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

  async deleteTask(id: string): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id)).returning();
    return result.length > 0;
  }

  async deleteCompletedTasks(): Promise<number> {
    const result = await db
      .delete(tasks)
      .where(eq(tasks.completed, true))
      .returning();
    return result.length;
  }

  async getMonsterStats(): Promise<MonsterStats | undefined> {
    const [stats] = await db.select().from(monsterStats);
    
    if (!stats) {
      const [newStats] = await db
        .insert(monsterStats)
        .values({
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

  async updateMonsterStats(updates: Partial<InsertMonsterStats>): Promise<MonsterStats> {
    let stats = await this.getMonsterStats();
    
    if (!stats) {
      const [newStats] = await db
        .insert(monsterStats)
        .values({
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

  private async incrementTasksChomped(): Promise<void> {
    const stats = await this.getMonsterStats();
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

  async getAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements);
  }

  async initializeAchievements(): Promise<void> {
    const existing = await db.select().from(achievements);
    if (existing.length > 0) return;

    const defaultAchievements: InsertAchievement[] = [
      { id: "first_chomp", name: "First Bite", description: "Complete your first task", icon: "cookie", requirement: 1, type: "tasks_chomped" },
      { id: "chomp_10", name: "Getting Hungry", description: "Complete 10 tasks", icon: "utensils", requirement: 10, type: "tasks_chomped" },
      { id: "chomp_25", name: "Appetite Growing", description: "Complete 25 tasks", icon: "chef-hat", requirement: 25, type: "tasks_chomped" },
      { id: "chomp_50", name: "Hungry Monster", description: "Complete 50 tasks", icon: "drumstick", requirement: 50, type: "tasks_chomped" },
      { id: "chomp_100", name: "Feast Master", description: "Complete 100 tasks", icon: "crown", requirement: 100, type: "tasks_chomped" },
      { id: "streak_3", name: "Hat Trick", description: "Maintain a 3-day streak", icon: "flame", requirement: 3, type: "streak" },
      { id: "streak_7", name: "Week Warrior", description: "Maintain a 7-day streak", icon: "zap", requirement: 7, type: "streak" },
      { id: "streak_14", name: "Fortnight Fighter", description: "Maintain a 14-day streak", icon: "star", requirement: 14, type: "streak" },
      { id: "streak_30", name: "Monthly Master", description: "Maintain a 30-day streak", icon: "trophy", requirement: 30, type: "streak" },
      { id: "happiness_75", name: "Joyful Journey", description: "Reach 75% happiness", icon: "heart", requirement: 75, type: "happiness" },
      { id: "happiness_100", name: "Pure Bliss", description: "Reach 100% happiness", icon: "sparkles", requirement: 100, type: "happiness" },
    ];

    await db.insert(achievements).values(defaultAchievements);
  }

  async unlockAchievement(id: string): Promise<Achievement | undefined> {
    const [achievement] = await db.select().from(achievements).where(eq(achievements.id, id));
    if (!achievement || achievement.unlockedAt) return undefined;

    const [updated] = await db
      .update(achievements)
      .set({ unlockedAt: new Date() })
      .where(eq(achievements.id, id))
      .returning();
    
    return updated;
  }

  async checkAndUnlockAchievements(stats: MonsterStats): Promise<Achievement[]> {
    const allAchievements = await this.getAchievements();
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
        const unlocked = await this.unlockAchievement(achievement.id);
        if (unlocked) newlyUnlocked.push(unlocked);
      }
    }

    return newlyUnlocked;
  }
}

export const storage = new DatabaseStorage();
