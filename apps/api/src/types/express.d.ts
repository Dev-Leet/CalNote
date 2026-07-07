// apps/api/src/types/express.d.ts
// Augment Express Request to include our JWT payload on req.user

import { JwtPayload } from '../middlewares/authMiddleware';

declare global {
  namespace Express {
    interface User extends JwtPayload {}
  }
}
