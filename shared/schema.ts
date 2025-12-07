import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
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
  scheduledFor: timestamp("scheduled_for"),
});

export const monsterStats = pgTable("monster_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  tasksChomped: integer("tasks_chomped").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastActiveDate: timestamp("last_active_date"),
  happinessLevel: integer("happiness_level").notNull().default(50),
});

export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id"),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  requirement: integer("requirement").notNull(),
  type: text("type").notNull(),
  unlockedAt: timestamp("unlocked_at"),
});

const dateTransform = z.union([
  z.date(),
  z.string().transform((str) => str ? new Date(str) : null),
  z.null(),
]).optional();

export const insertTaskSchema = createInsertSchema(tasks, {
  dueDate: dateTransform,
  nextDueDate: dateTransform,
  scheduledFor: dateTransform,
}).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const updateTaskSchema = createInsertSchema(tasks, {
  dueDate: dateTransform,
  completedAt: dateTransform,
  nextDueDate: dateTransform,
  scheduledFor: dateTransform,
}).omit({
  id: true,
  userId: true,
  createdAt: true,
}).partial();

export const insertMonsterStatsSchema = createInsertSchema(monsterStats).omit({
  id: true,
});

export const updateMonsterStatsSchema = createInsertSchema(monsterStats).omit({
  id: true,
  userId: true,
}).partial();

export const insertAchievementSchema = createInsertSchema(achievements);
export const updateAchievementSchema = createInsertSchema(achievements).partial();

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type MonsterStats = typeof monsterStats.$inferSelect;
export type InsertMonsterStats = z.infer<typeof insertMonsterStatsSchema>;
export type UpdateMonsterStats = z.infer<typeof updateMonsterStatsSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
