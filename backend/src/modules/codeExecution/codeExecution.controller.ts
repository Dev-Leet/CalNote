import { Request, Response, NextFunction } from 'express';
import { codeExecutionService } from './codeExecution.service';

export async function listRuntimes(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const runtimes = await codeExecutionService.getRuntimes();
    // Trim to language + version + first alias — the frontend dropdown
    // doesn't need Piston's full alias lists.
    const simplified = runtimes.map((r) => ({ language: r.language, version: r.version }));
    res.status(200).json({ runtimes: simplified });
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