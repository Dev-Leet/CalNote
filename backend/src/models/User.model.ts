import { Schema, model, Document, Types } from 'mongoose';

export type AiProviderType = 'ashna' | 'custom';

export interface ICustomAiConfig {
  endpoint: string;
  apiKeyEncrypted: string; // encrypted at application layer before persistence, never returned to client
  model: string;
}

export interface ISleepWindow {
  start: string; // "HH:mm", IST
  end: string;   // "HH:mm", IST
}

export interface IProfileLink {
  platform: string; // 'codeforces' | 'leetcode' | 'codechef' | 'atcoder' | 'custom'
  label: string; // display label — the platform name, or a custom label if platform === 'custom'
  url: string;
}

export interface IUserPreferences {
  defaultAiProvider: AiProviderType;
  customAiConfig?: ICustomAiConfig;
  sleepWindow: ISleepWindow;
  timezone: 'Asia/Kolkata';
  notifyBeforeContestMins: number;
  profileLinks?: IProfileLink[];
}

export interface IRefreshToken {
  tokenHash: string;
  deviceId: string;
  issuedAt: Date;
  expiresAt: Date;
  revoked: boolean;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash?: string;
  authProvider: 'local' | 'google';
  /**
   * Google's stable `sub` claim from a verified ID token — used to match
   * returning Google sign-ins. Distinct from googleRefreshToken below:
   * googleId identifies WHO the user is (sign-in), googleRefreshToken grants
   * Calendar API ACCESS (a separate consent grant, requested only when the
   * user explicitly links their calendar via Settings).
   */
  googleId?: string;
  googleRefreshToken?: string;
  preferences: IUserPreferences;
  refreshTokens: IRefreshToken[];
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

const CustomAiConfigSchema = new Schema<ICustomAiConfig>(
  {
    endpoint: { type: String, required: true },
    apiKeyEncrypted: { type: String, required: true, select: false }, // never selected by default
    model: { type: String, required: true },
  },
  { _id: false },
);

const SleepWindowSchema = new Schema<ISleepWindow>(
  {
    start: { type: String, required: true, default: '23:00' },
    end: { type: String, required: true, default: '06:00' },
  },
  { _id: false },
);

const ProfileLinkSchema = new Schema<IProfileLink>(
  {
    platform: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true, maxlength: 40 },
    url: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const UserPreferencesSchema = new Schema<IUserPreferences>(
  {
    defaultAiProvider: {
      type: String,
      enum: ['ashna', 'custom'],
      required: true,
      default: 'ashna',
    },
    customAiConfig: { type: CustomAiConfigSchema, required: false },
    sleepWindow: { type: SleepWindowSchema, required: true, default: () => ({}) },
    timezone: {
      type: String,
      enum: ['Asia/Kolkata'],
      required: true,
      default: 'Asia/Kolkata',
      immutable: true,
    },
    notifyBeforeContestMins: { type: Number, required: true, default: 60 },
    profileLinks: { type: [ProfileLinkSchema], default: undefined },
  },
  { _id: false },
);

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    tokenHash: { type: String, required: true },
    deviceId: { type: String, required: true },
    issuedAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true },
    revoked: { type: Boolean, required: true, default: false },
  },
  { _id: false },
);

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, select: false },
    authProvider: { type: String, enum: ['local', 'google'], required: true },
    googleId: { type: String, index: true, sparse: true, unique: true },
    googleRefreshToken: { type: String, select: false },
    preferences: { type: UserPreferencesSchema, required: true, default: () => ({}) },
    refreshTokens: { type: [RefreshTokenSchema], default: [] },
    role: { type: String, enum: ['user', 'admin'], required: true, default: 'user' },
  },
  { timestamps: true },
);

UserSchema.index({ 'refreshTokens.tokenHash': 1 });

export const UserModel = model<IUser>('User', UserSchema);
