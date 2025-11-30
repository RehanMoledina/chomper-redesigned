import { 
  type User, type InsertUser, 
  type Task, type InsertTask, type UpdateTask,
  type MonsterStats, type InsertMonsterStats,
  users, tasks, monsterStats 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

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
    return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
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
    }
    
    return updated || undefined;
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
}

export const storage = new DatabaseStorage();
