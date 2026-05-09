/**
 * Quick smoke checks (requires running API + Mongo + seeded demo users).
 * Usage: npm run test:api
 */
import "dotenv/config";

const base = process.env.TEST_API_BASE ?? "http://localhost:5000";

async function j(res) {
  const t = await res.text();
  try {
    return t ? JSON.parse(t) : null;
  } catch {
    return { raw: t };
  }
}

function fail(label, detail) {
  console.error(`FAIL: ${label}`, detail);
  process.exitCode = 1;
}

async function main() {
  const h = await fetch(`${base}/api/health`);
  const hj = await j(h);
  if (!h.ok || !hj?.ok) {
    fail("GET /api/health", hj);
    return;
  }
  console.log("OK  GET /api/health");

  const email = process.env.SMOKE_EMAIL ?? "demo-admin@school.local";
  const password = process.env.SMOKE_PASSWORD ?? "DemoPass123!";

  const login = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const lj = await j(login);
  if (!login.ok || !lj?.accessToken) {
    fail("POST /api/auth/login", lj);
    return;
  }
  console.log(`OK  POST /api/auth/login (${email})`);

  const token = lj.accessToken;
  const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const me = await fetch(`${base}/api/me`, { headers: auth });
  const mj = await j(me);
  if (!me.ok || !mj?.user?.role) {
    fail("GET /api/me", mj);
    return;
  }
  console.log("OK  GET /api/me");

  const role = mj.user.role;
  let routePath;
  if (role === "admin") routePath = "/api/admin/classes";
  else if (role === "parent") routePath = "/api/parent/children";
  else if (role === "teacher") routePath = "/api/teacher/classes";
  else routePath = "/api/student/classes";

  const rr = await fetch(`${base}${routePath}`, { headers: auth });
  const rj = await j(rr);
  if (!rr.ok) fail(`GET ${routePath}`, rj);
  else console.log(`OK  GET ${routePath}`);

  console.log(
    role === "admin"
      ? "Smoke OK (admin)."
      : role === "parent"
        ? "Smoke OK (parent)."
        : role === "teacher"
          ? "Smoke OK (teacher)."
          : "Smoke OK (student).",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
