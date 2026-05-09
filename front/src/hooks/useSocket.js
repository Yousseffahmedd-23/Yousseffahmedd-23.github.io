import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const ACCESS_KEY = "mern.accessToken";

/**
 * Connects to the Sabboora Socket.io server and forwards
 * "school:sync" events as DOM CustomEvents("sabboora:school-sync").
 * The student app uses these to reactively refresh data.
 */
export function useSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_KEY);
    if (!token) return;

    const socket = io("/", {
      path: "/socket.io",
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("connect",    () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("school:sync", (payload) => {
      window.dispatchEvent(
        new CustomEvent("sabboora:school-sync", { detail: payload }),
      );
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, []);

  return { connected };
}
