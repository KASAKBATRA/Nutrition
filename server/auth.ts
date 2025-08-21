import bcrypt from 'bcryptjs';
import { storage } from './storage';
import { sendOTPEmail, generateOTP } from './email';
import { z } from 'zod';

// Validation schemas
export const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  age: z.number().min(13, 'Must be at least 13 years old').max(120, 'Invalid age'),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const otpVerificationSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function registerUser(userData: z.infer<typeof registerSchema>) {
  // Check if user already exists
  const existingUser = await storage.getUserByEmail(userData.email);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Create user
  const user = await storage.createUser({
    email: userData.email,
    password: userData.password,
    firstName: userData.firstName,
    lastName: userData.lastName,
    age: userData.age,
    gender: userData.gender,
  });

  // Generate and send OTP
  const otp = generateOTP();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minutes expiry

  await storage.createOTP({
    email: userData.email,
    otp,
    type: 'registration',
    expiresAt,
  });

  await sendOTPEmail(userData.email, otp, 'registration');

  return { userId: user.id, email: user.email };
}

export async function verifyOTP(email: string, otp: string, type: string) {
  const otpRecord = await storage.getValidOTP(email, otp, type);
  
  if (!otpRecord) {
    throw new Error('Invalid or expired OTP');
  }

  await storage.markOTPUsed(otpRecord.id);

  if (type === 'registration') {
    const user = await storage.getUserByEmail(email);
    if (user) {
      await storage.verifyUser(user.id);
    }
  }

  return { success: true };
}

export async function loginUser(email: string, password: string) {
  const user = await storage.getUserByEmail(email);
  
  if (!user) {
    throw new Error('Invalid email or password');
  }

  if (!user.isVerified) {
    throw new Error('Please verify your email before logging in');
  }

  if (!user.password) {
    throw new Error('Invalid account setup');
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  return user;
}

export async function initiatePasswordReset(email: string) {
  const user = await storage.getUserByEmail(email);
  
  if (!user) {
    throw new Error('No account found with this email address');
  }

  // Generate and send OTP
  const otp = generateOTP();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minutes expiry

  await storage.createOTP({
    email,
    otp,
    type: 'password_reset',
    expiresAt,
  });

  await sendOTPEmail(email, otp, 'password_reset');

  return { success: true };
}

export async function resetPassword(email: string, otp: string, newPassword: string) {
  const otpRecord = await storage.getValidOTP(email, otp, 'password_reset');
  
  if (!otpRecord) {
    throw new Error('Invalid or expired OTP');
  }

  const user = await storage.getUserByEmail(email);
  if (!user) {
    throw new Error('User not found');
  }

  await storage.markOTPUsed(otpRecord.id);
  await storage.updateUserPassword(user.id, newPassword);

  return { success: true };
}

export async function resendOTP(email: string, type: string) {
  const user = await storage.getUserByEmail(email);
  
  if (!user) {
    throw new Error('No account found with this email address');
  }

  // Generate new OTP
  const otp = generateOTP();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 5);

  await storage.createOTP({
    email,
    otp,
    type,
    expiresAt,
  });

  await sendOTPEmail(email, otp, type as 'registration' | 'password_reset');

  return { success: true };
}