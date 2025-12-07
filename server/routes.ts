import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTaskSchema, updateTaskSchema, updateMonsterStatsSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./auth";

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

  return httpServer;
}
