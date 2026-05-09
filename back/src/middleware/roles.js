import { AppError } from "../utils/AppError.js";

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new AppError(401, "Unauthorized", "AUTH_REQUIRED"));
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, "Forbidden", "FORBIDDEN"));
    }
    next();
  };
}
