// Admin app uses separate localStorage keys to avoid conflicts
// with the student front/ app running in the same browser.
const ACCESS_KEY  = "sabboora.admin.accessToken";
const REFRESH_KEY = "sabboora.admin.refreshToken";

export const getAccessToken  = () => localStorage.getItem(ACCESS_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);

export function setTokens({ accessToken, refreshToken }) {
  if (accessToken)  localStorage.setItem(ACCESS_KEY,  accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

const base = () => import.meta.env.VITE_API_BASE ?? "";

export async function apiFetch(path, opts = {}) {
  const token   = getAccessToken();
  const headers = new Headers(opts.headers || {});

  if (
    !headers.has("Content-Type") &&
    opts.body &&
    typeof opts.body === "object" &&
    !(opts.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const body =
    opts.body && typeof opts.body === "object" && !(opts.body instanceof FormData)
      ? JSON.stringify(opts.body)
      : opts.body;

  let res;
  try {
    res = await fetch(`${base()}${path}`, { ...opts, headers, body });
  } catch {
    const err = new Error("Cannot connect to server. Make sure the backend is running on port 5000.");
    err.status = 0;
    err.body   = { code: "NETWORK_ERROR" };
    throw err;
  }

  // Auto-refresh on 401
  if (res.status === 401 && getRefreshToken()) {
    try {
      const refr = await fetch(`${base()}/api/auth/refresh`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ refreshToken: getRefreshToken() }),
      });
      if (refr.ok) {
        const data = await refr.json();
        if (data.accessToken) localStorage.setItem(ACCESS_KEY, data.accessToken);
        const h2 = new Headers(opts.headers || {});
        h2.set("Authorization", `Bearer ${getAccessToken()}`);
        const b2 =
          opts.body && typeof opts.body === "object" && !(opts.body instanceof FormData)
            ? JSON.stringify(opts.body)
            : opts.body;
        res = await fetch(`${base()}${path}`, { ...opts, headers: h2, body: b2 });
      }
    } catch {
      clearTokens();
    }
  }

  const text = await res.text();
  if (res.status === 204) return null;

  let json;
  try   { json = text ? JSON.parse(text) : null; }
  catch { json = { raw: text }; }

  if (!res.ok) {
    let message = json?.message || res.statusText || "Request failed";
    if (res.status === 503) {
      message = "Database unavailable. Check your MONGODB_URI in back/.env and make sure the Atlas cluster is running.";
    } else if (res.status === 500) {
      message = json?.message || "Internal server error. Check the backend terminal for details.";
    }
    const err  = new Error(message);
    err.status = res.status;
    err.body   = json;
    throw err;
  }

  return json;
}
