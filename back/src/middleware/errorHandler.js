import mongoose from "mongoose";
import { AppError } from "../utils/AppError.js";

export function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      details: err.details,
      requestId: req.requestId,
    });
  }
  if (err instanceof mongoose.Error.CastError && err.kind === "ObjectId") {
    return res.status(400).json({
      code: "BAD_OBJECT_ID",
      message: `Invalid ObjectId for path "${err.path}"`,
      details: null,
      requestId: req.requestId,
    });
  }
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      code: "VALIDATION",
      message: err.message,
      details: Object.values(err.errors).map((e) => e.message),
      requestId: req.requestId,
    });
  }
  console.error(err);
  const message = process.env.NODE_ENV === "production" ? "Internal server error" : err.message;
  return res.status(500).json({
    code: "INTERNAL",
    message,
    details: null,
    requestId: req.requestId,
  });
}
