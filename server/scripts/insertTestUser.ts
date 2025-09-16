import 'dotenv/config';
import { db } from '../db';
import { users } from '@shared/schema';
import bcrypt from 'bcryptjs';

async function insertTestUser() {
  const email = 'test@example.com';
  const password = 'Test@1234';
  const hashedPassword = await bcrypt.hash(password, 12);
  const [user] = await db
    .insert(users)
    .values({
      email,
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      age: 25,
      gender: 'other',
      role: 'user',
      isVerified: true,
    })
    .onConflictDoNothing()
    .returning();
  if (user) {
    console.log('Test user inserted:', user.email);
  } else {
    console.log('Test user already exists.');
  }
  process.exit(0);
}

insertTestUser();