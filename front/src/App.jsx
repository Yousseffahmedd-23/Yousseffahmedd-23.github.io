import { useCallback, useEffect, useState } from "react";
import "./App.css";
import * as api from "./api/schoolApi.js";
import { useAuth } from "./context/AuthContext.jsx";

/** Minimal API tester — no layout/design; wires role routes to JSON output. */
export default function App() {
  const { role, login, logout, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [health, setHealth] = useState(null);
  const [me, setMe] = useState(null);
  const [out, setOut] = useState(null);
  const [loginError, setLoginError] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [classId, setClassId] = useState("");
  const [studentUserId, setStudentUserId] = useState("");
  const [academicYear, setAcademicYear] = useState("2025-2026");
  const [subjectSlug, setSubjectSlug] = useState("Mathematics");

  const run = useCallback(async (label, fn) => {
    setErr("");
    setOut({ _loading: label });
    try {
      const data = await fn();
      setOut(data);
    } catch (e) {
      setErr(e.body?.message || e.message || String(e));
      setOut(e.body ?? { error: String(e) });
    }
  }, []);

  useEffect(() => {
    api.getHealth().then(setHealth).catch(() => setHealth({ ok: false }));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setMe(null);
      return;
    }
    let cancelled = false;
    api
      .getMe()
      .then((d) => !cancelled && setMe(d))
      .catch(() => !cancelled && setMe({ error: "GET /api/me failed" }));
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  async function onLogin(e) {
    e.preventDefault();
    setLoginError("");
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (err2) {
      setLoginError(err2.body?.message || err2.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  function onPickFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    run("POST /api/files", () => api.uploadFile(fd));
    e.target.value = "";
  }

  return (
    <div className="app">
      <h1>School API (wired)</h1>
      <p>Functional hooks only — use demo users from seed.</p>

      <section>
        <strong>GET /api/health</strong>
        <pre className="card">{JSON.stringify(health, null, 2)}</pre>
      </section>

      <section>
        <strong>Auth</strong>
        {!isAuthenticated ? (
          <form onSubmit={onLogin}>
            <div>
              <label>
                email <input value={email} onChange={(ev) => setEmail(ev.target.value)} autoComplete="username" />
              </label>
            </div>
            <div>
              <label>
                password{" "}
                <input
                  type="password"
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                  autoComplete="current-password"
                />
              </label>
            </div>
            <button type="submit" disabled={busy}>
              {busy ? "…" : "Login"}
            </button>
          </form>
        ) : (
          <p>
            Role: <code>{role}</code> <button type="button" onClick={logout}>Logout</button>
          </p>
        )}
        {loginError ? <p style={{ color: "salmon" }}>{loginError}</p> : null}
      </section>

      <section>
        <strong>GET /api/me</strong>
        <pre className="card">{JSON.stringify(me, null, 2)}</pre>
      </section>

      {isAuthenticated ? (
        <section>
          <strong>Role API calls</strong>
          <p>
            Optional IDs (parent class details / student overview):{" "}
            <input
              placeholder="classId"
              value={classId}
              onChange={(ev) => setClassId(ev.target.value)}
              size={28}
            />{" "}
            <input
              placeholder="studentUserId"
              value={studentUserId}
              onChange={(ev) => setStudentUserId(ev.target.value)}
              size={28}
            />{" "}
            academicYear{" "}
            <input value={academicYear} onChange={(ev) => setAcademicYear(ev.target.value)} size={12} /> subject{" "}
            <input value={subjectSlug} onChange={(ev) => setSubjectSlug(ev.target.value)} size={16} />
          </p>

          {role === "admin" ? (
            <div>
              <button type="button" onClick={() => run("admin users", () => api.adminListUsers())}>
                GET /api/admin/users
              </button>{" "}
              <button type="button" onClick={() => run("admin classes", () => api.adminListClasses())}>
                GET /api/admin/classes
              </button>{" "}
              <button type="button" onClick={() => run("admin settings", () => api.adminSettings())}>
                GET /api/admin/settings
              </button>
            </div>
          ) : null}

          {role === "parent" ? (
            <div>
              <button type="button" onClick={() => run("parent children", () => api.parentChildren())}>
                GET /api/parent/children
              </button>{" "}
              <button type="button" onClick={() => run("parent fees", () => api.parentFees())}>
                GET /api/parent/fees
              </button>{" "}
              <button type="button" onClick={() => run("parent chat", () => api.parentConversations())}>
                GET /api/parent/chat/conversations
              </button>{" "}
              <button
                type="button"
                disabled={!classId || !studentUserId}
                onClick={() =>
                  run("parent class details", () => api.parentClassDetails(classId.trim(), studentUserId.trim()))
                }
              >
                GET parent class details
              </button>{" "}
              <button
                type="button"
                disabled={!studentUserId}
                onClick={() =>
                  run("parent grades by subject", () => api.parentChildGradesBySubject(studentUserId.trim()))
                }
              >
                GET child grades by subject
              </button>{" "}
              <button
                type="button"
                disabled={!studentUserId}
                onClick={() =>
                  run("parent final report", () => api.parentChildFinalReport(studentUserId.trim(), academicYear))
                }
              >
                GET child final report
              </button>
            </div>
          ) : null}

          {role === "teacher" ? (
            <div>
              <button type="button" onClick={() => run("teacher classes", () => api.teacherClasses())}>
                GET /api/teacher/classes
              </button>{" "}
              <button type="button" onClick={() => run("teacher chat", () => api.teacherConversations())}>
                GET /api/teacher/chat/conversations
              </button>
            </div>
          ) : null}

          {role === "student" ? (
            <div>
              <button type="button" onClick={() => run("student classes", () => api.studentClasses())}>
                GET /api/student/classes
              </button>{" "}
              <button type="button" onClick={() => run("student grades", () => api.studentGrades())}>
                GET /api/student/grades
              </button>{" "}
              <button type="button" onClick={() => run("student assignments", () => api.studentAssignments())}>
                GET /api/student/assignments
              </button>{" "}
              <button
                type="button"
                disabled={!classId}
                onClick={() => run("student class overview", () => api.studentClassOverview(classId.trim()))}
              >
                GET student class overview
              </button>{" "}
              <button
                type="button"
                onClick={() => run("student final report", () => api.studentFinalReport(academicYear))}
              >
                GET student final report
              </button>{" "}
              <button
                type="button"
                onClick={() => run("student subject", () => api.studentSubjectDetail(subjectSlug.trim()))}
              >
                GET student subject
              </button>
            </div>
          ) : null}

          <div style={{ marginTop: "0.5rem" }}>
            <label>
              Upload (POST /api/files){" "}
              <input type="file" onChange={onPickFile} />
            </label>
          </div>
        </section>
      ) : null}

      <section>
        <strong>Last response</strong>
        {err ? <p style={{ color: "salmon" }}>{err}</p> : null}
        <pre className="card">{JSON.stringify(out, null, 2)}</pre>
      </section>
    </div>
  );
}
