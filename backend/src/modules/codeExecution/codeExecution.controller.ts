import { Request, Response, NextFunction } from 'express';
import { codeExecutionService } from './codeExecution.service';

export async function listSupportedLanguages(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const languages = codeExecutionService.getSupportedLanguages();
    res.status(200).json({ languages });
  } catch (err) {
    next(err);
  }
}

export async function runCode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { language, code, stdin } = req.body;
    const result = await codeExecutionService.runCode({ language, code, stdin });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}