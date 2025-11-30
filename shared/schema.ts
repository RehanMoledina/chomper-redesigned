import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  category: text("category").default("personal"),
  notes: text("notes"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  completedAt: timestamp("completed_at"),
  priority: text("priority").default("medium"),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurringPattern: text("recurring_pattern"),
  nextDueDate: timestamp("next_due_date"),
});

export const monsterStats = pgTable("monster_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tasksChomped: integer("tasks_chomped").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastActiveDate: timestamp("last_active_date"),
  happinessLevel: integer("happiness_level").notNull().default(50),
});

export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  requirement: integer("requirement").notNull(),
  type: text("type").notNull(),
  unlockedAt: timestamp("unlocked_at"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

const dateTransform = z.union([
  z.date(),
  z.string().transform((str) => str ? new Date(str) : null),
  z.null(),
]).optional();

export const insertTaskSchema = createInsertSchema(tasks, {
  dueDate: dateTransform,
  nextDueDate: dateTransform,
}).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const updateTaskSchema = createInsertSchema(tasks, {
  dueDate: dateTransform,
  completedAt: dateTransform,
  nextDueDate: dateTransform,
}).omit({
  id: true,
  createdAt: true,
}).partial();

export const insertMonsterStatsSchema = createInsertSchema(monsterStats).omit({
  id: true,
});

export const updateMonsterStatsSchema = createInsertSchema(monsterStats).omit({
  id: true,
}).partial();

export const insertAchievementSchema = createInsertSchema(achievements);
export const updateAchievementSchema = createInsertSchema(achievements).partial();

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type MonsterStats = typeof monsterStats.$inferSelect;
export type InsertMonsterStats = z.infer<typeof insertMonsterStatsSchema>;
export type UpdateMonsterStats = z.infer<typeof updateMonsterStatsSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
