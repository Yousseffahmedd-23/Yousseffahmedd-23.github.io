import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { getAccessToken } from "../api/client.js";

/**
 * Connects to the Sabboora Socket.io server using the current JWT.
 * Listens for "school:sync" events and:
 *   1. Calls the provided `onSync` callback
 *   2. Dispatches a DOM CustomEvent("sabboora:school-sync") for global listeners
 */
export function useSocket(onSync) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
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
      // Fire DOM event so any component can react without prop-drilling
      window.dispatchEvent(
        new CustomEvent("sabboora:school-sync", { detail: payload }),
      );
      if (typeof onSync === "function") onSync(payload);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { socket: socketRef.current, connected };
}
