import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { apiFetch, clearTokens, setTokens } from "../api/client.js";

const AuthContext = createContext(null);

function decodeJwt(token) {
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4)));
  } catch { return null; }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(
    () => localStorage.getItem("sabboora.admin.accessToken"),
  );

  const payload = token ? decodeJwt(token) : null;
  const role    = payload?.role ?? null;

  const login = useCallback(async (email, password) => {
    clearTokens();
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });
    // Enforce admin-only access
    if (data.user?.role !== "admin") {
      throw Object.assign(new Error("Access denied — admin role required"), { status: 403 });
    }
    setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    setToken(data.accessToken);
    return data;
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setToken(null);
  }, []);

  const value = useMemo(
    () => ({ token, role, login, logout, isAuthenticated: Boolean(token) }),
    [token, role, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
