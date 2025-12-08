import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for email/password auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  emailVerified: boolean("email_verified").notNull().default(false),
  notificationsEnabled: boolean("notifications_enabled").notNull().default(false),
  notificationTime: varchar("notification_time").default("07:00"),
  timezone: varchar("timezone").default("UTC"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Push subscriptions table for web push notifications
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Auth schemas
export const registerSchema = createInsertSchema(users, {
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
}).omit({
  id: true,
  profileImageUrl: true,
  emailVerified: true,
  notificationsEnabled: true,
  notificationTime: true,
  timezone: true,
  createdAt: true,
  updatedAt: true,
});

// Push subscription schemas
export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({
  id: true,
  createdAt: true,
});

export const updateNotificationPrefsSchema = z.object({
  notificationsEnabled: z.boolean().optional(),
  notificationTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)").optional(),
  timezone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  usedAt: timestamp("used_at"),
});

// Email verification tokens table
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  usedAt: timestamp("used_at"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;

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
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type UpdateNotificationPrefs = z.infer<typeof updateNotificationPrefsSchema>;
