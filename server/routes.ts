import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";

// Extend express-session types to include userId
declare module "express-session" {
  interface SessionData {
    userId?: string | number;
  }
}
import { storage } from "./storage";
import { sendMail } from "./email";
import { generateChatResponse } from "./openai";
import { nutritionService, addMealSchema, type AddMealData } from "./nutrition";
import { 
  registerUser, 
  verifyOTP, 
  loginUser, 
  initiatePasswordReset, 
  resetPassword, 
  resendOTP,
  registerSchema,
  loginSchema,
  otpVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from "./auth";
import { z } from "zod";

// Mood logging schema
const moodLogSchema = z.object({
  mood: z.enum(["very-good", "good", "neutral", "bad", "very-bad"]),
  reason: z.string().optional(),
  foodLogId: z.string().optional(),
});

// Session configuration
const PgSession = connectPgSimple(session);

function getUserId(req: any) {
  return req.session?.userId;
}

function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Validate required environment variables
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    throw new Error("SESSION_SECRET environment variable is required for secure sessions");
  }

  // Session middleware
  app.use(session({
    store: new PgSession({
      pool,
      tableName: 'sessions',
      createTableIfMissing: true,
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  }));

  // Development-only debug endpoints to test email sending
  if (process.env.NODE_ENV !== 'production') {
    app.post('/api/debug/send-test-email', async (req: any, res) => {
      try {
        const { email } = req.body || {};
        if (!email) return res.status(400).json({ message: 'email is required in body' });
        // send a simple test email
        await sendMail({
          to: email,
          subject: 'NutriCare++ Test Email',
          text: `This is a test email sent at ${new Date().toISOString()}`,
          html: `<p>This is a <strong>test</strong> email sent at ${new Date().toISOString()}</p>`,
        });
        res.json({ message: `Test email sent to ${email}` });
      } catch (err: any) {
        console.error('Debug test email failed:', err?.message || err, err);
        res.status(500).json({ message: 'Failed to send test email', error: err?.message || String(err) });
      }
    });

    app.get('/api/debug/email-user', (req, res) => {
      const user = (process.env.EMAIL_USER || '').replace(/^"|"$/g, '').trim();
      const masked = user ? user.replace(/^(.).+(@.+)$/, (m, p1, p2) => `${p1}***${p2}`) : 'not-set';
      res.json({ emailUserMasked: masked });
    });
  }

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      const result = await registerUser(validatedData);
      res.json({ 
        message: "Registration successful. Please check your email for verification code.",
        email: result.email 
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ 
        message: error.message || "Registration failed",
        errors: error.errors || []
      });
    }
  });

  app.post('/api/auth/verify-otp', async (req: any, res) => {
    try {
      const { email, otp } = otpVerificationSchema.parse(req.body);
      const result = await verifyOTP(email, otp, 'registration');

      // If registration verification, auto-login the user
      if (result.userId) {
        req.session.userId = result.userId;
        await new Promise<void>((resolve, reject) => {
          req.session.save((err: any) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }

      res.json({
        message: "Email verified successfully. You can now log in.",
        userId: result.userId
      });
    } catch (error: any) {
      console.error("OTP verification error:", error);
      res.status(400).json({ message: error.message || "OTP verification failed" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      console.log('🔑 LOGIN ATTEMPT for email:', email);
      const user = await loginUser(email, password);
      console.log('🔑 LOGIN SUCCESS - User ID:', user.id, 'Name:', user.firstName, user.lastName);
      
      req.session.userId = user.id;
      console.log('🔑 SESSION SET - User ID:', req.session.userId, 'Session ID:', req.session.id);
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Login failed" });
        }
        res.json({ 
          message: "Login successful",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          }
        });
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(400).json({ message: error.message || "Login failed" });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    console.log('🔓 LOGOUT REQUEST - Session:', req.session?.id, 'User ID:', req.session?.userId);
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie('connect.sid');
      console.log('🔓 LOGOUT COMPLETE - Session destroyed');
      res.json({ message: "Logout successful" });
    });
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      await initiatePasswordReset(email);
      res.json({ message: "Password reset code sent to your email" });
    } catch (error: any) {
      console.error("Forgot password error:", error);
      res.status(400).json({ message: error.message || "Failed to send reset code" });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { email, otp, newPassword } = resetPasswordSchema.parse(req.body);
      await resetPassword(email, otp, newPassword);
      res.json({ message: "Password reset successful. You can now log in with your new password." });
    } catch (error: any) {
      console.error("Reset password error:", error);
      res.status(400).json({ message: error.message || "Password reset failed" });
    }
  });

  app.post('/api/auth/resend-otp', async (req, res) => {
    try {
      const { email, type } = req.body;
      await resendOTP(email, type);
      res.json({ message: "New verification code sent to your email" });
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      res.status(400).json({ message: error.message || "Failed to resend code" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User profile routes
  app.get('/api/profile', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getUserProfile(userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post('/api/profile', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profileData = { ...req.body, userId };
      const profile = await storage.upsertUserProfile(profileData);
      res.json(profile);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Food logging routes
  app.get('/api/food-logs', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      console.log('🍽️ FETCHING food logs for user:', userId);
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      const logs = await storage.getFoodLogs(userId, date);
      console.log('🍽️ FOUND', logs.length, 'food logs for user:', userId);
      if (logs.length > 0) {
        console.log('🍽️ FIRST LOG belongs to user:', logs[0].userId, 'Meal:', logs[0].mealName);
      }
      res.json(logs);
    } catch (error) {
      console.error("Error fetching food logs:", error);
      res.status(500).json({ message: "Failed to fetch food logs" });
    }
  });

  app.post('/api/food-logs', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const logData = { ...req.body, userId };
      const log = await storage.createFoodLog(logData);
      res.json(log);
    } catch (error) {
      console.error("Error creating food log:", error);
      res.status(500).json({ message: "Failed to create food log" });
    }
  });

  // Delete food log endpoint
  app.delete('/api/food-logs/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const logId = req.params.id;
      
      // Delete the food log (you'll need to implement this in storage)
      await storage.deleteFoodLog(logId, userId);
      
      res.json({ message: "Food log deleted successfully" });
    } catch (error) {
      console.error("Error deleting food log:", error);
      res.status(500).json({ message: "Failed to delete food log" });
    }
  });

  // Update food log endpoint
  app.put('/api/food-logs/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const logId = req.params.id;
      const mealData = addMealSchema.parse(req.body);
      
      // Get nutrition data from Nutritionix API
      const nutrition = await nutritionService.getNutrition(
        mealData.mealName,
        mealData.quantity,
        mealData.unit
      );

      // Update the food log
      await storage.updateFoodLog(logId, userId, {
        mealName: mealData.mealName,
        mealType: mealData.mealType,
        quantity: mealData.quantity.toString(),
        unit: mealData.unit,
        calories: nutrition.calories.toString(),
        protein: nutrition.protein.toString(),
        carbs: nutrition.carbs.toString(),
        fat: nutrition.fat.toString(),
      });

      res.json({
        message: "Meal updated successfully",
        nutrition: {
          calories: nutrition.calories,
          protein: nutrition.protein,
          carbs: nutrition.carbs,
          fat: nutrition.fat,
        },
      });
    } catch (error: any) {
      console.error("Error updating meal:", error);
      res.status(400).json({ 
        message: error.message || "Failed to update meal",
        errors: error.errors || []
      });
    }
  });

  app.get('/api/food-items', requireAuth, async (req, res) => {
    try {
      const search = req.query.search as string;
      const items = await storage.getFoodItems(search);
      res.json(items);
    } catch (error) {
      console.error("Error fetching food items:", error);
      res.status(500).json({ message: "Failed to fetch food items" });
    }
  });

  // New meal logging endpoints with nutrition calculation
  app.post('/api/add-meal', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const mealData = addMealSchema.parse(req.body);
      
      // Get nutrition data from Nutritionix API
      const nutrition = await nutritionService.getNutrition(
        mealData.mealName,
        mealData.quantity,
        mealData.unit
      );

      // Create or get food item in database
      const foodItem = await storage.createOrGetFoodItem(mealData.mealName, {
        calories: nutrition.calories,
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fats: nutrition.fat,
        fiber: nutrition.fiber,
        sugar: nutrition.sugar,
        sodium: nutrition.sodium,
      });

      // Create food log entry
      const foodLog = await storage.createFoodLog({
        userId,
        foodItemId: foodItem.id,
        mealName: mealData.mealName,
        mealType: mealData.mealType,
        quantity: mealData.quantity.toString(),
        unit: mealData.unit,
        calories: nutrition.calories.toString(),
        protein: nutrition.protein.toString(),
        carbs: nutrition.carbs.toString(),
        fat: nutrition.fat.toString(),
        date: new Date(),
      });

      res.json({
        message: "Meal logged successfully",
        meal: foodLog,
        nutrition: {
          calories: nutrition.calories,
          protein: nutrition.protein,
          carbs: nutrition.carbs,
          fat: nutrition.fat,
        },
      });
    } catch (error: any) {
      console.error("Error adding meal:", error);
      res.status(400).json({ 
        message: error.message || "Failed to add meal",
        errors: error.errors || []
      });
    }
  });

  // Mood logging endpoint
  app.post('/api/mood-log', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const moodData = moodLogSchema.parse(req.body);
      
      // Create mood log entry
      const moodLog = await storage.createMoodLog({
        userId,
        foodLogId: moodData.foodLogId || null,
        mood: moodData.mood,
        reason: moodData.reason || null,
      });

      res.json({
        message: "Mood logged successfully",
        moodLog,
      });
    } catch (error: any) {
      console.error("Error logging mood:", error);
      res.status(400).json({ 
        message: error.message || "Failed to log mood",
        errors: error.errors || []
      });
    }
  });

  app.get('/api/daily-log', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      
      const dailySummary = await storage.getDailyNutritionSummary(userId, date);
      
      res.json({
        date: date.toISOString().split('T')[0],
        totalCalories: Math.round(dailySummary.totalCalories),
        totalProtein: Math.round(dailySummary.totalProtein * 100) / 100,
        totalCarbs: Math.round(dailySummary.totalCarbs * 100) / 100,
        totalFat: Math.round(dailySummary.totalFats * 100) / 100,
        meals: dailySummary.meals.map(meal => ({
          id: meal.id,
          mealName: meal.mealName,
          mealType: meal.mealType,
          quantity: parseFloat(meal.quantity || "0"),
          unit: meal.unit,
          calories: Math.round(parseFloat(meal.calories || "0")),
          protein: Math.round((parseFloat(meal.protein || "0")) * 100) / 100,
          carbs: Math.round((parseFloat(meal.carbs || "0")) * 100) / 100,
          fat: Math.round((parseFloat(meal.fat || "0")) * 100) / 100,
          loggedAt: meal.loggedAt,
        })),
      });
    } catch (error) {
      console.error("Error fetching daily log:", error);
      res.status(500).json({ message: "Failed to fetch daily log" });
    }
  });

  // Food search endpoint for meal modal
  app.get('/api/food-search', requireAuth, async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.json({ common: [] });
      }
      
      const searchResults = await nutritionService.searchFoods(query);
      res.json(searchResults);
    } catch (error) {
      console.error("Error searching foods:", error);
      res.status(500).json({ message: "Failed to search foods" });
    }
  });

  // Water logging routes
  app.get('/api/water-logs', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      const logs = await storage.getWaterLogs(userId, date);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching water logs:", error);
      res.status(500).json({ message: "Failed to fetch water logs" });
    }
  });

  app.post('/api/water-logs', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { date, ...rest } = req.body;
      const logData = { 
        ...rest, 
        userId,
        date: new Date(date)
      };
      const log = await storage.createWaterLog(logData);
      res.json(log);
    } catch (error) {
      console.error("Error creating water log:", error);
      res.status(500).json({ message: "Failed to create water log" });
    }
  });

  // Weight tracking routes
  app.get('/api/weight-logs', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const logs = await storage.getWeightLogs(userId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching weight logs:", error);
      res.status(500).json({ message: "Failed to fetch weight logs" });
    }
  });

  app.post('/api/weight-logs', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const logData = { ...req.body, userId };
      const log = await storage.createWeightLog(logData);
      res.json(log);
    } catch (error) {
      console.error("Error creating weight log:", error);
      res.status(500).json({ message: "Failed to create weight log" });
    }
  });

  // Appointment routes
  app.get('/api/appointments', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const appointments = await storage.getAppointments(userId);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.post('/api/appointments', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const appointmentData = { ...req.body, userId };
      const appointment = await storage.createAppointment(appointmentData);

      // Fetch user and nutritionist info
      const user = await storage.getUser(userId);
      // Find nutritionist userId from nutritionists table
      const nutritionistProfile = await storage.getNutritionists();
      const nutritionist = nutritionistProfile.find(n => n.id === appointmentData.nutritionistId);
      let nutritionistUser: any = null;
      if (nutritionist) {
        nutritionistUser = await storage.getUser(nutritionist.userId);
      }
      if (user && nutritionistUser && nutritionistUser.email) {
        // Fetch health data
        const [foodLogs, waterLogs, weightLogs, profile] = await Promise.all([
          storage.getFoodLogs(userId),
          storage.getWaterLogs(userId),
          storage.getWeightLogs(userId),
          storage.getUserProfile(userId),
        ]);
        // Build report
        const report = {
          user: {
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            email: user.email,
            age: user.age,
            gender: user.gender,
            profile,
          },
          createdAt: new Date().toISOString(),
          foodLogs,
          waterLogs,
          weightLogs,
        };
        // Send email with JSON attachment
        await sendMail({
          to: nutritionistUser.email,
          subject: `New Appointment: ${user.firstName || ''} ${user.lastName || ''}`,
          text: `A new appointment has been booked. The user's health report is attached.`,
          attachments: [
            {
              filename: `health-report-${userId}.json`,
              content: Buffer.from(JSON.stringify(report, null, 2)),
              contentType: 'application/json',
            },
          ],
        });
      }
      res.json(appointment);
    } catch (error) {
      console.error("Error creating appointment:", error);
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  app.get('/api/nutritionists', requireAuth, async (req, res) => {
    try {
      const nutritionists = await storage.getNutritionists();
      res.json(nutritionists);
    } catch (error) {
      console.error("Error fetching nutritionists:", error);
      res.status(500).json({ message: "Failed to fetch nutritionists" });
    }
  });

  // Community routes
  app.get('/api/community/posts', requireAuth, async (req, res) => {
    try {
      const posts = await storage.getCommunityPosts();
      res.json(posts);
    } catch (error) {
      console.error("Error fetching community posts:", error);
      res.status(500).json({ message: "Failed to fetch community posts" });
    }
  });

  app.post('/api/community/posts', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const postData = { ...req.body, userId };
      const post = await storage.createCommunityPost(postData);
      res.json(post);
    } catch (error) {
      console.error("Error creating community post:", error);
      res.status(500).json({ message: "Failed to create community post" });
    }
  });

  app.post('/api/community/posts/:id/like', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const postId = req.params.id;
      await storage.togglePostLike(userId, postId);
      res.json({ message: "Like toggled successfully" });
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  // Friends routes
  app.get('/api/friends', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const friends = await storage.getFriends(userId);
      res.json(friends);
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

  app.get('/api/friends/activity', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const activity = await storage.getFriendActivity(userId);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching friend activity:", error);
      res.status(500).json({ message: "Failed to fetch friend activity" });
    }
  });

  // Notifications routes
  app.get('/api/notifications', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post('/api/notifications/:id/read', requireAuth, async (req: any, res) => {
    try {
      const id = req.params.id;
      await storage.markNotificationRead(id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Chat routes
  app.get('/api/chat/conversations', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const conversations = await storage.getChatConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.post('/api/chat/conversations', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { title, language } = req.body;
      const conversation = await storage.createChatConversation(userId, title, language);
      res.json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  app.get('/api/chat/conversations/:id/messages', requireAuth, async (req, res) => {
    try {
      const conversationId = req.params.id;
      const messages = await storage.getChatMessages(conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/chat/conversations/:id/messages', requireAuth, async (req: any, res) => {
    try {
      const conversationId = req.params.id;
      const { content, language = "en" } = req.body;
      
      // Save user message
      const userMessage = await storage.createChatMessage({
        conversationId,
        role: "user",
        content,
      });

      // Get conversation history
      const messages = await storage.getChatMessages(conversationId);
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Generate AI response
      const aiResponse = await generateChatResponse(chatHistory, language);
      
      // Save AI response
      const assistantMessage = await storage.createChatMessage({
        conversationId,
        role: "assistant",
        content: aiResponse.message,
      });

      res.json({
        userMessage,
        assistantMessage,
      });
    } catch (error) {
      console.error("Error processing chat message:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // User preferences routes
  app.patch('/api/user/preferences', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { language, theme } = req.body;

      const updatedUser = await storage.upsertUser({
        language,
        theme,
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  // Calibration routes
  app.post('/api/calibration/save', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { calibrationData } = req.body;

      if (!Array.isArray(calibrationData) || calibrationData.length === 0) {
        return res.status(400).json({ message: "Invalid calibration data" });
      }

      // Verify user is verified
      const user = await storage.getUser(userId);
      if (!user || !user.isVerified) {
        return res.status(403).json({ message: "User not verified" });
      }

      // Validate and save each utensil calibration
      for (const utensil of calibrationData) {
        if (!utensil.utensilType || typeof utensil.gramsPerUnit !== 'number') {
          return res.status(400).json({ message: "Invalid utensil data format" });
        }

        // Validate positive values
        if (utensil.gramsPerUnit <= 0) {
          return res.status(400).json({ message: "Grams per unit must be positive" });
        }

        await storage.saveUtensilCalibration(
          userId,
          utensil.utensilType,
          utensil.gramsPerUnit
        );
      }

      res.json({
        status: "success",
        message: "Calibration saved successfully"
      });
    } catch (error) {
      console.error("Error saving calibration:", error);
      res.status(500).json({ message: "Failed to save calibration" });
    }
  });

  app.get('/api/calibration', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const calibration = await storage.getUtensilCalibration(userId);

      // If no calibration exists, return defaults
      if (calibration.length === 0) {
        return res.json({
          calibration: [
            { utensilType: 'spoon', gramsPerUnit: 5 },
            { utensilType: 'bowl', gramsPerUnit: 150 },
            { utensilType: 'cup', gramsPerUnit: 240 }
          ],
          isDefault: true
        });
      }

      res.json({
        calibration: calibration.map(c => ({
          utensilType: c.utensilType,
          gramsPerUnit: parseFloat(c.gramsPerUnit || '0')
        })),
        isDefault: false
      });
    } catch (error) {
      console.error("Error fetching calibration:", error);
      res.status(500).json({ message: "Failed to fetch calibration" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
