import 'dotenv/config';
import { db } from '../db';
import { users } from '@shared/schema';
import bcrypt from 'bcryptjs';

async function insertTestUser() {
  // Insert regular test user
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

  // Insert nutritionist test user
  const nutriEmail = 'nutri@example.com';
  const nutriPassword = 'Nutri@1234';
  const nutriHashedPassword = await bcrypt.hash(nutriPassword, 12);
  const [nutri] = await db
    .insert(users)
    .values({
      email: nutriEmail,
      password: nutriHashedPassword,
      firstName: 'Nutri',
      lastName: 'Care',
      age: 30,
      gender: 'female',
      role: 'nutritionist',
      isVerified: true,
    })
    .onConflictDoNothing()
    .returning();

  if (user) {
    console.log('Test user inserted:', user.email);
  } else {
    console.log('Test user already exists.');
  }
  if (nutri) {
    console.log('Nutritionist user inserted:', nutri.email);
  } else {
    console.log('Nutritionist user already exists.');
  }
  process.exit(0);
}

insertTestUser();