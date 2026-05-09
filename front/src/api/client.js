const STORAGE_ACCESS = "mern.accessToken";
const STORAGE_REFRESH = "mern.refreshToken";

export function getAccessToken() {
  return localStorage.getItem(STORAGE_ACCESS);
}

export function setTokens({ accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem(STORAGE_ACCESS, accessToken);
  if (refreshToken) localStorage.setItem(STORAGE_REFRESH, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(STORAGE_ACCESS);
  localStorage.removeItem(STORAGE_REFRESH);
}

/** Base URL prefix in production (same-origin `/api`), or absolute API origin. */
const base = () => import.meta.env.VITE_API_BASE ?? "";

export async function apiFetch(path, opts = {}) {
  const token = getAccessToken();
  const headers = new Headers(opts.headers || {});
  if (!headers.has("Content-Type") && opts.body && typeof opts.body === "object" && !(opts.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const body =
    opts.body && typeof opts.body === "object" && !(opts.body instanceof FormData)
      ? JSON.stringify(opts.body)
      : opts.body;

  let res = await fetch(`${base()}${path}`, { ...opts, headers, body });

  if (res.status === 401 && localStorage.getItem(STORAGE_REFRESH)) {
    const refr = await fetch(`${base()}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: localStorage.getItem(STORAGE_REFRESH) }),
    });
    if (refr.ok) {
      const data = await refr.json();
      if (data.accessToken) localStorage.setItem(STORAGE_ACCESS, data.accessToken);
      const headers2 = new Headers(opts.headers || {});
      headers2.set("Authorization", `Bearer ${getAccessToken()}`);
      const body2 =
        opts.body && typeof opts.body === "object" && !(opts.body instanceof FormData)
          ? JSON.stringify(opts.body)
          : opts.body;
      res = await fetch(`${base()}${path}`, { ...opts, headers: headers2, body: body2 });
    }
  }

  const text = await res.text();
  if (res.status === 204) return null;
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(json?.message || res.statusText || "Request failed");
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}
