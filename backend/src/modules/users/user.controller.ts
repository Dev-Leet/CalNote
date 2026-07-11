import { Request, Response, NextFunction } from 'express';
import { UserModel, IUserPreferences } from '../../models/User.model';
import { AppError } from '../../utils/AppError';
import { encryptField } from '../../utils/encryption';
 
interface UpdatePreferencesBody {
  defaultAiProvider?: 'ashna' | 'custom';
  sleepWindow?: { start: string; end: string };
  notifyBeforeContestMins?: number;
  customAiConfig?: {
    endpoint: string;
    apiKey: string; // raw key from client — encrypted before storage, never echoed back
    model: string;
  };
}

/**
 * Strips sensitive fields before returning preferences to the client.
 * apiKeyEncrypted is never included in any response, write-only by design.
 */
function toPublicPreferences(prefs: IUserPreferences) {
  const { customAiConfig, ...rest } = prefs;
  return {
    ...rest,
    customAiConfig: customAiConfig
      ? { endpoint: customAiConfig.endpoint, model: customAiConfig.model, hasApiKey: true }
      : undefined,
  };
}

export async function getPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await UserModel.findById(req.user!.userId);
    if (!user) throw new AppError('NOT_FOUND', 404, 'User not found');
    res.status(200).json({ preferences: toPublicPreferences(user.preferences) });
  } catch (err) {
    next(err);
  }
}

export async function updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as UpdatePreferencesBody;
    const user = await UserModel.findById(req.user!.userId);
    if (!user) throw new AppError('NOT_FOUND', 404, 'User not found');

    if (body.defaultAiProvider) {
      user.preferences.defaultAiProvider = body.defaultAiProvider;
    }
    if (body.sleepWindow) {
      user.preferences.sleepWindow = body.sleepWindow;
    }
    if (typeof body.notifyBeforeContestMins === 'number') {
      user.preferences.notifyBeforeContestMins = body.notifyBeforeContestMins;
    }
    if (body.customAiConfig) {
      if (body.customAiConfig.endpoint && !/^https:\/\//.test(body.customAiConfig.endpoint)) {
        throw new AppError('VALIDATION_ERROR', 400, 'customAiConfig.endpoint must be an HTTPS URL');
      }
      user.preferences.customAiConfig = {
        endpoint: body.customAiConfig.endpoint,
        model: body.customAiConfig.model,
        apiKeyEncrypted: encryptField(body.customAiConfig.apiKey),
      };
    }

    await user.save();
    res.status(200).json({ preferences: toPublicPreferences(user.preferences) });
  } catch (err) {
    next(err);
  }
}
