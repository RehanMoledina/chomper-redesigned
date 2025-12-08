import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "@shared/schema";
import { sendPasswordResetEmail, sendVerificationEmail } from "./email";

let sessionMiddleware: ReturnType<typeof session> | null = null;

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export function getSession() {
  if (sessionMiddleware) return sessionMiddleware;
  
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  sessionMiddleware = session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
  return sessionMiddleware;
}

let authSetupComplete = false;

export async function setupAuth(app: Express) {
  if (authSetupComplete) return;
  authSetupComplete = true;
  
  app.set("trust proxy", 1);
  app.use(getSession());

  app.post("/api/auth/register", async (req, res) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: parsed.error.issues 
        });
      }

      const { email, password, firstName, lastName } = parsed.data;

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
      });

      // Create verification token and send email
      try {
        const verificationToken = await storage.createEmailVerificationToken(user.id);
        await sendVerificationEmail(email, verificationToken, firstName);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        // Continue with registration even if email fails
      }

      req.session.userId = user.id;
      
      res.status(201).json({ 
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: false,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: parsed.error.issues 
        });
      }

      const { email, password } = parsed.data;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      req.session.userId = user.id;
      
      res.json({ 
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/user", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.post("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Verification token is required" });
      }

      const verificationToken = await storage.getEmailVerificationToken(token);
      if (!verificationToken) {
        return res.status(400).json({ message: "Invalid or expired verification link" });
      }

      if (new Date() > new Date(verificationToken.expiresAt)) {
        return res.status(400).json({ message: "This verification link has expired. Please request a new one." });
      }

      if (verificationToken.usedAt) {
        return res.status(400).json({ message: "This verification link has already been used" });
      }

      const verified = await storage.verifyUserEmail(verificationToken.userId);
      if (!verified) {
        return res.status(500).json({ message: "Failed to verify email" });
      }

      await storage.markVerificationTokenAsUsed(verificationToken.id);

      res.json({ message: "Email verified successfully!" });
    } catch (error) {
      console.error("Verify email error:", error);
      res.status(500).json({ message: "An error occurred. Please try again." });
    }
  });

  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (user.emailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }

      await storage.cleanupExpiredTokens();

      const verificationToken = await storage.createEmailVerificationToken(user.id);
      await sendVerificationEmail(user.email, verificationToken, user.firstName);

      res.json({ message: "Verification email sent. Please check your inbox." });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ message: "Failed to send verification email. Please try again." });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const parsed = forgotPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: parsed.error.issues 
        });
      }

      const { email } = parsed.data;
      const user = await storage.getUserByEmail(email);

      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({ message: "If an account with that email exists, we've sent a password reset link." });
      }

      // Clean up old expired tokens
      await storage.cleanupExpiredTokens();

      // Create reset token
      const token = await storage.createPasswordResetToken(user.id);

      // Send email
      try {
        await sendPasswordResetEmail(email, token, user.firstName);
      } catch (emailError) {
        console.error("Failed to send reset email:", emailError);
        return res.status(500).json({ message: "Failed to send reset email. Please try again later." });
      }

      res.json({ message: "If an account with that email exists, we've sent a password reset link." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "An error occurred. Please try again." });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const parsed = resetPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: parsed.error.issues 
        });
      }

      const { token, password } = parsed.data;

      // Find the token
      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired reset link" });
      }

      // Check if token is expired
      if (new Date() > new Date(resetToken.expiresAt)) {
        return res.status(400).json({ message: "This reset link has expired. Please request a new one." });
      }

      // Check if token was already used
      if (resetToken.usedAt) {
        return res.status(400).json({ message: "This reset link has already been used" });
      }

      // Hash new password and update user
      const hashedPassword = await bcrypt.hash(password, 10);
      const updated = await storage.updateUserPassword(resetToken.userId, hashedPassword);

      if (!updated) {
        return res.status(500).json({ message: "Failed to update password" });
      }

      // Mark token as used
      await storage.markTokenAsUsed(resetToken.id);

      res.json({ message: "Password reset successfully. You can now log in with your new password." });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "An error occurred. Please try again." });
    }
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const user = await storage.getUser(userId);
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  (req as any).userId = userId;
  next();
};
