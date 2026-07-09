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

export interface IUserPreferences {
  defaultAiProvider: AiProviderType;
  customAiConfig?: ICustomAiConfig;
  sleepWindow: ISleepWindow;
  timezone: 'Asia/Kolkata'; // locked per SRS constraint 3.4.3 — not user-editable
  notifyBeforeContestMins: number;
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
      immutable: true, // SRS 3.4.3: IST is enforced app-wide, not configurable per user
    },
    notifyBeforeContestMins: { type: Number, required: true, default: 60 },
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
    googleRefreshToken: { type: String, select: false },
    preferences: { type: UserPreferencesSchema, required: true, default: () => ({}) },
    refreshTokens: { type: [RefreshTokenSchema], default: [] },
    role: { type: String, enum: ['user', 'admin'], required: true, default: 'user' },
  },
  { timestamps: true },
);

UserSchema.index({ 'refreshTokens.tokenHash': 1 });

export const UserModel = model<IUser>('User', UserSchema);
