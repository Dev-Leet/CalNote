// packages/shared/src/types/index.ts
// All shared TypeScript types used across frontend and backend

// =============================================
// Enums
// =============================================

export enum Platform {
  LEETCODE = 'LEETCODE',
  CODEFORCES = 'CODEFORCES',
  CODECHEF = 'CODECHEF',
}

export enum SyncStatus {
  PENDING = 'PENDING',
  SYNCED = 'SYNCED',
  FAILED = 'FAILED',
  DELETED = 'DELETED',
}

// =============================================
// Core Domain Types
// =============================================

export interface Contest {
  id: string;
  name: string;
  platform: Platform;
  url: string;
  status: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  duration: number;  // minutes
  externalId?: string;
  difficulty?: string;
  phase?: string;
  scrapedAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  userId: string;
  contestId?: string;
  title: string;
  content: string;
  tags: string[];
  isAiGenerated: boolean;
  aiPrompt?: string;
  aiModel?: string;
  createdAt: string;
  updatedAt: string;
  contest?: Pick<Contest, 'id' | 'name' | 'platform'>;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  profilePicture?: string;
  googleId?: string;
  timezone: string;
  calendarId?: string;
  notifyBefore5Min: boolean;
  notifyBefore15Min: boolean;
  notifyBefore1Hour: boolean;
  notifyBefore1Day: boolean;
  enabledPlatforms: EnabledPlatforms;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface EnabledPlatforms {
  LEETCODE: boolean;
  CODEFORCES: boolean;
  CODECHEF: boolean;
}

export interface SyncedContest {
  id: string;
  userId: string;
  contestId: string;
  calendarEventId?: string;
  syncStatus: SyncStatus;
  syncError?: string;
  syncedAt: string;
  updatedAt: string;
  contest?: Contest;
}

// =============================================
// API Request / Response types
// =============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

// Contests
export interface GetContestsQuery {
  platform?: Platform;
  upcoming?: boolean;
  page?: number;
  limit?: number;
}

// Notes
export interface CreateNoteInput {
  contestId?: string;
  title: string;
  content: string;
  tags?: string[];
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  tags?: string[];
}

export interface GenerateNoteInput {
  contestId: string;
  userPrompt?: string;
  skillLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

// Calendar
export interface SyncContestsInput {
  contestIds?: string[]; // Empty means sync all upcoming
}

export interface CalendarStatus {
  connected: boolean;
  lastSync?: string;
  syncedCount: number;
}

// User Settings
export interface UpdateSettingsInput {
  timezone?: string;
  notifyBefore5Min?: boolean;
  notifyBefore15Min?: boolean;
  notifyBefore1Hour?: boolean;
  notifyBefore1Day?: boolean;
  enabledPlatforms?: Partial<EnabledPlatforms>;
}

// =============================================
// Platform metadata (for UI rendering)
// =============================================

export interface PlatformInfo {
  name: string;
  color: string;
  bgColor: string;
  logo: string;
  baseUrl: string;
}

export const PLATFORM_INFO: Record<Platform, PlatformInfo> = {
  [Platform.LEETCODE]: {
    name: 'LeetCode',
    color: '#FFA116',
    bgColor: 'rgba(255, 161, 22, 0.1)',
    logo: '🟡',
    baseUrl: 'https://leetcode.com',
  },
  [Platform.CODEFORCES]: {
    name: 'Codeforces',
    color: '#1F8ACB',
    bgColor: 'rgba(31, 138, 203, 0.1)',
    logo: '🔵',
    baseUrl: 'https://codeforces.com',
  },
  [Platform.CODECHEF]: {
    name: 'CodeChef',
    color: '#B17A2F',
    bgColor: 'rgba(177, 122, 47, 0.1)',
    logo: '🟤',
    baseUrl: 'https://www.codechef.com',
  },
};
