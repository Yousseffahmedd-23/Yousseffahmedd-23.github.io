import { Server } from "socket.io";
import { verifyAccess } from "./utils/tokens.js";
import { User } from "./models/User.js";

let _io = null;

export function initSocket(httpServer, origins = []) {
  _io = new Server(httpServer, {
    cors: { origin: origins, credentials: true },
    path: "/socket.io",
  });

  // JWT auth middleware for every socket connection
  _io.use(async (socket, next) => {
    try {
      const raw =
        socket.handshake.auth?.token ??
        (socket.handshake.headers?.authorization ?? "").replace(/^Bearer\s+/i, "");
      if (!raw) return next(new Error("NO_TOKEN"));

      const payload = verifyAccess(raw);
      const user = await User.findById(payload.sub)
        .select("_id email role isActive")
        .lean();
      if (!user?.isActive) return next(new Error("UNAUTHORIZED"));

      socket.data.userId = String(user._id);
      socket.data.email  = user.email;
      socket.data.role   = user.role;
      next();
    } catch {
      next(new Error("AUTH_FAILED"));
    }
  });

  _io.on("connection", (socket) => {
    const { role, userId, email } = socket.data;
    socket.join(`role:${role}`);
    socket.join(`user:${userId}`);
    if (role === "admin") socket.join("room:admin");
    console.log(`[socket] + ${email} (${role})`);
    socket.on("disconnect", () =>
      console.log(`[socket] - ${email} (${role})`),
    );
  });

  return _io;
}

export function getIo() {
  return _io;
}

/**
 * Broadcast a school:sync event to ALL connected clients.
 * Frontends listen for this and also dispatch a DOM
 * CustomEvent("sabboora:school-sync") for component-level reactivity.
 */
export function emitSync(event, data = {}) {
  if (!_io) return;
  _io.emit("school:sync", { event, data, ts: Date.now() });
}
