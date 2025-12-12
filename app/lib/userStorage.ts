// app/lib/userStorage.ts
// Simple file-based user storage (replace with database in production)
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: string;
}

const USERS_FILE = join(process.cwd(), 'data', 'users.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = join(process.cwd(), 'data');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
}

// Read users from file
export function getUsers(): User[] {
  try {
    if (!existsSync(USERS_FILE)) {
      return [];
    }
    const data = readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
}

// Write users to file
export function saveUsers(users: User[]): void {
  try {
    ensureDataDir();
    writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing users file:', error);
    throw error;
  }
}

// Find user by email
export function findUserByEmail(email: string): User | undefined {
  const users = getUsers();
  return users.find(user => user.email.toLowerCase() === email.toLowerCase());
}

// Find user by ID
export function findUserById(id: string): User | undefined {
  const users = getUsers();
  return users.find(user => user.id === id);
}

// Create new user
export function createUser(userData: Omit<User, 'id' | 'createdAt'>): User {
  const users = getUsers();
  const newUser: User = {
    ...userData,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveUsers(users);
  return newUser;
}

// Update user
export function updateUser(userId: string, updates: Partial<User>): User | null {
  const users = getUsers();
  const userIndex = users.findIndex(user => user.id === userId);
  
  if (userIndex === -1) {
    return null;
  }
  
  users[userIndex] = { ...users[userIndex], ...updates };
  saveUsers(users);
  return users[userIndex];
}

