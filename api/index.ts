import { createApp } from "../server/app";
import { serveStatic } from "../server/static";

let appPromise: ReturnType<typeof createApp> | null = null;

async function getApp() {
  if (!appPromise) {
    appPromise = createApp().then(({ app, httpServer }) => {
      // Serve static files in production
      if (process.env.NODE_ENV === "production") {
        serveStatic(app);
      }
      return { app, httpServer };
    });
  }
  return appPromise;
}

export default async function handler(req: any, res: any) {
  const { app } = await getApp();
  return app(req, res);
}
