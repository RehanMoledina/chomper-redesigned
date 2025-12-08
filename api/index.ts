import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";

import { registerRoutes } from "../server/routes";

let app: express.Express | null = null;

async function getApp() {
  if (app) return app;

  app = express();
  
  app.use(express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  }));
  
  app.use(express.urlencoded({ extended: false }));
  
  app.use((req, res, next) => {
    const start = Date.now();
    const originalResJson = res.json;
    
    res.json = function (bodyJson, ...args) {
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (req.path.startsWith("/api")) {
        console.log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
      }
    });
    
    next();
  });
  
  const httpServer = createServer(app);
  await registerRoutes(httpServer, app);
  
  const distPath = path.resolve(__dirname, "../dist");
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.use("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }
  
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error(err);
  });
  
  return app;
}

export default async function handler(req: any, res: any) {
  try {
    const application = await getApp();
    return application(req, res);
  } catch (error) {
    console.error("Handler error:", error);
    res.status(500).json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
