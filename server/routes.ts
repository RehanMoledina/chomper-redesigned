import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTaskSchema, updateTaskSchema, updateMonsterStatsSchema, updateNotificationPrefsSchema, insertDeviceTokenSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./auth";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Set up authentication
  await setupAuth(app);

  // Task routes - all protected
  app.get("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const tasks = await storage.getTasks(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const task = await storage.getTask(req.params.id, userId);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      res.status(500).json({ error: "Failed to fetch task" });
    }
  });

  app.post("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const parsed = insertTaskSchema.safeParse({ ...req.body, userId });
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid task data", details: parsed.error.issues });
      }
      
      const task = await storage.createTask(parsed.data);
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const parsed = updateTaskSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid task data", details: parsed.error.issues });
      }
      
      const task = await storage.updateTask(req.params.id, parsed.data, userId);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/completed", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const count = await storage.deleteCompletedTasks(userId);
      res.json({ deleted: count });
    } catch (error) {
      console.error("Error deleting completed tasks:", error);
      res.status(500).json({ error: "Failed to delete completed tasks" });
    }
  });

  app.delete("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const deleted = await storage.deleteTask(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // Stats routes - protected
  app.get("/api/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const stats = await storage.getMonsterStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.patch("/api/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const parsed = updateMonsterStatsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid stats data", details: parsed.error.issues });
      }
      
      const stats = await storage.updateMonsterStats(userId, parsed.data);
      res.json(stats);
    } catch (error) {
      console.error("Error updating stats:", error);
      res.status(500).json({ error: "Failed to update stats" });
    }
  });

  // Achievements routes - protected
  app.get("/api/achievements", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      await storage.initializeAchievements(userId);
      const achievementsList = await storage.getAchievements(userId);
      res.json(achievementsList);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });

  app.post("/api/achievements/check", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const stats = await storage.getMonsterStats(userId);
      if (!stats) {
        return res.status(404).json({ error: "Stats not found" });
      }
      const newlyUnlocked = await storage.checkAndUnlockAchievements(userId, stats);
      res.json({ newlyUnlocked });
    } catch (error) {
      console.error("Error checking achievements:", error);
      res.status(500).json({ error: "Failed to check achievements" });
    }
  });

  // Push notification routes
  const pushSubscriptionSchema = z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  });

  app.post("/api/push/subscribe", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const parsed = pushSubscriptionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid subscription data", details: parsed.error.issues });
      }

      const subscription = await storage.savePushSubscription(userId, {
        endpoint: parsed.data.endpoint,
        p256dh: parsed.data.keys.p256dh,
        auth: parsed.data.keys.auth,
      });
      
      res.status(201).json({ message: "Subscription saved", id: subscription.id });
    } catch (error) {
      console.error("Error saving push subscription:", error);
      res.status(500).json({ error: "Failed to save subscription" });
    }
  });

  app.delete("/api/push/subscribe", isAuthenticated, async (req: any, res) => {
    try {
      const { endpoint } = req.body;
      if (!endpoint) {
        return res.status(400).json({ error: "Endpoint is required" });
      }

      await storage.deletePushSubscription(endpoint);
      res.json({ message: "Subscription removed" });
    } catch (error) {
      console.error("Error removing push subscription:", error);
      res.status(500).json({ error: "Failed to remove subscription" });
    }
  });

  app.get("/api/push/vapid-public-key", (req, res) => {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    if (!publicKey) {
      return res.status(500).json({ error: "VAPID public key not configured" });
    }
    res.json({ publicKey });
  });

  // Notification preferences routes
  app.get("/api/notifications/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({
        notificationsEnabled: user.notificationsEnabled,
        notificationTime: user.notificationTime,
        timezone: user.timezone,
      });
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });

  app.patch("/api/notifications/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const parsed = updateNotificationPrefsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid preferences data", details: parsed.error.issues });
      }

      const user = await storage.updateNotificationPrefs(userId, parsed.data);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({
        notificationsEnabled: user.notificationsEnabled,
        notificationTime: user.notificationTime,
        timezone: user.timezone,
      });
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      res.status(500).json({ error: "Failed to update preferences" });
    }
  });

  // Native device token routes (for Capacitor mobile apps)
  app.post("/api/device-token", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const parsed = insertDeviceTokenSchema.safeParse({ ...req.body, userId });
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid device token data", details: parsed.error.issues });
      }

      const deviceToken = await storage.saveDeviceToken(
        userId,
        parsed.data.token,
        parsed.data.platform as 'android' | 'ios'
      );
      
      res.status(201).json({ message: "Device token saved", id: deviceToken.id });
    } catch (error) {
      console.error("Error saving device token:", error);
      res.status(500).json({ error: "Failed to save device token" });
    }
  });

  app.delete("/api/device-token", isAuthenticated, async (req: any, res) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ error: "Token is required" });
      }

      await storage.deleteDeviceToken(token);
      res.json({ message: "Device token removed" });
    } catch (error) {
      console.error("Error removing device token:", error);
      res.status(500).json({ error: "Failed to remove device token" });
    }
  });

  // Vercel Cron endpoint for scheduled notifications
  app.get("/api/cron/send-notifications", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
      
      if (authHeader !== expectedAuth) {
        console.error("Unauthorized cron attempt");
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { sendDailyNotificationsForTimezone } = await import("./push-notifications");
      await sendDailyNotificationsForTimezone();
      
      res.json({ success: true, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error("Error in cron job:", error);
      res.status(500).json({ error: "Cron job failed" });
    }
  });

  return httpServer;
}
