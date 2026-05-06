import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { apiFetch, clearTokens, setTokens } from "../api/client.js";

const AuthContext = createContext(null);

function decodeJwtPayload(token) {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const pad = "=".repeat((4 - (base64.length % 4)) % 4);
    const json = atob(base64 + pad);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => localStorage.getItem("mern.accessToken"));
  const payload = token ? decodeJwtPayload(token) : null;
  const role = payload?.role ?? null;

  const login = useCallback(async (email, password) => {
    clearTokens();
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    setTokenState(data.accessToken);
    return data;
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setTokenState(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      role,
      login,
      logout,
      isAuthenticated: Boolean(token),
    }),
    [token, role, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
