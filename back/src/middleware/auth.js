import { AppError } from "../utils/AppError.js";
import { verifyAccess } from "../utils/tokens.js";
import { User } from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const h = req.headers.authorization || "";
    const m = /^Bearer\s+(.+)$/i.exec(h);
    if (!m) throw new AppError(401, "Unauthorized", "AUTH_REQUIRED");
    const payload = verifyAccess(m[1]);
    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) throw new AppError(401, "Unauthorized", "AUTH_INVALID");
    req.user = user;
    req.auth = { sub: String(user._id), role: user.role };
    next();
  } catch (e) {
    if (e instanceof AppError) return next(e);
    return next(new AppError(401, "Invalid or expired token", "AUTH_INVALID"));
  }
}

export function optionalAuth(req, _res, next) {
  const h = req.headers.authorization || "";
  const m = /^Bearer\s+(.+)$/i.exec(h);
  if (!m) return next();
  requireAuth(req, _res, next);
}
