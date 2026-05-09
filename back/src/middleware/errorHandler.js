import mongoose from "mongoose";
import { AppError } from "../utils/AppError.js";

// Detect any Mongoose / MongoDB driver error that indicates the database
// is unreachable or an operation could not be executed in time.
function isDbUnavailable(err) {
  if (!err) return false;
  const msg = err.message ?? "";
  return (
    err.name === "MongoServerSelectionError"   ||  // can't reach cluster
    err.name === "MongoNetworkError"            ||  // TCP-level failure
    err.name === "MongoTimeoutError"            ||  // driver-level timeout
    (err.name === "MongooseError" && msg.includes("buffering timed out")) ||
    msg.includes("ECONNREFUSED")                ||  // nothing listening on port
    msg.includes("ENOTFOUND")                   ||  // DNS failure
    msg.includes("ETIMEDOUT")                   ||  // TCP connect timeout
    msg.includes("querySrv")                    ||  // SRV DNS failure (common on Windows)
    msg.includes("buffering timed out")             // explicit Mongoose buffer error
  );
}

export function errorHandler(err, req, res, _next) {
  // ── Structured app errors ─────────────────────────────────────────────────
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      code:      err.code,
      message:   err.message,
      details:   err.details ?? null,
      requestId: req.requestId,
    });
  }

  // ── MongoDB / Mongoose errors ─────────────────────────────────────────────
  if (isDbUnavailable(err)) {
    console.error("[db-unavailable]", err.message);
    return res.status(503).json({
      code:      "DB_UNAVAILABLE",
      message:   "Database is temporarily unavailable. Please check your MONGODB_URI and ensure the cluster is running.",
      details:   process.env.NODE_ENV === "production" ? null : err.message,
      requestId: req.requestId,
    });
  }

  if (err instanceof mongoose.Error.CastError && err.kind === "ObjectId") {
    return res.status(400).json({
      code:      "BAD_OBJECT_ID",
      message:   `Invalid id for field "${err.path}"`,
      details:   null,
      requestId: req.requestId,
    });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      code:      "VALIDATION",
      message:   err.message,
      details:   Object.values(err.errors).map((e) => e.message),
      requestId: req.requestId,
    });
  }

  // ── Duplicate key (e.g. email already exists) ─────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? "field";
    return res.status(409).json({
      code:      "DUPLICATE_KEY",
      message:   `${field} already exists`,
      details:   null,
      requestId: req.requestId,
    });
  }

  // ── Generic fallback ──────────────────────────────────────────────────────
  console.error("[unhandled]", err);
  const message =
    process.env.NODE_ENV === "production" ? "Internal server error" : err.message;
  return res.status(500).json({
    code:      "INTERNAL",
    message,
    details:   null,
    requestId: req.requestId,
  });
}
