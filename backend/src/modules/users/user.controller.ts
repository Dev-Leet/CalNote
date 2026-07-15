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
    apiKey: string;
    model: string;
  };
}

const DEFAULT_SLEEP_WINDOW = { start: '23:00', end: '06:00' };

function toPublicPreferences(prefs: IUserPreferences) {
  const { customAiConfig, ...rest } = prefs;
  return {
    ...rest,
    sleepWindow: rest.sleepWindow ?? DEFAULT_SLEEP_WINDOW,
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

    if (body.customAiConfig?.endpoint && !/^https:\/\//.test(body.customAiConfig.endpoint)) {
      throw new AppError('VALIDATION_ERROR', 400, 'customAiConfig.endpoint must be an HTTPS URL');
    }

    // Atomic $set via findOneAndUpdate, NOT load-mutate-save. This is the
    // real fix for the "sleep window reverts" bug: the previous
    // findById -> mutate -> user.save() pattern raced against itself
    // whenever two preference saves (or a save + any other concurrent
    // write to the same User document) overlapped — the loser threw a
    // Mongoose VersionError that was silently swallowed (no onError
    // handler existed on the frontend mutations), so the save appeared to
    // succeed in the UI but never actually persisted. An atomic update has
    // no such race: it targets exact field paths directly against whatever
    // the current DB state is, with nothing to conflict on.
    const setFields: Record<string, unknown> = {};
    if (body.defaultAiProvider !== undefined) setFields['preferences.defaultAiProvider'] = body.defaultAiProvider;
    if (body.sleepWindow !== undefined) setFields['preferences.sleepWindow'] = body.sleepWindow;
    if (body.notifyBeforeContestMins !== undefined) setFields['preferences.notifyBeforeContestMins'] = body.notifyBeforeContestMins;
    if (body.customAiConfig !== undefined) {
      setFields['preferences.customAiConfig'] = {
        endpoint: body.customAiConfig.endpoint,
        model: body.customAiConfig.model,
        apiKeyEncrypted: encryptField(body.customAiConfig.apiKey),
      };
    }

    if (Object.keys(setFields).length === 0) {
      const user = await UserModel.findById(req.user!.userId);
      if (!user) throw new AppError('NOT_FOUND', 404, 'User not found');
      res.status(200).json({ preferences: toPublicPreferences(user.preferences) });
      return;
    }

    // runValidators deliberately omitted: preferences is a single embedded
    // subdocument, and Mongoose's update-validators re-validate the ENTIRE
    // subdocument (plus, in practice, unrelated top-level sibling fields)
    // whenever any nested path within it is touched — not just the field
    // actually being set. That means a document with ANY pre-existing
    // invalid field anywhere would reject EVERY future preferences update,
    // even ones that never touch the broken field — exactly what the
    // backend log showed happening on a legacy test document. The request
    // body is already validated by Zod at the route layer
    // (updatePreferencesSchema), which is the real safety net for shape/
    // format correctness here; Mongoose's document-level required/enum
    // checks have no business blocking an update to a field they don't
    // even concern.
    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: req.user!.userId },
      { $set: setFields },
      { new: true },
    );

    if (!updatedUser) {
      throw new AppError('NOT_FOUND', 404, 'User not found');
    }

    res.status(200).json({ preferences: toPublicPreferences(updatedUser.preferences) });
  } catch (err) {
    next(err);
  }
}